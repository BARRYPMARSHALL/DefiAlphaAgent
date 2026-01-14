import { useState, useEffect } from "react";
import { X, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import trezorBg from "@assets/33_1768390214330.png";

interface TrezorImageBannerProps {
  storageKey?: string;
}

const TREZOR_URL = "https://affil.trezor.io/aff_c?offer_id=352&aff_id=36905";

export function TrezorImageBanner({ storageKey = "trezor-image-dismissed" }: TrezorImageBannerProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey);
    setDismissed(isDismissed === "true");
  }, [storageKey]);

  if (dismissed === null || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  return (
    <div 
      className="relative overflow-hidden rounded-lg my-4"
      data-testid="banner-trezor-image"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-20"
        aria-label="Dismiss"
        data-testid="button-dismiss-trezor-image"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      
      <div 
        className="relative w-full h-32 sm:h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${trezorBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        
        <div className="relative z-10 h-full flex items-center px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 shrink-0">
                <Shield className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="text-white">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-1">
                  Protect Your DeFi Gains
                </p>
                <h3 className="text-lg sm:text-xl font-bold leading-tight mb-1">
                  Your Keys. Your Crypto.
                </h3>
                <p className="text-sm text-white/80 hidden sm:block">
                  Trezor hardware wallets keep your yields safe from hacks & exploits
                </p>
              </div>
            </div>
            
            <Button
              asChild
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shrink-0"
              data-testid="button-trezor-cta"
            >
              <a href={TREZOR_URL} target="_blank" rel="noopener noreferrer">
                Shop Trezor Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
