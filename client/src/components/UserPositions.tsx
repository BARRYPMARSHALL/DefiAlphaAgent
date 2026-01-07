import { useAccount } from 'wagmi';
import { ArrowRight, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PoolWithScore } from '@shared/schema';

interface UserPositionsProps {
  topPools: PoolWithScore[];
  isLoading: boolean;
}

function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`;
}

export function UserPositions({ topPools, isLoading }: UserPositionsProps) {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to see your current DeFi positions and get personalized recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Positions
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
          Your Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Connected</span>
            <Badge variant="outline" className="font-mono text-xs">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Position tracking via Zapper API coming soon. For now, explore our top recommendations below.
          </p>
        </div>

        {bestPool && (
          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Top Opportunity</span>
              <Badge variant="secondary" className="text-chart-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                {formatApy(bestPool.apy)} APY
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
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
