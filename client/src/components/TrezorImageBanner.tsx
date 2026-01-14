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
      
      <div className="flex flex-col sm:flex-row overflow-hidden rounded-lg border border-emerald-500/30">
        <div 
          className="w-full sm:w-48 h-24 sm:h-auto bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${trezorBg})`, backgroundPosition: 'right center' }}
        />
        
        <div className="flex-1 bg-gradient-to-r from-emerald-950 to-emerald-900 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 shrink-0">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-white">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-0.5">
                  Protect Your DeFi Gains
                </p>
                <h3 className="text-base sm:text-lg font-bold leading-tight">
                  Your Keys. Your Crypto.
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Trezor keeps your yields safe from hacks
                </p>
              </div>
            </div>
            
            <a 
              href={TREZOR_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg shadow-lg transition-colors shrink-0"
              data-testid="button-trezor-cta"
            >
              Shop Trezor Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
