import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { polymarketEnabled } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// BTC/ETH 历史最高价（ATH）
const ATH: Record<string, number> = { BTC: 125835, ETH: 4953.73 };

// 内存缓存（5分钟）
const translateCache = new Map<string, { bull: string; bear: string }>();
const groupCache = new Map<string, { data: PredictionGroup[]; ts: number }>();

interface PredictionItem {
  price: number | null;
  priceLabel: string;
  yesProb: number;
  noProb: number;
  question: string;
  endDate: string | null;
}

interface PredictionGroup {
  rawTitle: string;
  titleZh: string | null;
  bullTitleZh: string | null;
  bearTitleZh: string | null;
  contractType: string;
  isBull: boolean;
  items: PredictionItem[];
}

async function translateGroupTitle(title: string): Promise<{ bull: string; bear: string }> {
  if (translateCache.has(title)) return translateCache.get(title)!;
  try {
    const prompt = [
      '将以下加密货币预测市场的系列标题翻译成简体中文。需要输出两个标题：',
      '第一行：正向标题（涨区）——描述"价格会上涨到这个价位"的问题',
      '第二行：反向标题（跌区/稳健）——描述"价格不会到达这个价位，持有到期稳健收益"的问题',
      '',
      '严格规则：',
      '1) 保留价格数字和货币单位（如 $2,000）；将占位符 $PRICE 替换为"以下价格"两个字',
      '2) 删除标题里单独出现的字母 y/Y/b/B（不是单词的一部分）',
      '3) 正向标题用词：触及（reach/hit）、守住（above at expiry）、跌至（drop to）、历史最高价（ATH）',
      '4) 反向标题用词：不会触及、不会守住（跌破）、不会跌至、不会创历史新高',
      '5) 标题要自然流畅，如同金融资讯标题，不要生硬拼凑',
      '6) 只输出两行，不加任何标签、解释或引号',
      '',
      '原文：',
      title,
    ].join('\n');

    const result = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
    });
    const content = result?.choices?.[0]?.message?.content;
    const raw = (typeof content === 'string' ? content : '').trim() || '';
    const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const bullTitle = (lines[0] || title).replace(/\$PRICE/g, '以下价格');
    const bearTitle = (lines[1] || bullTitle).replace(/\$PRICE/g, '以下价格');
    const out = { bull: bullTitle, bear: bearTitle };
    translateCache.set(title, out);
    return out;
  } catch {
    const fallback = { bull: title, bear: title };
    return fallback;
  }
}

function extractPrice(question: string): number | null {
  const m = question.match(/\$([0-9,]+(?:\.[0-9]+)?)\s*([KkMmBb]?)/);
  if (!m) return null;
  let num = parseFloat(m[1].replace(/,/g, ''));
  const suffix = m[2].toLowerCase();
  if (suffix === 'k') num *= 1000;
  if (suffix === 'm') num *= 1000000;
  if (suffix === 'b') num *= 1000000000;
  return num;
}

function isBullQuestion(question: string): boolean {
  const q = question.toLowerCase();
  if (/\bdrop\b|\bfall\b|\bdip\b|\bbelow\b|\bunder\b|\blow(er)?\b/.test(q)) return false;
  return true;
}

function getContractType(question: string): string {
  const q = question.toLowerCase();
  if (/all.time high|ath/.test(q)) return 'ath';
  if (/between/.test(q)) return 'range';
  if (/\breach\b|\bhit\b|\btouch\b|\bdrop to\b|\bfall to\b|\bdip to\b/.test(q)) return 'reach';
  return 'expiry';
}

async function fetchPolymarketEvents(coin: string): Promise<PredictionGroup[]> {
  const keyword = coin === 'BTC' ? 'bitcoin' : 'ethereum';
  const excludeKeywords = ['megaeth', 'wbtc', 'wrapped', 'lbtc', 'stbtc', 'cbbtc', 'tbtc', 'ebtc'];
  // 排除 "Up or Down" 短线题（5分钟/15分钟涨跌，无具体价格目标）
  const excludeUpOrDown = /up or down|up-or-down/i;

  const excludeNonPrice = [
    'gas', 'gwei', 'etf flow', 'bitmine', 'flipped', 'flip bitcoin', 'volatility index',
    'eth/btc', 'eth-btc', 'dominance', 'market cap', 'market share', 'reserve', 'treasury',
    'strategic', 'national', 'election', 'vote', 'regulation', 'sec ', 'lawsuit', 'hack',
    'exploit', 'merge', 'upgrade', 'fork', 'staking', 'validator', 'layer 2', 'l2 ', 'rollup',
    'dex ', 'defi ', 'nft', 'airdrop', 'burn rate', 'supply', 'issuance', 'inflation', 'deflation',
  ];

  const url = `https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false&tag_slug=${keyword}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);
  const data: any[] = await res.json();

  const events: { question: string; yesProb: number; noProb: number; endDate: string | null }[] = [];
  for (const event of data) {
    const q = (event.title || event.question || '').toLowerCase();
    if (excludeKeywords.some((k) => q.includes(k))) continue;
    if (excludeNonPrice.some((k) => q.includes(k))) continue;
    // 排除 Up or Down 短线题
    if (excludeUpOrDown.test(event.title || event.question || '')) continue;
    if (!event.markets?.length) continue;

    for (const market of event.markets) {
      if (market.closed || market.archived) continue;
      const outcomes = market.outcomePrices;
      if (!outcomes) continue;
      let prices: string[];
      try {
        prices = typeof outcomes === 'string' ? JSON.parse(outcomes) : outcomes;
      } catch {
        continue;
      }
      if (!Array.isArray(prices) || prices.length < 2) continue;
      const yesProb = parseFloat(prices[0]);
      const noProb = parseFloat(prices[1]);
      if (isNaN(yesProb) || isNaN(noProb)) continue;

      events.push({
        question: market.question || event.title || '',
        yesProb,
        noProb,
        endDate: market.endDate || event.endDate || null,
      });
    }
  }

  // 分组
  const groups = new Map<string, PredictionGroup>();
  for (const event of events) {
    const q = event.question;
    const price = extractPrice(q);
    const key = q.replace(/\$[0-9,]+(?:\.[0-9]+)?\s*[KkMmBb]?/g, '$PRICE').trim();
    if (!groups.has(key)) {
      groups.set(key, {
        rawTitle: key.replace(/\$PRICE/g, '目标价格'),
        titleZh: null,
        bullTitleZh: null,
        bearTitleZh: null,
        contractType: getContractType(q),
        isBull: isBullQuestion(q),
        items: [],
      });
    }
    const priceLabel = (() => {
      const raw = q.match(/\$[0-9,]+(?:\.[0-9]+)?\s*[KkMmBb]?/)?.[0];
      if (raw) return raw.replace(/\s*[bB]$/, '');
      if (/all.time high|\bath\b/i.test(q)) {
        const athVal = ATH[coin.toUpperCase()];
        return athVal ? `$${athVal.toLocaleString('en-US')}` : '?';
      }
      return '?';
    })();
    groups.get(key)!.items.push({ price, priceLabel, yesProb: event.yesProb, noProb: event.noProb, question: q, endDate: event.endDate });
  }

  // 按价格排序（降序）
  for (const g of Array.from(groups.values())) {
    g.items.sort((a: PredictionItem, b: PredictionItem) => (b.price || 0) - (a.price || 0));
  }

  // 翻译标题
  const groupArr = Array.from(groups.values());
  await Promise.all(
    groupArr.map(async (g) => {
      const zh = await translateGroupTitle(g.rawTitle);
      g.bullTitleZh = zh.bull;
      g.bearTitleZh = zh.bear;
      g.titleZh = zh.bull;
    })
  );

  return groupArr;
}

export const predictionRouter = router({
  // 获取正式展示数据（已勾选的，或全部）
  getEvents: publicProcedure
    .input(z.object({ coin: z.enum(['BTC', 'ETH']) }))
    .query(async ({ input }) => {
      const { coin } = input;
      const cacheKey = coin;
      const cached = groupCache.get(cacheKey);
      let groups: PredictionGroup[];

      if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        groups = cached.data;
      } else {
        groups = await fetchPolymarketEvents(coin);
        groupCache.set(cacheKey, { data: groups, ts: Date.now() });
      }

      // 查询已勾选的题目
      const db = await getDb();
      if (!db) return { groups };
      const enabledRows = await db.select().from(polymarketEnabled).where(
        and(eq(polymarketEnabled.coin, coin), eq(polymarketEnabled.enabled, true))
      );
      const enabledKeys = new Set(enabledRows.map((r) => r.groupKey));

      // 无勾选时显示全部，有勾选时只显示勾选的
      const data = enabledKeys.size > 0 ? groups.filter((g) => enabledKeys.has(g.rawTitle)) : groups;
      return { groups: data };
    }),

  // 获取全量数据（数据库管理视图）
  getAllEvents: publicProcedure
    .input(z.object({ coin: z.enum(['BTC', 'ETH']) }))
    .query(async ({ input }) => {
      const { coin } = input;
      const cacheKey = coin;
      const cached = groupCache.get(cacheKey);
      let groups: PredictionGroup[];

      if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        groups = cached.data;
      } else {
        groups = await fetchPolymarketEvents(coin);
        groupCache.set(cacheKey, { data: groups, ts: Date.now() });
      }

      const db2 = await getDb();
      if (!db2) return { groups: groups.map((g) => ({ ...g, enabled: false })) };
      const enabledRows = await db2.select().from(polymarketEnabled).where(
        and(eq(polymarketEnabled.coin, coin), eq(polymarketEnabled.enabled, true))
      );
      const enabledKeys = new Set(enabledRows.map((r) => r.groupKey));
      const data = groups.map((g) => ({ ...g, enabled: enabledKeys.has(g.rawTitle) }));
      return { groups: data };
    }),

  // 单个题目勾选/取消
  toggle: publicProcedure
    .input(z.object({ coin: z.enum(['BTC', 'ETH']), key: z.string(), checked: z.boolean() }))
    .mutation(async ({ input }) => {
      const { coin, key, checked } = input;
      // upsert
      const db = await getDb();
      if (!db) return { ok: false };
      await db.insert(polymarketEnabled).values({ coin, groupKey: key, enabled: checked })
        .onDuplicateKeyUpdate({ set: { enabled: checked } });
      return { ok: true };
    }),

  // 批量勾选/取消
  toggleAll: publicProcedure
    .input(z.object({ coin: z.enum(['BTC', 'ETH']), keys: z.array(z.string()), checked: z.boolean() }))
    .mutation(async ({ input }) => {
      const { coin, keys, checked } = input;
      const db = await getDb();
      if (!db) return { ok: false };
      for (const key of keys) {
        await db.insert(polymarketEnabled).values({ coin, groupKey: key, enabled: checked })
          .onDuplicateKeyUpdate({ set: { enabled: checked } });
      }
      return { ok: true };
    }),

  // 手动刷新缓存
  refresh: publicProcedure
    .input(z.object({ coin: z.enum(['BTC', 'ETH']) }))
    .mutation(async ({ input }) => {
      groupCache.delete(input.coin);
      return { ok: true };
    }),
});
