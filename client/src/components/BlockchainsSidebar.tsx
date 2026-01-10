import { ExternalLink, X, GraduationCap, Award, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const AFFILIATE_URL = "https://www.awin1.com/cread.php?awinmid=93423&awinaffid=2723286";

interface BlockchainsBannerProps {
  variant?: "compact" | "featured" | "inline";
  storageKey?: string;
}

export function BlockchainsBanner({ variant = "compact", storageKey = "blockchains-banner-dismissed" }: BlockchainsBannerProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey);
    setDismissed(isDismissed === "true");
  }, [storageKey]);

  if (dismissed === null || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  if (variant === "featured") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border-2 border-amber-400/50 p-4 sm:p-5 text-white shadow-lg"
        style={{
          background: "linear-gradient(-45deg, #f59e0b, #d97706, #ea580c, #f59e0b)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift-101 6s ease infinite"
        }}
        data-testid="banner-101blockchains-featured"
      >
        <style>{`
          @keyframes gradient-shift-101 {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes pulse-badge {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
        
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors z-10"
          aria-label="Dismiss"
          data-testid="button-dismiss-101blockchains-featured"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Badge 
                  className="bg-white text-amber-600 border-0 font-bold"
                  style={{ animation: "pulse-badge 2s ease-in-out infinite" }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  15% OFF
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold leading-tight">
                Become a Certified DeFi Expert
              </h3>
              <p className="text-sm text-amber-100 mt-1">
                Industry-accredited blockchain courses from 101 Blockchains
              </p>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-white text-amber-600 hover:bg-amber-50 hover:scale-105 font-bold shadow-lg shrink-0 no-default-hover-elevate transition-transform duration-200"
            data-testid="button-101blockchains-enroll-featured"
          >
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Learning Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={AFFILIATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 p-3 rounded-lg border-2 border-amber-400/50 hover:border-amber-400 transition-all hover:shadow-md"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(234,88,12,0.15) 100%)",
        }}
        data-testid="banner-101blockchains-inline"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0 group-hover:scale-110 transition-transform">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">Get DeFi Certified</p>
            <Badge className="bg-amber-500 text-white border-0 text-[10px]">15% Off</Badge>
          </div>
          <p className="text-xs text-muted-foreground">101 Blockchains Courses</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
      </a>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-lg border-2 border-amber-400/50 p-3 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(234,88,12,0.15) 100%)",
      }}
      data-testid="banner-101blockchains"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
        aria-label="Dismiss"
        data-testid="button-dismiss-101blockchains"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0 shadow-md">
          <GraduationCap className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0 font-bold">
              <Award className="h-2.5 w-2.5 mr-0.5" />
              15% Off
            </Badge>
          </div>
          <p className="text-xs font-bold leading-tight text-foreground">
            Become Certified DeFi Expert
          </p>
          <p className="text-[10px] text-muted-foreground">
            Accredited Courses from 101 Blockchains
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shrink-0 h-8 shadow-md no-default-hover-elevate"
          data-testid="button-101blockchains-enroll"
        >
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enroll Now
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </div>
    </div>
  );
}
