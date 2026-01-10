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
    <div 
      className="relative overflow-hidden rounded-lg border border-indigo-400/30 p-4 sm:p-6 text-white shadow-lg animate-fade-in"
      style={{
        background: "linear-gradient(-45deg, #667eea, #764ba2, #6B8DD6, #8E37D7)",
        backgroundSize: "400% 400%",
        animation: "gradient-shift 8s ease infinite, fade-in 0.5s ease-out"
      }}
      data-testid="banner-nexo"
    >
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 0 30px rgba(118, 75, 162, 0.6); }
        }
        .nexo-banner-animated {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .shimmer-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.1),
            transparent
          );
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      <div className="shimmer-overlay pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIHI9IjIiLz48L2c+PC9zdmc+')] opacity-50" />
      
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors z-10"
        aria-label="Dismiss banner"
        data-testid="button-dismiss-nexo"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm shrink-0 animate-pulse">
            <DollarSign className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/30 text-yellow-200 text-xs font-medium border border-yellow-400/30">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Partner Offer
              </span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold leading-tight">
              Earn Stable 14% on Your Crypto – No Farming Hassle
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-md">
              Skip complex DeFi strategies. Get predictable yields with instant withdrawals.
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-blue-50 hover:scale-105 font-semibold shadow-lg shrink-0 no-default-hover-elevate transition-transform duration-200"
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

      <div className="relative mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-blue-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Up to 14% APY
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
          Instant Withdrawals
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: "1s" }} />
          $5K BTC Bonus
        </span>
      </div>
    </div>
  );
}
