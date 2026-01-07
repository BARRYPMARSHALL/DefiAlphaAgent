import { Sparkles, TrendingUp, ArrowRight, ExternalLink, Zap, Shield, Flame, AlertTriangle, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { PoolWithScore } from "@shared/schema";

interface RecommendationsProps {
  pools: PoolWithScore[];
  isLoading: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

function generateInsight(pool: PoolWithScore, allPools: PoolWithScore[]): string {
  const stablePools = allPools.filter(p => p.stablecoin);
  const avgStableApy = stablePools.length > 0 
    ? stablePools.reduce((sum, p) => sum + (p.apy || 0), 0) / stablePools.length 
    : 0;
  
  const sameCategoryPools = allPools.filter(p => 
    p.stablecoin === pool.stablecoin && p.ilRisk === pool.ilRisk
  );
  const avgCategoryApy = sameCategoryPools.length > 0
    ? sameCategoryPools.reduce((sum, p) => sum + (p.apy || 0), 0) / sameCategoryPools.length
    : 0;

  if (pool.stablecoin && avgStableApy > 0) {
    const pctAbove = ((pool.apy - avgStableApy) / avgStableApy) * 100;
    if (pctAbove > 10) {
      return `${Math.round(pctAbove)}% higher APY than avg stablecoin pools`;
    }
  }
  
  if (pool.ilRisk === "none" && pool.apy > avgCategoryApy * 1.1) {
    return "No impermanent loss risk with above-average yield";
  }
  
  if (pool.ilRisk === "low" && pool.tvlUsd > 10000000) {
    return "Low IL risk with strong TVL backing";
  }
  
  if (pool.apyPct7D && pool.apyPct7D > 0.5) {
    return `APY up ${pool.apyPct7D.toFixed(1)}% in the last 7 days`;
  }
  
  if (pool.tvlUsd > 50000000) {
    return "High liquidity pool with proven stability";
  }
  
  if (pool.riskAdjustedScore > 1) {
    return "Strong risk-adjusted returns";
  }
  
  return "Balanced risk-reward profile";
}

function getInsightIcon(pool: PoolWithScore): typeof Zap {
  if (pool.ilRisk === "none") return Shield;
  if (pool.apyPct7D && pool.apyPct7D > 0) return Flame;
  return Zap;
}

export function Recommendations({ pools, isLoading }: RecommendationsProps) {
  const topPools = pools.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-chart-4" />
            Top Alpha Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              {i < 5 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (topPools.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-chart-4" />
            Top Alpha Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recommendations available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-chart-4" />
          Top Alpha Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topPools.map((pool, index) => (
          <div key={pool.pool}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate" data-testid={`rec-project-${index}`}>
                      {pool.project}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {pool.chain}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 shrink-0">
                    {formatApy(pool.apy)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate font-mono" data-testid={`rec-symbol-${index}`}>
                  {pool.symbol}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>TVL: {formatNumber(pool.tvlUsd)}</span>
                  <span className="flex items-center gap-1">
                    IL Risk: {pool.ilRisk}
                    {pool.ilPctActual !== null && pool.ilPctActual !== undefined && (
                      <span className="text-muted-foreground">({pool.ilPctActual.toFixed(2)}%)</span>
                    )}
                  </span>
                  {pool.stablecoin && (
                    <Badge variant="secondary" className="text-xs">
                      Stable
                    </Badge>
                  )}
                  {pool.apyDeclining && (
                    <span className="flex items-center gap-1 text-destructive">
                      <ArrowDown className="h-3 w-3" />
                      APY Declining
                    </span>
                  )}
                  {pool.lowLiquidityRewards && (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                      <AlertTriangle className="h-3 w-3" />
                      Low Liquidity Rewards
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-muted/50">
                  {(() => {
                    const InsightIcon = getInsightIcon(pool);
                    return <InsightIcon className="h-3 w-3 text-chart-4 mt-0.5 shrink-0" />;
                  })()}
                  <span className="text-xs text-muted-foreground" data-testid={`rec-insight-${index}`}>
                    {generateInsight(pool, pools)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-7 text-xs"
                    data-testid={`button-rec-view-${index}`}
                  >
                    <a
                      href={`https://defillama.com/yields/pool/${pool.pool}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </Button>
                  {pool.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 text-xs"
                    >
                      <a
                        href={pool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Add Liquidity
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {index < topPools.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}

        <div className="pt-2">
          <div className="p-3 rounded-md bg-muted/50">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Pro tip:</span> These pools are ranked by risk-adjusted returns, considering APY, TVL stability, and impermanent loss risk.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
