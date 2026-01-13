import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CreditCard, Zap, Shield, Star } from "lucide-react";

const TRIAL_DURATION_SECONDS = 900;
const TICK_INTERVAL = 10000;
const STORAGE_KEY = "defi-alpha-trial";
const NOWPAYMENTS_LINK = "https://nowpayments.io/payment/?iid=5765498267";

interface TrialData {
  deviceId: string;
  totalSecondsUsed: number;
  premium: boolean;
  createdAt: number;
}

function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getTrialData(): TrialData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse trial data");
  }
  
  const newData: TrialData = {
    deviceId: generateDeviceId(),
    totalSecondsUsed: 0,
    premium: false,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
}

function saveTrialData(data: TrialData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface TrialGateProps {
  children: React.ReactNode;
}

export function TrialGate({ children }: TrialGateProps) {
  const [trialData, setTrialData] = useState<TrialData>(() => getTrialData());
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const remainingSeconds = Math.max(0, TRIAL_DURATION_SECONDS - trialData.totalSecondsUsed);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const trialExpired = trialData.totalSecondsUsed >= TRIAL_DURATION_SECONDS;
  const isPremium = trialData.premium;

  const handleVisibilityChange = useCallback(() => {
    setIsVisible(document.visibilityState === "visible");
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleVisibilityChange, handleFocus, handleBlur]);

  useEffect(() => {
    if (isPremium) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (isVisible && isFocused && !trialExpired) {
      intervalRef.current = setInterval(() => {
        setTrialData((prev) => {
          const updated = {
            ...prev,
            totalSecondsUsed: prev.totalSecondsUsed + 10,
          };
          saveTrialData(updated);
          return updated;
        });
      }, TICK_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isFocused, trialExpired, isPremium]);

  const handlePayWithCrypto = () => {
    window.open(NOWPAYMENTS_LINK, "_blank", "noopener,noreferrer");
  };

  const handleActivatePremium = () => {
    const updated = { ...trialData, premium: true };
    saveTrialData(updated);
    setTrialData(updated);
    toast({
      title: "Premium Activated!",
      description: "You now have unlimited access to all features.",
    });
  };

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      <Dialog open={trialExpired} modal>
        <DialogContent 
          className="sm:max-w-md border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[-1]" />
          
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <DialogHeader className="space-y-3 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
                  Free Trial Ended
                </DialogTitle>
                <DialogDescription className="text-center text-base">
                  You've used your 15 minutes of free access. Unlock unlimited scans, priority alerts, and premium features.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">Unlimited Scans</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">Priority Alerts</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">Premium Features</span>
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <p className="text-lg font-bold text-primary">$4.99/month</p>
                  <p className="text-sm text-muted-foreground">or $39/year (save 35%)</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handlePayWithCrypto}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  data-testid="button-pay-crypto"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay with Crypto (NOWPayments)
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Crypto payments via NOWPayments - USDC/USDT supported
                </p>

                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleActivatePremium}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    data-testid="button-simulate-premium"
                  >
                    (Dev: Simulate Payment Success)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {!trialExpired && remainingMinutes <= 5 && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <Card className="border-primary/30 shadow-lg">
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">
                {remainingMinutes} min{remainingMinutes !== 1 ? "s" : ""} left in trial
              </span>
              <Button 
                size="sm" 
                onClick={handlePayWithCrypto}
                data-testid="button-upgrade-now"
              >
                Upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
