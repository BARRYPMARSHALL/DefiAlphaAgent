import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import type { Pool, PoolWithScore, FilterState, SortState, PoolsResponse } from "@shared/schema";

const sortStateSchema = z.object({
  field: z.enum(["riskAdjustedScore", "tvlUsd", "apy", "apyPct7D"]),
  direction: z.enum(["asc", "desc"]),
});

const queryParamsSchema = z.object({
  minTvl: z.string().optional().transform((val) => {
    const num = Number(val);
    return isNaN(num) ? 5000000 : Math.max(0, num);
  }),
  minApy: z.string().optional().transform((val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : Math.max(0, num);
  }),
  lowIlOnly: z.string().optional().transform((val) => val === "true"),
  searchQuery: z.string().optional().default(""),
  sortField: z.enum(["riskAdjustedScore", "tvlUsd", "apy", "apyPct7D"]).optional().default("riskAdjustedScore"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  chains: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }),
  projectTypes: z.union([z.string(), z.array(z.string())]).optional().transform((val) => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.filter((t): t is FilterState["projectTypes"][number] => 
      ["lp", "lending", "stable", "volatile"].includes(t)
    );
  }),
});

let cachedData: {
  pools: PoolWithScore[];
  stats: PoolsResponse["stats"];
  chains: string[];
  chainDistribution: PoolsResponse["chainDistribution"];
  lastUpdated: string;
  rawPools: Pool[];
} | null = null;

let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000;

const LOW_LIQUIDITY_TOKENS = new Set([
  "unknown", "undefined", "test", "mock"
]);

function calculateIlRisk(pool: any): { risk: Pool["ilRisk"]; ilPctActual: number | null } {
  if (pool.exposure === "single" || pool.ilRisk === "no") {
    return { risk: "none", ilPctActual: null };
  }

  const il7d = pool.il7d;
  const il14d = pool.il14d;
  const hasRealIlData = (il7d !== null && il7d !== undefined) || (il14d !== null && il14d !== undefined);

  if (hasRealIlData) {
    const ilValue = il7d ?? il14d ?? 0;
    const absIl = Math.abs(ilValue);
    
    let risk: Pool["ilRisk"];
    if (absIl < 0.1) {
      risk = "low";
    } else if (absIl < 0.5) {
      risk = "medium";
    } else {
      risk = "high";
    }
    
    return { risk, ilPctActual: ilValue };
  }

  if (pool.stablecoin) {
    return { risk: "low", ilPctActual: null };
  }

  const symbol = (pool.symbol || "").toUpperCase();
  const hasStablePair = symbol.includes("USDC") || symbol.includes("USDT") || 
                        symbol.includes("DAI") || symbol.includes("FRAX") ||
                        symbol.includes("BUSD") || symbol.includes("TUSD");
  
  const hasVolatilePair = symbol.includes("ETH") || symbol.includes("BTC") || 
                          symbol.includes("SOL") || symbol.includes("AVAX");
  
  if (hasStablePair && !hasVolatilePair) {
    return { risk: "low", ilPctActual: null };
  }
  
  if (hasVolatilePair && !hasStablePair) {
    return { risk: "high", ilPctActual: null };
  }

  return { risk: "medium", ilPctActual: null };
}

function calculateRiskAdjustedScore(pool: Pool): number {
  const ilPenalty: Record<Pool["ilRisk"], number> = {
    none: 0,
    low: 0.1,
    medium: 0.25,
    high: 0.5,
  };

  const apy = pool.apy || 0;
  const tvlFactor = Math.min(pool.tvlUsd / 10000000, 1);
  const ilFactor = 1 - ilPenalty[pool.ilRisk];
  
  return apy * tvlFactor * ilFactor;
}

function isHotPool(pool: any): boolean {
  const volumeThreshold = 1000000;
  const apyChangeThreshold = 5;
  
  const highVolume = pool.volumeUsd7d && pool.volumeUsd7d > volumeThreshold;
  const risingApy = pool.apyPct7D && pool.apyPct7D > apyChangeThreshold;
  
  return highVolume || risingApy;
}

function isApyDeclining(pool: any): boolean {
  const apyPct7D = pool.apyPct7D;
  if (apyPct7D === null || apyPct7D === undefined) {
    return false;
  }
  return apyPct7D < -20;
}

function hasLowLiquidityRewards(pool: any): boolean {
  const rewardTokens = pool.rewardTokens;
  if (!rewardTokens || !Array.isArray(rewardTokens) || rewardTokens.length === 0) {
    return false;
  }
  
  const apyReward = pool.apyReward || 0;
  const apyBase = pool.apyBase || 0;
  const totalApy = pool.apy || 0;
  
  if (totalApy <= 0) return false;
  
  const rewardRatio = apyReward / totalApy;
  
  if (rewardRatio > 0.8) {
    const tvl = pool.tvlUsd || 0;
    if (tvl < 1000000) {
      return true;
    }
    
    const volume7d = pool.volumeUsd7d || 0;
    if (volume7d < 100000 && rewardRatio > 0.9) {
      return true;
    }
  }
  
  return false;
}

interface TransformedPoolData {
  pool: Pool;
  ilPctActual: number | null;
  apyDeclining: boolean;
  lowLiquidityRewards: boolean;
}

function transformPool(raw: any): TransformedPoolData {
  const ilResult = calculateIlRisk(raw);
  
  const pool: Pool = {
    pool: raw.pool,
    chain: raw.chain,
    project: raw.project,
    symbol: raw.symbol,
    tvlUsd: raw.tvlUsd || 0,
    apyBase: raw.apyBase,
    apyReward: raw.apyReward,
    apy: raw.apy || 0,
    rewardTokens: raw.rewardTokens,
    il7d: raw.il7d,
    ilRisk: ilResult.risk,
    exposure: raw.exposure === "single" ? "single" : "multi",
    stablecoin: raw.stablecoin || false,
    volumeUsd7d: raw.volumeUsd7d,
    apyPct1D: raw.apyPct1D,
    apyPct7D: raw.apyPct7D,
    apyPct30D: raw.apyPct30D,
    poolMeta: raw.poolMeta,
    underlyingTokens: raw.underlyingTokens,
    url: raw.url,
  };
  
  return {
    pool,
    ilPctActual: ilResult.ilPctActual,
    apyDeclining: isApyDeclining(raw),
    lowLiquidityRewards: hasLowLiquidityRewards(raw),
  };
}

async function fetchPoolsData(): Promise<void> {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_DURATION) {
    return;
  }

  try {
    console.log("Fetching pools from DeFiLlama...");
    const response = await fetch("https://yields.llama.fi/pools");
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json = await response.json();
    const rawPools: any[] = json.data || [];

    const transformedData = rawPools
      .filter((p: any) => p.tvlUsd > 0 && p.apy !== null && p.apy >= 0)
      .map(transformPool);

    const pools: Pool[] = transformedData.map(d => d.pool);

    const poolsWithScore: PoolWithScore[] = transformedData.map((data, idx) => ({
      ...data.pool,
      riskAdjustedScore: calculateRiskAdjustedScore(data.pool),
      isHot: isHotPool(rawPools.find(r => r.pool === data.pool.pool) || data.pool),
      apyDeclining: data.apyDeclining,
      lowLiquidityRewards: data.lowLiquidityRewards,
      ilPctActual: data.ilPctActual,
    }));

    const chainTvl: Record<string, { tvl: number; count: number }> = {};
    pools.forEach((p) => {
      if (!chainTvl[p.chain]) {
        chainTvl[p.chain] = { tvl: 0, count: 0 };
      }
      chainTvl[p.chain].tvl += p.tvlUsd;
      chainTvl[p.chain].count += 1;
    });

    const sortedChains = Object.entries(chainTvl)
      .sort((a, b) => b[1].tvl - a[1].tvl);

    const chains = sortedChains.map(([chain]) => chain);
    const chainDistribution = sortedChains.map(([chain, data]) => ({
      chain,
      tvl: data.tvl,
      count: data.count,
    }));

    const topChain = chains[0] || "Ethereum";
    const topChainTvl = chainTvl[topChain]?.tvl || 0;

    const totalApy = pools.reduce((sum, p) => sum + p.apy, 0);
    const avgApy = pools.length > 0 ? totalApy / pools.length : 0;

    cachedData = {
      pools: poolsWithScore,
      stats: {
        totalPools: pools.length,
        avgApy,
        topChain,
        topChainTvl,
      },
      chains,
      chainDistribution,
      lastUpdated: new Date().toISOString(),
      rawPools: pools,
    };

    lastFetchTime = now;
    console.log(`Fetched ${pools.length} pools from DeFiLlama`);
  } catch (error) {
    console.error("Failed to fetch pools:", error);
    if (!cachedData) {
      throw error;
    }
  }
}

function filterAndSortPools(
  pools: PoolWithScore[],
  filters: FilterState,
  sort: SortState
): PoolWithScore[] {
  let filtered = pools.filter((p) => {
    if (p.tvlUsd < filters.minTvl) return false;
    
    if (filters.chains.length > 0 && !filters.chains.includes(p.chain)) {
      return false;
    }

    if (filters.projectTypes.length > 0) {
      const isStable = p.stablecoin;
      const isLending = p.project.toLowerCase().includes("lend") ||
                       p.project.toLowerCase().includes("aave") ||
                       p.project.toLowerCase().includes("compound");
      const isLp = p.exposure === "multi";
      
      const matches = filters.projectTypes.some((type) => {
        switch (type) {
          case "stable": return isStable;
          case "lending": return isLending;
          case "lp": return isLp;
          case "volatile": return !isStable;
          default: return true;
        }
      });
      
      if (!matches) return false;
    }

    if (p.apy < filters.minApy) return false;

    if (filters.lowIlOnly && p.ilRisk !== "none" && p.ilRisk !== "low") {
      return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchable = `${p.project} ${p.symbol} ${p.chain}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
    let aVal: number;
    let bVal: number;

    switch (sort.field) {
      case "riskAdjustedScore":
        aVal = a.riskAdjustedScore;
        bVal = b.riskAdjustedScore;
        break;
      case "tvlUsd":
        aVal = a.tvlUsd;
        bVal = b.tvlUsd;
        break;
      case "apy":
        aVal = a.apy;
        bVal = b.apy;
        break;
      case "apyPct7D":
        aVal = a.apyPct7D || 0;
        bVal = b.apyPct7D || 0;
        break;
      default:
        aVal = a.riskAdjustedScore;
        bVal = b.riskAdjustedScore;
    }

    return sort.direction === "desc" ? bVal - aVal : aVal - bVal;
  });

  return filtered.slice(0, 200);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  fetchPoolsData().catch(console.error);

  app.get("/api/pools", async (req, res) => {
    try {
      await fetchPoolsData();

      if (!cachedData) {
        return res.status(503).json({ error: "Data not available" });
      }

      const parseResult = queryParamsSchema.safeParse(req.query);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid query parameters",
          details: parseResult.error.errors 
        });
      }

      const params = parseResult.data;

      const filters: FilterState = {
        minTvl: params.minTvl,
        chains: params.chains,
        projectTypes: params.projectTypes,
        minApy: params.minApy,
        lowIlOnly: params.lowIlOnly,
        searchQuery: params.searchQuery,
      };

      const sort: SortState = {
        field: params.sortField,
        direction: params.sortDirection,
      };

      const filteredPools = filterAndSortPools(cachedData.pools, filters, sort);

      const response: PoolsResponse = {
        pools: filteredPools,
        stats: cachedData.stats,
        chains: cachedData.chains,
        chainDistribution: cachedData.chainDistribution,
        lastUpdated: cachedData.lastUpdated,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching pools:", error);
      res.status(500).json({ error: "Failed to fetch pools" });
    }
  });

  app.post("/api/refresh", async (_req, res) => {
    try {
      lastFetchTime = 0;
      await fetchPoolsData();
      res.json({ success: true, lastUpdated: cachedData?.lastUpdated });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ error: "Failed to refresh data" });
    }
  });

  return httpServer;
}
