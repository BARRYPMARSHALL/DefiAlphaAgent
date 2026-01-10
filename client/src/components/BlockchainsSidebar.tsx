import { ExternalLink, X, GraduationCap, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const AFFILIATE_URL = "https://www.awin1.com/cread.php?awinmid=93423&awinaffid=2723286";
const STORAGE_KEY = "blockchains-sidebar-dismissed";

export function BlockchainsSidebar() {
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
      className="hidden xl:block fixed right-4 top-1/3 z-40 w-[300px]"
      data-testid="sidebar-101blockchains"
    >
      <Card className="relative overflow-hidden border-2 border-amber-400/40 shadow-xl">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
          }}
        />
        
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
          data-testid="button-dismiss-101blockchains"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <CardContent className="relative p-4 space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
              <GraduationCap className="h-7 w-7" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
              <Award className="h-3 w-3 mr-1" />
              15% Off
            </Badge>
            
            <h3 className="text-base font-bold leading-tight">
              Become a Certified DeFi Expert
            </h3>
            
            <p className="text-sm text-muted-foreground leading-snug">
              Accredited Blockchain Courses from 101 Blockchains
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>DeFi, NFT & Web3 Certifications</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Industry-Recognized Credentials</span>
            </div>
          </div>

          <Button
            asChild
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-md no-default-hover-elevate"
            data-testid="button-101blockchains-enroll"
          >
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start Learning
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Affiliate link
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
