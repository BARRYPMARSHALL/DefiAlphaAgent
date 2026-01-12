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

const recommendQuerySchema = z.object({
  chains: z.string().optional().default("all"),
  minApy: z.string().optional().transform((val) => {
    const num = Number(val);
    return isNaN(num) ? 5 : Math.max(0, num);
  }),
  riskTolerance: z.enum(["low", "medium", "high"]).optional().default("medium"),
  userQuery: z.string().optional().default(""),
});

interface RecommendedPool {
  pool: string;
  apy: string;
  apyBase: string;
  apyReward: string;
  risk: string;
  tvl: string;
  chain: string;
  project: string;
  autoCompound: string;
  proTip: string;
  zapLink: string;
  apyWarning?: string;
  cefiComparison?: string;
}

interface RecommendResponse {
  success: boolean;
  query: string;
  riskProfile: string;
  riskExpanded?: boolean;
  topPick: RecommendedPool | null;
  alternatives: RecommendedPool[];
  fallbackPicks?: RecommendedPool[];
  summary: string;
  suggestions?: string[];
  timestamp: string;
}

const CEFI_KEYWORDS = ["cefi", "nexo", "celsius", "blockfi", "centralized", "exchange"];
const CEFI_BENCHMARK_APY = 8;
const APY_ANOMALY_THRESHOLD = 10000;

function formatTvl(tvl: number): string {
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

function getRiskDescription(pool: PoolWithScore): string {
  const ilDescriptions: Record<string, string> = {
    none: "No impermanent loss risk (single-sided or lending)",
    low: "Low IL risk (stablecoin pairs)",
    medium: "Moderate IL risk (correlated assets)",
    high: "Higher IL risk (volatile pair)",
  };
  
  let description = ilDescriptions[pool.ilRisk] || "Unknown IL risk";
  
  if (pool.stablecoin) {
    description += " - Stablecoin pool";
  }
  
  if (pool.tvlUsd > 50000000) {
    description += " - High TVL adds security";
  } else if (pool.tvlUsd < 1000000) {
    description += " - Lower TVL, check liquidity";
  }
  
  return description;
}

function generateProTip(pool: PoolWithScore, includeCefiComparison: boolean = false): string {
  const tips: string[] = [];
  
  if (includeCefiComparison && pool.apy > CEFI_BENCHMARK_APY && pool.apy < APY_ANOMALY_THRESHOLD) {
    const beatsCeFi = pool.apy - CEFI_BENCHMARK_APY;
    tips.push(`Beats Nexo's ${CEFI_BENCHMARK_APY}% by ${beatsCeFi.toFixed(1)}% while keeping full on-chain control`);
  } else if (pool.apy > 10 && pool.apy < APY_ANOMALY_THRESHOLD) {
    const beatsCeFi = pool.apy - 10;
    tips.push(`Beats centralized 10% rates by ${beatsCeFi.toFixed(1)}% while keeping full on-chain control`);
  }
  
  if (pool.isBeefy) {
    tips.push("Auto-compounds via Beefy - set it and forget it");
  } else if (pool.autoCompound) {
    tips.push(`Auto-compounds via ${pool.autoCompoundProject} - no manual harvesting needed`);
  } else if (pool.beefyAvailable) {
    tips.push("Beefy vault available for auto-compounding");
  }
  
  if (pool.stablecoin && pool.ilRisk === "low") {
    tips.push("Stablecoin pool with minimal IL - great for capital preservation");
  }
  
  if (pool.apyPct7D && pool.apyPct7D > 10) {
    tips.push(`APY trending up ${pool.apyPct7D.toFixed(1)}% this week`);
  }
  
  if (pool.isHot) {
    tips.push("Hot pool - high volume and rising APY");
  }
  
  return tips.length > 0 ? tips[0] : "Solid risk-adjusted opportunity based on TVL and APY";
}

function generateCefiComparison(pool: PoolWithScore): string | undefined {
  if (pool.apy >= APY_ANOMALY_THRESHOLD) {
    return undefined;
  }
  if (pool.apy > CEFI_BENCHMARK_APY) {
    const diff = pool.apy - CEFI_BENCHMARK_APY;
    return `This beats Nexo's ${CEFI_BENCHMARK_APY}% by ${diff.toFixed(1)}%`;
  }
  return undefined;
}

function getApyWarning(pool: PoolWithScore): string | undefined {
  if (pool.apy >= APY_ANOMALY_THRESHOLD) {
    return `Extremely high APY (${pool.apy.toFixed(0)}%) - verify before investing, may be temporary or anomalous`;
  }
  if (pool.apy >= 1000) {
    return "Very high APY - verify sustainability and check for reward token liquidity";
  }
  return undefined;
}

function generateZapLink(pool: PoolWithScore): string {
  const chain = pool.chain.toLowerCase();
  const project = pool.project.toLowerCase();
  
  if (pool.isBeefy || pool.beefyAvailable) {
    return `https://app.beefy.com/${chain}?search=${encodeURIComponent(pool.symbol)}`;
  }
  
  if (project.includes("aerodrome")) {
    return `https://aerodrome.finance/liquidity?token0=${pool.symbol.split("-")[0]}&token1=${pool.symbol.split("-")[1] || ""}`;
  }
  
  if (project.includes("velodrome")) {
    return `https://velodrome.finance/liquidity`;
  }
  
  if (project.includes("uniswap")) {
    return `https://app.uniswap.org/#/pools`;
  }
  
  if (project.includes("curve")) {
    return `https://curve.fi/#/${chain}/pools`;
  }
  
  return `https://defillama.com/yields?project=${encodeURIComponent(pool.project)}`;
}

const CHAIN_ALIASES: Record<string, string[]> = {
  bsc: ["binance", "bnb", "bsc"],
  ethereum: ["eth", "ethereum", "mainnet"],
  arbitrum: ["arb", "arbitrum"],
  avalanche: ["avax", "avalanche"],
  optimism: ["op", "optimism"],
  polygon: ["matic", "polygon"],
  base: ["base"],
  solana: ["sol", "solana"],
  fantom: ["ftm", "fantom"],
};

function normalizeChainName(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(CHAIN_ALIASES)) {
    if (aliases.includes(lower)) {
      return canonical;
    }
  }
  return lower;
}

function chainMatchesFilter(poolChain: string, filterChain: string): boolean {
  const poolLower = poolChain.toLowerCase();
  const filterLower = filterChain.toLowerCase().trim();
  
  if (poolLower === filterLower) return true;
  if (poolLower.includes(filterLower)) return true;
  
  const normalizedFilter = normalizeChainName(filterLower);
  if (poolLower === normalizedFilter) return true;
  if (poolLower.includes(normalizedFilter)) return true;
  
  const aliases = CHAIN_ALIASES[normalizedFilter];
  if (aliases) {
    return aliases.some(alias => poolLower.includes(alias));
  }
  
  return false;
}

function poolMatchesUserQuery(pool: PoolWithScore, query: string): boolean {
  if (!query) return true;
  
  const q = query.toLowerCase();
  const poolText = `${pool.symbol} ${pool.project} ${pool.chain} ${pool.ilRisk}`.toLowerCase();
  
  if (q.includes("stable") && pool.stablecoin) return true;
  if (q.includes("low il") && (pool.ilRisk === "none" || pool.ilRisk === "low")) return true;
  if (q.includes("auto") && pool.autoCompound) return true;
  if (q.includes("beefy") && (pool.isBeefy || pool.beefyAvailable)) return true;
  if (q.includes("high apy") && pool.apy > 50) return true;
  
  const words = q.split(/\s+/).filter(w => w.length > 2);
  return words.some(word => poolText.includes(word));
}

function formatPoolForResponse(pool: PoolWithScore, includeCefiComparison: boolean = false): RecommendedPool {
  const apyBase = pool.apyBase || 0;
  const apyReward = pool.apyReward || 0;
  
  let autoCompoundText = "No";
  if (pool.isBeefy) {
    autoCompoundText = "Yes via Beefy (auto-compound active)";
  } else if (pool.autoCompound && pool.autoCompoundProject) {
    autoCompoundText = `Yes via ${pool.autoCompoundProject}`;
  } else if (pool.beefyAvailable) {
    autoCompoundText = "Beefy vault available";
  }
  
  const result: RecommendedPool = {
    pool: `${pool.symbol} on ${pool.project} (${pool.chain})`,
    apy: `${pool.apy.toFixed(2)}%`,
    apyBase: `${apyBase.toFixed(2)}%`,
    apyReward: `${apyReward.toFixed(2)}%`,
    risk: getRiskDescription(pool),
    tvl: formatTvl(pool.tvlUsd),
    chain: pool.chain,
    project: pool.project,
    autoCompound: autoCompoundText,
    proTip: generateProTip(pool, includeCefiComparison),
    zapLink: generateZapLink(pool),
  };
  
  const apyWarning = getApyWarning(pool);
  if (apyWarning) {
    result.apyWarning = apyWarning;
  }
  
  if (includeCefiComparison) {
    const cefiComp = generateCefiComparison(pool);
    if (cefiComp) {
      result.cefiComparison = cefiComp;
    }
  }
  
  return result;
}

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

const AUTO_COMPOUND_PROJECTS = new Set([
  'beefy',
  'yearn-finance', 
  'gamma',
  'arrakis',
  'reaper-farm',
  'autofarm',
  'concentrator',
  'origin-dollar',
  'aura',
  'convex-finance',
  'convex',
  'pendle',
  'sommelier',
  'pickle-finance',
  'harvest-finance',
]);

const AUTO_COMPOUND_KEYWORDS = ['vault', 'auto', 'compound', 'autocompound'];

const BEEFY_SUPPORTED_PROTOCOLS = new Set([
  'aerodrome-v1',
  'aerodrome-v2',
  'velodrome-v2',
  'velodrome-v1',
  'uniswap-v3',
  'uniswap-v2',
  'pancakeswap-amm-v3',
  'pancakeswap-amm-v2',
  'sushiswap',
  'curve-dex',
  'curve',
  'balancer-v2',
  'camelot-v3',
  'camelot-v2',
  'trader-joe-dex',
  'quickswap-dex',
  'thena-v1',
  'thena-v2',
  'ramses-v2',
  'lynex',
  'solidly-v2',
  'equalizer',
]);

const BEEFY_SUPPORTED_CHAINS = new Set([
  'Ethereum',
  'Arbitrum',
  'Optimism',
  'Polygon',
  'Base',
  'BSC',
  'Avalanche',
  'Fantom',
  'Cronos',
  'zkSync Era',
  'Linea',
  'Mantle',
  'Scroll',
  'Mode',
  'Fraxtal',
]);

interface AutoCompoundInfo {
  autoCompound: boolean;
  autoCompoundProject: string | null;
  isBeefy: boolean;
  beefyAvailable: boolean;
}

function detectAutoCompound(pool: any): AutoCompoundInfo {
  const project = (pool.project || '').toLowerCase();
  const chain = pool.chain || '';
  
  if (project === 'beefy') {
    return { 
      autoCompound: true, 
      autoCompoundProject: 'Beefy',
      isBeefy: true,
      beefyAvailable: true
    };
  }
  
  if (AUTO_COMPOUND_PROJECTS.has(project)) {
    const displayName = pool.project.split('-').map((w: string) => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    
    const beefyAvailable = BEEFY_SUPPORTED_PROTOCOLS.has(project) && BEEFY_SUPPORTED_CHAINS.has(chain);
    
    return { 
      autoCompound: true, 
      autoCompoundProject: displayName,
      isBeefy: false,
      beefyAvailable
    };
  }
  
  const poolMeta = (pool.poolMeta || '').toLowerCase();
  const symbol = (pool.symbol || '').toLowerCase();
  
  for (const keyword of AUTO_COMPOUND_KEYWORDS) {
    if (poolMeta.includes(keyword) || symbol.includes(keyword)) {
      const beefyAvailable = BEEFY_SUPPORTED_PROTOCOLS.has(project) && BEEFY_SUPPORTED_CHAINS.has(chain);
      return { 
        autoCompound: true, 
        autoCompoundProject: pool.project,
        isBeefy: false,
        beefyAvailable
      };
    }
  }
  
  const beefyAvailable = BEEFY_SUPPORTED_PROTOCOLS.has(project) && BEEFY_SUPPORTED_CHAINS.has(chain);
  
  return { 
    autoCompound: false, 
    autoCompoundProject: null,
    isBeefy: false,
    beefyAvailable
  };
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

    const poolsWithScore: PoolWithScore[] = transformedData.map((data) => {
      const rawPool = rawPools.find(r => r.pool === data.pool.pool) || data.pool;
      const autoCompoundInfo = detectAutoCompound(rawPool);
      const baseScore = calculateRiskAdjustedScore(data.pool);
      const beefyBoost = autoCompoundInfo.isBeefy ? 1.15 : 1.0;
      const autoCompoundBoost = autoCompoundInfo.autoCompound ? 1.1 : 1.0;
      
      return {
        ...data.pool,
        riskAdjustedScore: baseScore * autoCompoundBoost * beefyBoost,
        isHot: isHotPool(rawPool),
        apyDeclining: data.apyDeclining,
        lowLiquidityRewards: data.lowLiquidityRewards,
        ilPctActual: data.ilPctActual,
        autoCompound: autoCompoundInfo.autoCompound,
        autoCompoundProject: autoCompoundInfo.autoCompoundProject,
        isBeefy: autoCompoundInfo.isBeefy,
        beefyAvailable: autoCompoundInfo.beefyAvailable,
      };
    });

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

  app.get("/api/recommend", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

    const apiKey = req.headers["x-api-key"];
    if (apiKey) {
      console.log(`[API] /api/recommend called with API key: ${apiKey}`);
    }

    try {
      await fetchPoolsData();

      if (!cachedData) {
        return res.status(503).json({ 
          success: false, 
          error: "Data not available. Please try again in a moment." 
        });
      }

      const parseResult = recommendQuerySchema.safeParse(req.query);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid query parameters",
          details: parseResult.error.errors 
        });
      }

      let { chains, minApy, riskTolerance, userQuery } = parseResult.data;
      
      const queryLower = userQuery.toLowerCase();
      const wantsCefiComparison = CEFI_KEYWORDS.some(kw => queryLower.includes(kw));

      let filteredPools = [...cachedData.pools];
      let riskExpanded = false;

      if (chains !== "all") {
        const chainList = chains.split(",").map(c => c.trim());
        const uniqueChains = Array.from(new Set(cachedData.pools.map(p => p.chain.toLowerCase())));
        console.log(`[API] Chain filter: ${chainList.join(", ")} | Available: ${uniqueChains.slice(0, 10).join(", ")}...`);
        
        filteredPools = filteredPools.filter(p => 
          chainList.some(c => chainMatchesFilter(p.chain, c))
        );
        console.log(`[API] After chain filter: ${filteredPools.length} pools`);
      }

      filteredPools = filteredPools.filter(p => p.apy >= minApy);

      const applySmartFilter = (pools: PoolWithScore[], risk: string): PoolWithScore[] => {
        return pools.filter(pool => {
          const isLowRisk = pool.ilRisk === "none" || pool.ilRisk === "low";
          const isMediumRisk = pool.ilRisk === "medium";
          
          let maxApy: number;
          if (risk === "low") {
            maxApy = isLowRisk ? 50 : 0;
          } else if (risk === "medium") {
            maxApy = isLowRisk ? 50 : (isMediumRisk ? 150 : 0);
          } else {
            maxApy = Infinity;
          }
          
          const minTvl = risk === "low" ? 5000000 : 1000000;
          
          const apyBase = pool.apyBase || 0;
          const isNotPurelyBoosted = apyBase >= 0.5 * pool.apy || pool.apy < 10;
          
          const symbolUpper = pool.symbol.toUpperCase();
          const isNotTest = !symbolUpper.includes("TEST") && !symbolUpper.includes("MOCK");
          
          return (
            pool.tvlUsd >= minTvl &&
            pool.apy <= maxApy &&
            isNotTest &&
            isNotPurelyBoosted
          );
        });
      };

      let riskFilteredPools = applySmartFilter(filteredPools, riskTolerance);

      if (riskFilteredPools.length === 0 && riskTolerance === "low") {
        riskFilteredPools = applySmartFilter(filteredPools, "medium");
        if (riskFilteredPools.length > 0) {
          riskExpanded = true;
          riskTolerance = "medium";
        }
      }
      
      if (riskFilteredPools.length === 0 && riskTolerance !== "high") {
        riskFilteredPools = applySmartFilter(filteredPools, "high");
        if (riskFilteredPools.length > 0) {
          riskExpanded = true;
          riskTolerance = "high";
        }
      }

      filteredPools = riskFilteredPools;

      if (userQuery) {
        filteredPools = filteredPools.filter(p => poolMatchesUserQuery(p, userQuery));
      }

      filteredPools = filteredPools.filter(p => p.apy < APY_ANOMALY_THRESHOLD);
      
      filteredPools.sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore);

      const topPools = filteredPools.slice(0, 3);

      let fallbackPicks: RecommendedPool[] | undefined;
      const suggestions: string[] = [];
      
      if (topPools.length === 0) {
        const allPoolsSorted = [...cachedData.pools]
          .filter(p => p.apy < APY_ANOMALY_THRESHOLD)
          .sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore)
          .slice(0, 3);
        
        if (allPoolsSorted.length > 0) {
          fallbackPicks = allPoolsSorted.map(p => formatPoolForResponse(p, wantsCefiComparison));
        }
        
        if (chains !== "all") {
          suggestions.push("Try chains=all for more options");
        }
        if (minApy > 5) {
          suggestions.push(`Lower minApy threshold (currently ${minApy}%)`);
        }
        if (riskTolerance !== "high") {
          suggestions.push("Try riskTolerance=high to include more volatile pools");
        }
      }

      const querySummary = userQuery 
        ? userQuery 
        : `Top pools with ${minApy}%+ APY, ${riskTolerance} risk${chains !== "all" ? ` on ${chains}` : ""}`;

      let summary = "";
      if (topPools.length === 0) {
        summary = `No pools found matching your exact criteria.`;
        if (fallbackPicks && fallbackPicks.length > 0) {
          summary += ` Showing top ${fallbackPicks.length} overall picks instead.`;
        }
      } else {
        if (riskExpanded) {
          summary = `No low-risk pools found, expanded to medium risk. `;
        }
        if (topPools.length === 1) {
          summary += `Found 1 opportunity matching your criteria.`;
        } else {
          const topApy = topPools[0].apy < 1000 ? `${topPools[0].apy.toFixed(2)}%` : `${topPools[0].apy.toFixed(0)}%`;
          summary += `Found ${topPools.length} top opportunities. The top pick offers ${topApy} APY with ${topPools[0].ilRisk} IL risk.`;
        }
        if (wantsCefiComparison && topPools[0].apy > CEFI_BENCHMARK_APY) {
          summary += ` All picks beat typical CeFi rates of ${CEFI_BENCHMARK_APY}%.`;
        }
      }

      const response: RecommendResponse = {
        success: true,
        query: querySummary,
        riskProfile: riskTolerance,
        ...(riskExpanded && { riskExpanded: true }),
        topPick: topPools[0] ? formatPoolForResponse(topPools[0], wantsCefiComparison) : null,
        alternatives: topPools.slice(1).map(p => formatPoolForResponse(p, wantsCefiComparison)),
        ...(fallbackPicks && fallbackPicks.length > 0 && { fallbackPicks }),
        summary,
        ...(suggestions.length > 0 && { suggestions }),
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error("Error in /api/recommend:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch recommendations" 
      });
    }
  });

  app.options("/api/recommend", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    res.sendStatus(200);
  });

  app.get("/api/chains", async (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    try {
      await fetchPoolsData();

      if (!cachedData) {
        return res.status(503).json({ 
          success: false, 
          error: "Data not available" 
        });
      }

      const chainCounts: Record<string, number> = {};
      for (const pool of cachedData.pools) {
        chainCounts[pool.chain] = (chainCounts[pool.chain] || 0) + 1;
      }

      const chains = Object.entries(chainCounts)
        .map(([name, count]) => ({ name, poolCount: count }))
        .sort((a, b) => b.poolCount - a.poolCount);

      res.json({
        success: true,
        total: chains.length,
        chains,
        aliases: CHAIN_ALIASES,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in /api/chains:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch chains" 
      });
    }
  });

  return httpServer;
}
