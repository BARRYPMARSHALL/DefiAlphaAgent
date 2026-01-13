import { ExternalLink, X, Shield, Calculator, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface AffiliateBannerProps {
  variant?: "sidebar" | "inline" | "card";
  storageKey?: string;
}

const LEDGER_URL = "https://shop.ledger.com/?r=YOUR_LEDGER_REFERRAL";
const TREZOR_URL = "https://trezor.io/?offer_id=YOUR_TREZOR_REFERRAL";
const KOINLY_URL = "https://koinly.io/?via=YOUR_KOINLY_REFERRAL";

export function LedgerBanner({ variant = "inline", storageKey = "ledger-banner-dismissed" }: AffiliateBannerProps) {
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

  if (variant === "sidebar") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border border-orange-400/30 p-4"
        style={{
          background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.15) 100%)",
        }}
        data-testid="banner-ledger-sidebar"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shrink-0 shadow-md">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <Badge className="bg-orange-500 text-white border-0 text-[10px] mb-2">
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Hardware Wallet
            </Badge>
            <p className="text-sm font-bold leading-tight text-foreground">
              Protect Your Crypto
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Secure your DeFi earnings with Ledger hardware wallet
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold"
            data-testid="button-ledger-sidebar"
          >
            <a href={LEDGER_URL} target="_blank" rel="noopener noreferrer">
              Shop Ledger
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border border-orange-400/30 p-4"
        style={{
          background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.1) 100%)",
        }}
        data-testid="banner-ledger-card"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shrink-0 shadow-md">
            <HardDrive className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-foreground">Secure Your Earnings</p>
              <Badge className="bg-orange-500 text-white border-0 text-[10px]">Recommended</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Protect your DeFi gains with a Ledger hardware wallet - the gold standard in crypto security.
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shrink-0"
            data-testid="button-ledger-card"
          >
            <a href={LEDGER_URL} target="_blank" rel="noopener noreferrer">
              Shop Ledger
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={LEDGER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-lg border border-orange-400/30 hover:border-orange-400 transition-all hover:shadow-md"
      style={{
        background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.1) 100%)",
      }}
      data-testid="banner-ledger-inline"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shrink-0 group-hover:scale-110 transition-transform">
        <HardDrive className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">Ledger Hardware Wallet</p>
          <Badge className="bg-orange-500 text-white border-0 text-[10px]">Security</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Protect your DeFi earnings</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
    </a>
  );
}

export function TrezorBanner({ variant = "inline", storageKey = "trezor-banner-dismissed" }: AffiliateBannerProps) {
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

  if (variant === "sidebar") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border border-emerald-400/30 p-4"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%)",
        }}
        data-testid="banner-trezor-sidebar"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shrink-0 shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <Badge className="bg-emerald-500 text-white border-0 text-[10px] mb-2">
              Open Source
            </Badge>
            <p className="text-sm font-bold leading-tight text-foreground">
              Trezor Wallet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Open-source hardware security for your crypto
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
            data-testid="button-trezor-sidebar"
          >
            <a href={TREZOR_URL} target="_blank" rel="noopener noreferrer">
              Shop Trezor
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={TREZOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-lg border border-emerald-400/30 hover:border-emerald-400 transition-all hover:shadow-md"
      style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%)",
      }}
      data-testid="banner-trezor-inline"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shrink-0 group-hover:scale-110 transition-transform">
        <Shield className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">Trezor Hardware Wallet</p>
          <Badge className="bg-emerald-500 text-white border-0 text-[10px]">Open Source</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Secure open-source protection</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
    </a>
  );
}

export function KoinlyBanner({ variant = "inline", storageKey = "koinly-banner-dismissed" }: AffiliateBannerProps) {
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

  if (variant === "sidebar") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border border-blue-400/30 p-4"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%)",
        }}
        data-testid="banner-koinly-sidebar"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shrink-0 shadow-md">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <Badge className="bg-blue-500 text-white border-0 text-[10px] mb-2">
              Tax Season
            </Badge>
            <p className="text-sm font-bold leading-tight text-foreground">
              Crypto Tax Made Easy
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Track DeFi yields and generate tax reports automatically
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold"
            data-testid="button-koinly-sidebar"
          >
            <a href={KOINLY_URL} target="_blank" rel="noopener noreferrer">
              Try Koinly Free
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div 
        className="relative overflow-hidden rounded-lg border border-blue-400/30 p-4"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%)",
        }}
        data-testid="banner-koinly-card"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shrink-0 shadow-md">
            <Calculator className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-foreground">Track Your DeFi Taxes</p>
              <Badge className="bg-blue-500 text-white border-0 text-[10px]">Essential</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically calculate taxes on all your yield farming, LP rewards, and DeFi transactions.
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shrink-0"
            data-testid="button-koinly-card"
          >
            <a href={KOINLY_URL} target="_blank" rel="noopener noreferrer">
              Try Free
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={KOINLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-lg border border-blue-400/30 hover:border-blue-400 transition-all hover:shadow-md"
      style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%)",
      }}
      data-testid="banner-koinly-inline"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shrink-0 group-hover:scale-110 transition-transform">
        <Calculator className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">Koinly Tax Calculator</p>
          <Badge className="bg-blue-500 text-white border-0 text-[10px]">Free Trial</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Auto-track DeFi yields for tax</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
    </a>
  );
}
