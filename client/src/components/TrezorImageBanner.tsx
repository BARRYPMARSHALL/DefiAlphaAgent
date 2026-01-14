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
      
      <div className="flex overflow-hidden rounded-lg border border-emerald-500/30">
        <div className="flex-1 bg-gradient-to-r from-emerald-950 to-emerald-900 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 shrink-0">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-white">
              <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">
                Protect Your DeFi Gains
              </p>
              <h3 className="text-sm font-bold leading-tight">
                Your Keys. Your Crypto.
              </h3>
            </div>
          </div>
          
          <a 
            href={TREZOR_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg shadow-lg transition-colors"
            data-testid="button-trezor-cta"
          >
            Shop Trezor Now
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        
        <div 
          className="w-32 bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${trezorBg})`, backgroundPosition: 'center center' }}
        />
      </div>
    </div>
  );
}
