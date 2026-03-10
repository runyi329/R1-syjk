import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type CoinType = "BTC" | "ETH";
type ViewMode = "events" | "btcdb" | "ethdb";

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
  enabled?: boolean;
}

// 格式化工具
function fmtMultiplier(prob: number): string {
  if (prob <= 0) return "?";
  const m = 1 / prob;
  if (m >= 1000) return "翻" + Math.round(m / 100) * 100 + "倍";
  if (m >= 100) return "翻" + Math.round(m) + "倍";
  if (m >= 10) return "翻" + m.toFixed(0) + "倍";
  return "翻" + m.toFixed(1) + "倍";
}

function fmtAnnualized(noProb: number, endDate: string | null): string {
  if (noProb <= 0 || noProb >= 1) return (noProb * 100).toFixed(1) + "%";
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  const daysLeft = end ? Math.max(1, (end.getTime() - now.getTime()) / 86400000) : 30;
  const returnRate = 1 / noProb - 1;
  const annualized = returnRate * (365 / daysLeft);
  const pct = annualized * 100;
  if (pct >= 10000) return "年化" + Math.round(pct / 1000) * 1000 + "%";
  if (pct >= 1000) return "年化" + Math.round(pct / 100) * 100 + "%";
  if (pct >= 100) return "年化" + Math.round(pct) + "%";
  return "年化" + pct.toFixed(1) + "%";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return "已截止";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天截止";
  if (days < 30) return days + "天后截止";
  const months = Math.floor(days / 30);
  return months < 12 ? months + "个月后截止" : Math.floor(months / 12) + "年后截止";
}

function highlightBullTitle(title: string): string {
  return title.replace(
    /(触及|守住|达到|涨到|涨至|超过|高于|创历史新高|历史最高价)/g,
    '<span style="color:#C62828;font-weight:700">$1</span>'
  );
}

function highlightBearTitle(title: string): string {
  return title.replace(
    /(不会触及|不会守住|不会达到|不会涨到|不会超过|跌破|跌至|跌到|不会创历史新高|不会跌至)/g,
    '<span style="color:#1565C0;font-weight:700">$1</span>'
  );
}

// 合约说明
function getContractDesc(group: PredictionGroup, coin: string): string {
  const type = group.contractType || "expiry";
  const coinName = coin === "BTC" ? "比特币" : "以太坊";
  const priceSource = `价格来源：币安 (Binance) ${coin}/USDT 现货市场价格`;
  if (type === "reach") {
    return `《触及合约》\n\n在截止日期之前，只要 ${coinName} 价格曾经触及目标价位，即判定胜出。\n\n${priceSource}\n\n结算方式：Polymarket 平台自动结算。`;
  }
  if (type === "ath") {
    return `《历史新高合约》\n\n在截止日期之前，只要 ${coinName} 价格突破历史最高价，即判定胜出。\n\n${priceSource}\n\n结算方式：Polymarket 平台自动结算。`;
  }
  if (type === "range") {
    return `《区间合约》\n\n到期日当天，${coinName} 价格必须落在指定价格区间内，才判定胜出。\n\n${priceSource}\n\n结算方式：Polymarket 平台自动结算。`;
  }
  return `《到期日合约》\n\n到期日当天，${coinName} 价格必须高于（或低于）目标价位，才判定胜出。中途涨过不算。\n\n${priceSource}\n\n结算方式：Polymarket 平台自动结算，赢得方获得全部头寸金额。`;
}

export default function Prediction() {
  const [activeCoin, setActiveCoin] = useState<CoinType>("ETH");
  const [viewMode, setViewMode] = useState<ViewMode>("events");
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [infoGroup, setInfoGroup] = useState<PredictionGroup | null>(null);

  const dbCoin: CoinType = viewMode === "btcdb" ? "BTC" : viewMode === "ethdb" ? "ETH" : activeCoin;

  const eventsQuery = trpc.prediction.getEvents.useQuery(
    { coin: activeCoin },
    { enabled: viewMode === "events", retry: 1 }
  );

  const allEventsQuery = trpc.prediction.getAllEvents.useQuery(
    { coin: dbCoin },
    { enabled: viewMode === "btcdb" || viewMode === "ethdb", retry: 1 }
  );

  const toggleMutation = trpc.prediction.toggle.useMutation({
    onSuccess: () => allEventsQuery.refetch(),
  });

  const toggleAllMutation = trpc.prediction.toggleAll.useMutation({
    onSuccess: () => allEventsQuery.refetch(),
  });

  const refreshMutation = trpc.prediction.refresh.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
    },
  });

  const handleVote = useCallback((key: string) => {
    setVotes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleToggle = (coin: CoinType, key: string, checked: boolean) => {
    toggleMutation.mutate({ coin, key, checked });
  };

  const handleToggleAll = (coin: CoinType, keys: string[], checked: boolean) => {
    toggleAllMutation.mutate({ coin, keys, checked });
  };

  const groups: PredictionGroup[] = eventsQuery.data?.groups || [];
  const allGroups: (PredictionGroup & { enabled?: boolean })[] = allEventsQuery.data?.groups || [];

  const isLoading = viewMode === "events" ? eventsQuery.isLoading : allEventsQuery.isLoading;
  const isError = viewMode === "events" ? eventsQuery.isError : allEventsQuery.isError;

  const renderBullSection = (group: PredictionGroup, gi: number) => {
    const bullItems = group.items.filter((it) => it.yesProb < 0.5);
    if (bullItems.length === 0) return null;
    const dateStr = group.items[0]?.endDate ? formatDate(group.items[0].endDate) : "";
    const rawTitle = group.bullTitleZh || group.titleZh || group.rawTitle;
    const bullTitleHtml = highlightBullTitle(rawTitle);
    const hasBullHighlight = bullTitleHtml.includes("color:#C62828");
    const finalBullHtml = hasBullHighlight
      ? bullTitleHtml
      : `<span style="color:#C62828;font-weight:700">涨：</span>${rawTitle}`;

    return (
      <div key={`bull-${gi}`} style={{ background: "white", borderRadius: 12, overflow: "hidden", margin: "0 12px 10px", border: "1px solid #E8E8E8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px 8px", borderBottom: "1px solid #F0F0F0" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", flex: 1 }} dangerouslySetInnerHTML={{ __html: finalBullHtml }} />
          <button
            onClick={() => setInfoGroup(group)}
            style={{ background: "none", border: "1.5px solid #CCC", borderRadius: "50%", width: 16, height: 16, fontSize: 11, color: "#BBB", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 6 }}
          >?</button>
          {dateStr && <span style={{ fontSize: 11, color: "#AAA", flexShrink: 0, marginLeft: 8 }}>{dateStr}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {bullItems.map((item, ii) => {
            const key = `${gi}-bull-${ii}`;
            const selected = votes[key];
            return (
              <div
                key={ii}
                onClick={() => handleVote(key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderBottom: ii < bullItems.length - 2 ? "1px solid #F5F5F5" : "none",
                  borderRight: ii % 2 === 0 ? "1px solid #F5F5F5" : "none",
                  cursor: "pointer", background: selected ? "#FFF5F5" : "white", gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#222", flexShrink: 0, minWidth: 52 }}>{item.priceLabel}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 7px", borderRadius: 5, flexShrink: 0, whiteSpace: "nowrap",
                  background: selected ? "#C62828" : "#FFF0F0",
                  color: selected ? "white" : "#C62828",
                  border: `1px solid ${selected ? "#C62828" : "#FFCDD2"}`,
                }}>{fmtMultiplier(item.yesProb)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBearSection = (group: PredictionGroup, gi: number) => {
    const validItems = group.items.filter((it) => it.noProb > 0.01 && it.noProb < 0.999);
    if (validItems.length === 0) return null;
    const dateStr = group.items[0]?.endDate ? formatDate(group.items[0].endDate) : "";
    const endDate = group.items[0]?.endDate || null;
    const rawBearTitle = group.bearTitleZh || group.titleZh || group.rawTitle;
    const bearTitleHtml = highlightBearTitle(rawBearTitle);
    const hasBearHighlight = bearTitleHtml.includes("color:#1565C0");
    const finalBearHtml = hasBearHighlight
      ? bearTitleHtml
      : `<span style="color:#1565C0;font-weight:700">跌：</span>${rawBearTitle}`;

    return (
      <div key={`bear-${gi}`} style={{ background: "white", borderRadius: 12, overflow: "hidden", margin: "0 12px 10px", border: "1px solid #E8E8E8" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px 8px", borderBottom: "1px solid #F0F0F0" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", flex: 1 }} dangerouslySetInnerHTML={{ __html: finalBearHtml }} />
          <button
            onClick={() => setInfoGroup(group)}
            style={{ background: "none", border: "1.5px solid #CCC", borderRadius: "50%", width: 16, height: 16, fontSize: 11, color: "#BBB", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 6 }}
          >?</button>
          {dateStr && <span style={{ fontSize: 11, color: "#AAA", flexShrink: 0, marginLeft: 8 }}>{dateStr}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {validItems.map((item, ii) => {
            const key = `${gi}-bear-${ii}`;
            const selected = votes[key];
            const displayText = item.noProb >= 0.5 ? fmtAnnualized(item.noProb, endDate) : fmtMultiplier(item.noProb);
            return (
              <div
                key={ii}
                onClick={() => handleVote(key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderBottom: ii < validItems.length - 2 ? "1px solid #F5F5F5" : "none",
                  borderRight: ii % 2 === 0 ? "1px solid #F5F5F5" : "none",
                  cursor: "pointer", background: selected ? "#F0F5FF" : "white", gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#222", flexShrink: 0, minWidth: 52 }}>{item.priceLabel}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 7px", borderRadius: 5, flexShrink: 0, whiteSpace: "nowrap",
                  background: selected ? "#1565C0" : "#E8F0FE",
                  color: selected ? "white" : "#1565C0",
                  border: `1px solid ${selected ? "#1565C0" : "#BBDEFB"}`,
                }}>{displayText}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div style={{ padding: "0 0 32px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: "white", borderRadius: 12, margin: "0 12px 10px", padding: 12, border: "1px solid #E8E8E8" }}>
          <div style={{ height: 13, width: "55%", background: "#EFEFEF", borderRadius: 4, marginBottom: 10, animation: "pulse 1.8s infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <div style={{ height: 12, width: 52, background: "#EFEFEF", borderRadius: 4 }} />
                <div style={{ height: 20, width: 52, background: "#EFEFEF", borderRadius: 5 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDbView = () => {
    const coin = dbCoin;
    const enabledKeys = new Set(allGroups.filter((g) => g.enabled).map((g) => g.rawTitle));
    const allKeys = allGroups.map((g) => g.rawTitle);
    const allChecked = allKeys.length > 0 && allKeys.every((k) => enabledKeys.has(k));

    return (
      <div style={{ paddingBottom: 32 }}>
        <div style={{ background: "white", borderRadius: 12, margin: "8px 12px", border: "1px solid #E8E8E8", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px 8px", borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555", flex: 1 }}>
              {coin} 题目管理（共 {allGroups.length} 组）
            </span>
            <button
              onClick={() => handleToggleAll(coin, allKeys, !allChecked)}
              style={{ fontSize: 11, color: "#1565C0", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
            >
              {allChecked ? "全部取消" : "全部勾选"}
            </button>
          </div>
          {allGroups.map((group, gi) => (
            <div key={gi} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderBottom: gi < allGroups.length - 1 ? "1px solid #F0F0F0" : "none", background: "white" }}>
              <input
                type="checkbox"
                checked={!!group.enabled}
                onChange={(e) => handleToggle(coin, group.rawTitle, e.target.checked)}
                style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, cursor: "pointer", accentColor: "#1565C0" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4 }}>
                  {group.bullTitleZh || group.titleZh || group.rawTitle}
                </div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                  {group.contractType} · {group.items.length} 个档位
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#888", background: "#F5F5F5", borderRadius: 10, padding: "2px 7px", flexShrink: 0 }}>
                {group.items.length}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "#F2F2F7", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

      {/* 顶部导航 */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #E8E8E8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, marginLeft: -2 }}
          >
            <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111", flex: 1 }}>加密货币竞猜</span>
          <button
            onClick={() => refreshMutation.mutate({ coin: activeCoin })}
            disabled={refreshMutation.isPending}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#C62828", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 14px 10px", flexWrap: "wrap" }}>
          <button
            onClick={() => { setActiveCoin("BTC"); setViewMode("events"); }}
            style={{ padding: "5px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "events" && activeCoin === "BTC" ? "#C62828" : "#EFEFEF", color: viewMode === "events" && activeCoin === "BTC" ? "white" : "#888" }}
          >₿ BTC</button>
          <button
            onClick={() => { setActiveCoin("ETH"); setViewMode("events"); }}
            style={{ padding: "5px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "events" && activeCoin === "ETH" ? "#C62828" : "#EFEFEF", color: viewMode === "events" && activeCoin === "ETH" ? "white" : "#888" }}
          >Ξ ETH</button>
          <button
            onClick={() => setViewMode("btcdb")}
            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "btcdb" ? "#1565C0" : "#EFEFEF", color: viewMode === "btcdb" ? "white" : "#555" }}
          >₿ BTC数据库</button>
          <button
            onClick={() => setViewMode("ethdb")}
            style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "ethdb" ? "#1565C0" : "#EFEFEF", color: viewMode === "ethdb" ? "white" : "#555" }}
          >Ξ ETH数据库</button>
        </div>
      </div>

      {/* 说明条 */}
      {viewMode === "events" && (
        <div style={{ margin: "8px 12px 6px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, color: "#92400E" }}>
          数据来自 Polymarket 预测市场，仅供参考，不构成投资建议
        </div>
      )}

      {/* 内容区 */}
      {isLoading && renderSkeleton()}

      {isError && (
        <div style={{ margin: "20px 12px", padding: 16, background: "#FFF5F5", borderRadius: 12, border: "1px solid #FFCDD2", textAlign: "center", color: "#C62828", fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>数据加载失败</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>可能是网络问题或 Polymarket API 暂时不可用</div>
          <button
            onClick={() => viewMode === "events" ? eventsQuery.refetch() : allEventsQuery.refetch()}
            style={{ padding: "8px 20px", background: "#C62828", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >重试</button>
        </div>
      )}

      {!isLoading && !isError && (viewMode === "btcdb" || viewMode === "ethdb") && renderDbView()}

      {!isLoading && !isError && viewMode === "events" && (
        <div style={{ paddingBottom: 32 }}>
          {groups.length === 0 ? (
            <div style={{ margin: "40px 12px", textAlign: "center", color: "#AAA", fontSize: 14 }}>
              暂无数据
            </div>
          ) : (
            groups.map((group, gi) => (
              <div key={gi}>
                {renderBullSection(group, gi)}
                {renderBearSection(group, gi)}
              </div>
            ))
          )}
        </div>
      )}

      {/* 合约说明弹窗 */}
      {infoGroup && (
        <div
          onClick={() => setInfoGroup(null)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: "16px 16px 0 0", padding: "20px 18px 32px", width: "100%", maxWidth: 480, fontSize: 13.5, lineHeight: 1.7, color: "#333" }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "#111" }}>
              {infoGroup.titleZh || infoGroup.rawTitle}
            </h3>
            {getContractDesc(infoGroup, activeCoin).split("\n\n").map((p, i) => (
              <div key={i} style={{ marginBottom: 8 }}>{p}</div>
            ))}
            <button
              onClick={() => setInfoGroup(null)}
              style={{ width: "100%", marginTop: 16, padding: 11, borderRadius: 10, background: "#F2F2F7", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#333" }}
            >关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
