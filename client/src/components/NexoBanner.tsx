import { ExternalLink, X, Sparkles, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const NEXO_URL = import.meta.env.VITE_NEXO_REFERRAL_URL || "https://nexo.com";
const STORAGE_KEY = "nexo-banner-dismissed";

export function NexoBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    setDismissed(isDismissed === "true");
  }, []);

  if (dismissed === null) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white shadow-lg" data-testid="banner-nexo">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
      
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss banner"
        data-testid="button-dismiss-nexo"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
            <DollarSign className="h-7 w-7" />
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Partner Offer
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold leading-tight">
              Earn Stable 14% on Your Crypto – No Farming Hassle
            </h3>
            <p className="text-sm text-blue-100 mt-1">
              Skip complex DeFi strategies. Get predictable yields with instant withdrawals.
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="bg-white text-indigo-700 hover:bg-blue-50 font-semibold shadow-md shrink-0 no-default-hover-elevate"
          data-testid="button-join-nexo"
        >
          <a
            href={NEXO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Nexo + $5K BTC Bonus
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>

      <div className="relative mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Up to 14% APY
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Instant Withdrawals
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          $5K BTC Bonus for New Users
        </span>
      </div>
    </div>
  );
}
