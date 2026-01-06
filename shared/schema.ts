import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// DeFi Pool types from DeFiLlama API
export interface Pool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  il7d: number | null;
  ilRisk: "none" | "low" | "medium" | "high";
  exposure: "single" | "multi";
  stablecoin: boolean;
  volumeUsd7d: number | null;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  poolMeta: string | null;
  underlyingTokens: string[] | null;
  url: string | null;
}

export interface PoolWithScore extends Pool {
  riskAdjustedScore: number;
  isHot: boolean;
}

export interface FilterState {
  minTvl: number;
  chains: string[];
  projectTypes: ("lp" | "lending" | "stable" | "volatile")[];
  minApy: number;
  lowIlOnly: boolean;
  searchQuery: string;
}

export interface SortState {
  field: "riskAdjustedScore" | "tvlUsd" | "apy" | "apyPct7D";
  direction: "asc" | "desc";
}

export interface PoolsResponse {
  pools: PoolWithScore[];
  stats: {
    totalPools: number;
    avgApy: number;
    topChain: string;
    topChainTvl: number;
  };
  chains: string[];
  chainDistribution: { chain: string; tvl: number; count: number }[];
  lastUpdated: string;
}

export const filterStateSchema = z.object({
  minTvl: z.number().min(0),
  chains: z.array(z.string()),
  projectTypes: z.array(z.enum(["lp", "lending", "stable", "volatile"])),
  minApy: z.number().min(0),
  lowIlOnly: z.boolean(),
  searchQuery: z.string(),
});

export type FilterStateInput = z.infer<typeof filterStateSchema>;
