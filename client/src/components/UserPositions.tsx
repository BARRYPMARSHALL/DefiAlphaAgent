import { useWallet } from '@/lib/wallet-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, Wallet, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { PoolWithScore } from '@shared/schema';

interface UserPositionsProps {
  topPools: PoolWithScore[];
  isLoading: boolean;
}

interface UserPosition {
  protocol: string;
  chain: string;
  symbol: string;
  balanceUsd: number;
  apy: number | null;
  type: string;
}

interface PortfolioResponse {
  positions: UserPosition[];
  totalValue: number;
  message?: string;
}

function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

function formatNumber(num: number): string {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function calculatePositionRiskScore(pos: UserPosition): number {
  const apy = pos.apy || 0;
  const tvlFactor = Math.min((pos.balanceUsd * 100) / 10000000, 1);
  const ilFactor = pos.type.toLowerCase().includes('lend') ? 1 : 0.75;
  return apy * tvlFactor * ilFactor;
}

function findUpgradeSuggestions(
  positions: UserPosition[], 
  topPools: PoolWithScore[]
): Array<{ position: UserPosition; suggestion: PoolWithScore; improvement: number }> {
  const suggestions: Array<{ position: UserPosition; suggestion: PoolWithScore; improvement: number }> = [];
  
  positions.forEach(pos => {
    if (pos.apy === null || pos.apy === 0) return;
    
    const posRiskScore = calculatePositionRiskScore(pos);
    
    const relevantPools = topPools.filter(pool => {
      const sameChain = pool.chain.toLowerCase() === pos.chain.toLowerCase();
      const similarAssets = pool.symbol.toLowerCase().includes(pos.symbol.split('-')[0].toLowerCase());
      return sameChain || similarAssets;
    });
    
    for (const pool of relevantPools) {
      const improvement = posRiskScore > 0 
        ? ((pool.riskAdjustedScore - posRiskScore) / posRiskScore) * 100
        : pool.riskAdjustedScore > 0 ? 100 : 0;
      
      if (improvement > 10) {
        suggestions.push({ position: pos, suggestion: pool, improvement });
        break;
      }
    }
  });
  
  return suggestions.sort((a, b) => b.improvement - a.improvement).slice(0, 3);
}

export function UserPositions({ topPools, isLoading }: UserPositionsProps) {
  const { isConnected, address } = useWallet();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioResponse>({
    queryKey: ['/api/portfolio', address],
    queryFn: async () => {
      if (!address) return { positions: [], totalValue: 0 };
      const res = await fetch(`/api/portfolio/${address}`);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
    enabled: isConnected && !!address,
    staleTime: 5 * 60 * 1000,
  });

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to see your current DeFi positions and get personalized upgrade suggestions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || portfolioLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const positions = portfolio?.positions || [];
  const totalValue = portfolio?.totalValue || 0;
  const hasPositions = positions.length > 0;
  const upgrades = hasPositions ? findUpgradeSuggestions(positions, topPools) : [];

  const bestPool = topPools[0];
  const top5Pools = topPools.slice(0, 5);
  const avgApy = top5Pools.length > 0 
    ? top5Pools.reduce((sum, p) => sum + p.apy, 0) / top5Pools.length 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Your Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-muted/50">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Connected</span>
            <Badge variant="outline" className="font-mono text-xs">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
          </div>
          {hasPositions ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Total DeFi Value</span>
              <span className="font-medium">{formatNumber(totalValue)}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {portfolio?.message || "No DeFi positions found. Explore our top recommendations below."}
            </p>
          )}
        </div>

        {hasPositions && positions.slice(0, 3).map((pos, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{pos.protocol}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">{pos.chain}</Badge>
                <span className="truncate">{pos.symbol}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">{formatNumber(pos.balanceUsd)}</p>
              {pos.apy !== null && (
                <p className="text-xs text-chart-2">{formatApy(pos.apy)} APY</p>
              )}
            </div>
          </div>
        ))}

        {upgrades.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-chart-4" />
                Upgrade Suggestions
              </div>
              {upgrades.map((upgrade, idx) => (
                <div key={idx} className="p-3 rounded-md border bg-chart-4/5 border-chart-4/20">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Upgrade from {upgrade.position.protocol}
                      </p>
                      <p className="text-sm font-medium">
                        {upgrade.suggestion.project} - {upgrade.suggestion.symbol.split('-')[0]}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 shrink-0">
                      +{Math.round(upgrade.improvement)}% better
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{upgrade.suggestion.chain}</Badge>
                    <span>{formatApy(upgrade.suggestion.apy)} APY</span>
                    <span>TVL: {formatNumber(upgrade.suggestion.tvlUsd)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    asChild
                  >
                    <a
                      href={`https://defillama.com/yields/pool/${upgrade.suggestion.pool}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Details
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {!hasPositions && bestPool && (
          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium">Top Opportunity</span>
              <Badge variant="secondary" className="text-chart-2 shrink-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                {formatApy(bestPool.apy)} APY
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Badge variant="outline">{bestPool.chain}</Badge>
              <span className="text-muted-foreground">{bestPool.project}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {bestPool.symbol} - Risk-adjusted score: {bestPool.riskAdjustedScore.toFixed(2)}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              asChild
              data-testid="button-view-top-pool"
            >
              <a
                href={`https://defillama.com/yields/pool/${bestPool.pool}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Average APY of top 5 pools: <span className="font-medium text-chart-2">{formatApy(avgApy)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
