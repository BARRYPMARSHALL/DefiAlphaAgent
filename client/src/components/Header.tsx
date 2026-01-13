import { Link } from "wouter";
import { RefreshCw, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { ShareBar } from "./ShareBar";
import logoImage from "@assets/ai_1768343849255.png";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string | null;
}

export function Header({ onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mt-6 sm:mt-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoImage} 
            alt="DeFi Alpha Agent" 
            className="w-10 h-10 rounded-md object-cover"
            data-testid="img-logo"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-app-title">
              DeFi Alpha Agent
            </h1>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground" data-testid="text-last-updated">
                Updated {lastUpdated}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/learn">
            <Button variant="outline" size="sm" data-testid="button-learn-defi">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Learn DeFi</span>
              <span className="sm:hidden">Learn</span>
            </Button>
          </Link>
          
          <ShareBar compact />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
