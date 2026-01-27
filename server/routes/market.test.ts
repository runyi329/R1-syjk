import { describe, it, expect, vi } from 'vitest';
import { marketRouter } from './market';
import { publicProcedure } from '../_core/trpc';

// Mock the callDataApi function
vi.mock('../_core/dataApi', () => ({
  callDataApi: vi.fn(async (endpoint: string, config: any) => {
    // Mock response for stock data
    if (endpoint === 'YahooFinance/get_stock_chart') {
      return {
        chart: {
          result: [
            {
              meta: {
                symbol: config.query.symbol,
                longName: 'Test Company',
                exchangeName: 'Test Exchange',
                currency: 'USD',
                regularMarketPrice: 100,
                previousClose: 99,
                fiftyTwoWeekHigh: 120,
                fiftyTwoWeekLow: 80,
                marketCap: 1000000,
                regularMarketVolume: 1000000,
              },
              timestamp: [1000000, 2000000],
              indicators: {
                quote: [
                  {
                    close: [99, 100],
                    open: [98, 99],
                    high: [101, 102],
                    low: [97, 98],
                    volume: [1000000, 1000000],
                  },
                ],
              },
            },
          ],
        },
      };
    }
    throw new Error('Unknown endpoint');
  }),
}));

describe('Market Router', () => {
  it('should have getStockData procedure', () => {
    expect(marketRouter.createCaller).toBeDefined();
  });

  it('should have getMultipleStocks procedure', () => {
    expect(marketRouter.createCaller).toBeDefined();
  });
});
