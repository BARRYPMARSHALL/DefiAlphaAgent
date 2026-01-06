import { ExternalLink, Flame, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PoolWithScore, SortState } from "@shared/schema";

interface PoolsTableProps {
  pools: PoolWithScore[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  isLoading: boolean;
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

function formatApy(apy: number | null | undefined): string {
  if (apy === null || apy === undefined) return "-";
  return `${apy.toFixed(2)}%`;
}

function getIlBadgeVariant(risk: string): "default" | "secondary" | "destructive" | "outline" {
  switch (risk) {
    case "none":
      return "secondary";
    case "low":
      return "outline";
    case "medium":
      return "default";
    case "high":
      return "destructive";
    default:
      return "secondary";
  }
}

function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    Ethereum: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Arbitrum: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    Optimism: "bg-red-500/10 text-red-600 dark:text-red-400",
    Polygon: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Base: "bg-blue-600/10 text-blue-700 dark:text-blue-300",
    BSC: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    Avalanche: "bg-red-600/10 text-red-700 dark:text-red-300",
    Fantom: "bg-blue-400/10 text-blue-500 dark:text-blue-300",
    Solana: "bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-600 dark:text-purple-400",
  };
  return colors[chain] || "bg-muted text-muted-foreground";
}

export function PoolsTable({
  pools,
  sort,
  onSortChange,
  isLoading,
}: PoolsTableProps) {
  const handleSort = (field: SortState["field"]) => {
    if (sort.field === field) {
      onSortChange({ ...sort, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ field, direction: "desc" });
    }
  };

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortState["field"];
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover-elevate ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sort.field === field && (
          <span className="text-primary">
            {sort.direction === "desc" ? "↓" : "↑"}
          </span>
        )}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Chain</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">TVL</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead className="text-right">Base APY</TableHead>
              <TableHead className="text-right">Reward APY</TableHead>
              <TableHead>IL Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground text-lg">No pools match your filters</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Chain</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Symbol</TableHead>
            <SortableHeader field="tvlUsd" className="text-right">TVL</SortableHeader>
            <SortableHeader field="apy" className="text-right">APY</SortableHeader>
            <TableHead className="text-right">Base APY</TableHead>
            <TableHead className="text-right">Reward APY</TableHead>
            <TableHead>IL Risk</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pools.map((pool) => (
            <TableRow
              key={pool.pool}
              className="hover-elevate"
              data-testid={`row-pool-${pool.pool.slice(0, 8)}`}
            >
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${getChainColor(pool.chain)} border-0`}
                >
                  {pool.chain}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {pool.project}
                  {pool.isHot && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Flame className="h-4 w-4 text-orange-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hot pool - High volume or rising APY</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{pool.symbol}</span>
                {pool.stablecoin && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Stable
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatNumber(pool.tvlUsd)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-mono font-semibold text-chart-2">
                    {formatApy(pool.apy)}
                  </span>
                  {pool.apyPct7D !== null && pool.apyPct7D !== 0 && (
                    <Tooltip>
                      <TooltipTrigger>
                        {pool.apyPct7D > 0 ? (
                          <TrendingUp className="h-4 w-4 text-chart-2" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>7d change: {pool.apyPct7D > 0 ? "+" : ""}{pool.apyPct7D.toFixed(2)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatApy(pool.apyBase)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatApy(pool.apyReward)}
              </TableCell>
              <TableCell>
                <Badge variant={getIlBadgeVariant(pool.ilRisk)}>
                  {pool.ilRisk === "none" ? "None" : pool.ilRisk.charAt(0).toUpperCase() + pool.ilRisk.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`button-view-${pool.pool.slice(0, 8)}`}
                      >
                        <a
                          href={`https://defillama.com/yields/pool/${pool.pool}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View on DeFiLlama</p>
                    </TooltipContent>
                  </Tooltip>
                  {pool.url && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={pool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`button-add-liquidity-${pool.pool.slice(0, 8)}`}
                          >
                            Add
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add liquidity on {pool.project}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
