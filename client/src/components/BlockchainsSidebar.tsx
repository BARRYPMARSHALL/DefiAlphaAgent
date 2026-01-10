import { ExternalLink, X, GraduationCap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const AFFILIATE_URL = "https://www.awin1.com/cread.php?awinmid=93423&awinaffid=2723286";
const STORAGE_KEY = "blockchains-banner-dismissed";

export function BlockchainsBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    setDismissed(isDismissed === "true");
  }, []);

  if (dismissed === null || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <div 
      className="relative overflow-hidden rounded-lg border border-amber-400/40 p-3 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.1) 100%)",
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
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0">
              <Award className="h-2.5 w-2.5 mr-0.5" />
              15% Off
            </Badge>
          </div>
          <p className="text-xs font-medium leading-tight">
            Become Certified DeFi Expert
          </p>
          <p className="text-[10px] text-muted-foreground">
            Accredited Courses from 101 Blockchains
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shrink-0 h-7 no-default-hover-elevate"
          data-testid="button-101blockchains-enroll"
        >
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enroll
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </div>
    </div>
  );
}
