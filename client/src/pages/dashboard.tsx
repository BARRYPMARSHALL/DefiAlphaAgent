import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { FiltersBar } from "@/components/FiltersBar";
import { PoolsTable } from "@/components/PoolsTable";
import { Recommendations } from "@/components/Recommendations";
import { ChainChart } from "@/components/ChainChart";
import { UserPositions } from "@/components/UserPositions";
import { queryClient } from "@/lib/queryClient";
import type { FilterState, SortState, PoolsResponse } from "@shared/schema";

const DEFAULT_FILTERS: FilterState = {
  minTvl: 5000000,
  chains: [],
  projectTypes: [],
  minApy: 0,
  lowIlOnly: false,
  searchQuery: "",
};

const DEFAULT_SORT: SortState = {
  field: "riskAdjustedScore",
  direction: "desc",
};

function loadFiltersFromStorage(): FilterState {
  try {
    const saved = localStorage.getItem("yieldScoutFilters");
    if (saved) {
      return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load filters from storage");
  }
  return DEFAULT_FILTERS;
}

function loadSortFromStorage(): SortState {
  try {
    const saved = localStorage.getItem("yieldScoutSort");
    if (saved) {
      return { ...DEFAULT_SORT, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load sort from storage");
  }
  return DEFAULT_SORT;
}

function saveFiltersToStorage(filters: FilterState) {
  try {
    localStorage.setItem("yieldScoutFilters", JSON.stringify(filters));
  } catch (e) {
    console.error("Failed to save filters to storage");
  }
}

function saveSortToStorage(sort: SortState) {
  try {
    localStorage.setItem("yieldScoutSort", JSON.stringify(sort));
  } catch (e) {
    console.error("Failed to save sort to storage");
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>(loadFiltersFromStorage);
  const [sort, setSort] = useState<SortState>(loadSortFromStorage);

  const buildQueryUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("minTvl", filters.minTvl.toString());
    params.set("minApy", filters.minApy.toString());
    params.set("lowIlOnly", filters.lowIlOnly.toString());
    params.set("searchQuery", filters.searchQuery);
    params.set("sortField", sort.field);
    params.set("sortDirection", sort.direction);
    
    filters.chains.forEach((chain) => params.append("chains", chain));
    filters.projectTypes.forEach((type) => params.append("projectTypes", type));
    
    return `/api/pools?${params.toString()}`;
  }, [filters, sort]);

  const { data, isLoading, isFetching, refetch } = useQuery<PoolsResponse>({
    queryKey: ["/api/pools", filters, sort],
    queryFn: async () => {
      const url = buildQueryUrl();
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch pools: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
  }, []);

  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    saveSortToStorage(newSort);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
    saveFiltersToStorage(DEFAULT_FILTERS);
    saveSortToStorage(DEFAULT_SORT);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/pools"], exact: false });
    refetch();
  }, [refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRefresh]);

  const pools = data?.pools || [];
  const stats = data?.stats || { totalPools: 0, avgApy: 0, topChain: "-", topChainTvl: 0 };
  const chains = data?.chains || [];
  const chainDistribution = data?.chainDistribution || [];
  const lastUpdated = data?.lastUpdated ? formatRelativeTime(data.lastUpdated) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        lastUpdated={lastUpdated}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <SummaryCards
          totalPools={stats.totalPools}
          avgApy={stats.avgApy}
          topChain={stats.topChain}
          topChainTvl={stats.topChainTvl}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FiltersBar
              filters={filters}
              sort={sort}
              availableChains={chains}
              onFiltersChange={handleFiltersChange}
              onSortChange={handleSortChange}
              onReset={handleReset}
              resultCount={pools.length}
            />

            <PoolsTable
              pools={pools}
              sort={sort}
              onSortChange={handleSortChange}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-6">
            <UserPositions
              topPools={pools.filter(p => p.riskAdjustedScore > 0).slice(0, 10)}
              isLoading={isLoading}
            />

            <Recommendations
              pools={pools.filter(p => p.riskAdjustedScore > 0).slice(0, 10)}
              isLoading={isLoading}
            />

            <ChainChart
              data={chainDistribution}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
            <p>
              Data from{" "}
              <a
                href="https://defillama.com/yields"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                DeFiLlama
              </a>
            </p>
            <p>Auto-refreshes every 5 minutes</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
