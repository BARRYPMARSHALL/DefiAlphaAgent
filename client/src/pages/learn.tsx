import { Link } from "wouter";
import { ArrowLeft, GraduationCap, TrendingUp, Shield, Zap, Calculator, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CourseModule, CourseProgress } from "@/components/CourseModule";
import { TrezorBanner, KoinlyBanner } from "@/components/AffiliateBanners";
import { NexoBanner } from "@/components/NexoBanner";
import { EmailCaptureButton } from "@/components/EmailCapture";
import { LedgerImageBanner } from "@/components/LedgerImageBanner";

export default function Learn() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight" data-testid="text-learn-title">
                Free DeFi Course
              </h1>
              <span className="text-xs text-muted-foreground">Master yield farming in 30 minutes</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="mb-8">
              <Badge className="mb-3 bg-chart-2 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                100% Free
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                DeFi Yield Farming Masterclass
              </h2>
              <p className="text-muted-foreground text-lg">
                Learn how to find, evaluate, and safely earn yields in DeFi. From basics to advanced strategies.
              </p>
            </div>

            <CourseModule
              id="defi-basics"
              title="Module 1: DeFi Basics"
              description="What is DeFi, wallets, and how to stay safe"
              duration="5 min"
              defaultOpen={true}
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                What is DeFi?
              </h4>
              <p className="mb-4">
                <strong>Decentralized Finance (DeFi)</strong> refers to financial applications built on blockchain networks that operate without traditional intermediaries like banks. Instead of trusting a company, you trust code (smart contracts) that runs exactly as programmed.
              </p>
              <h5 className="font-medium mb-2">Key DeFi Concepts:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Smart Contracts</strong> - Self-executing code on the blockchain that handles your funds automatically</li>
                <li><strong>Liquidity Pools</strong> - Pools of tokens locked in smart contracts that enable trading</li>
                <li><strong>Yield Farming</strong> - Earning rewards by providing liquidity or staking tokens</li>
                <li><strong>TVL (Total Value Locked)</strong> - The total amount of assets deposited in a protocol</li>
              </ul>
              <h5 className="font-medium mb-2">Wallet Security Basics:</h5>
              <p className="mb-4">
                Your wallet is your gateway to DeFi. Protecting it is critical:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Never share your seed phrase with anyone</li>
                <li>Use a hardware wallet for large amounts</li>
                <li>Verify contract addresses before interacting</li>
                <li>Start with small amounts when trying new protocols</li>
              </ul>
              <div className="mt-6">
                <LedgerImageBanner variant="inline" storageKey="learn-ledger-module-1" />
              </div>
            </CourseModule>

            <CourseModule
              id="yield-farming-101"
              title="Module 2: Yield Farming 101"
              description="APY vs APR, liquidity pools, and how yields work"
              duration="7 min"
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Understanding Yields
              </h4>
              <h5 className="font-medium mb-2">APY vs APR:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>APR (Annual Percentage Rate)</strong> - Simple interest without compounding. 10% APR means you earn 10% per year on your principal.</li>
                <li><strong>APY (Annual Percentage Yield)</strong> - Includes compound interest. 10% APY with daily compounding is actually higher than 10% APR.</li>
              </ul>
              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm font-mono">
                  Example: $1,000 at 10% APR = $1,100 after 1 year<br/>
                  Example: $1,000 at 10% APY (daily compound) = $1,105.16 after 1 year
                </p>
              </div>
              <h5 className="font-medium mb-2">How Liquidity Pools Work:</h5>
              <p className="mb-4">
                When you provide liquidity to a pool (e.g., ETH-USDC), you deposit both tokens in equal value. Traders swap between these tokens and pay fees, which go to liquidity providers (LPs).
              </p>
              <h5 className="font-medium mb-2">Where Yields Come From:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Trading Fees</strong> - Your share of swap fees (usually 0.3%)</li>
                <li><strong>Token Rewards</strong> - Protocols distribute their native tokens to attract liquidity</li>
                <li><strong>Lending Interest</strong> - Borrowers pay interest on loans</li>
              </ul>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm">
                  <strong>Pro Tip:</strong> High APYs often come from token rewards that can lose value. Always check what the rewards are and their sustainability.
                </p>
              </div>
            </CourseModule>

            <CourseModule
              id="risk-management"
              title="Module 3: Risk Management"
              description="Rug pulls, smart contract risk, and how to protect yourself"
              duration="6 min"
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Understanding DeFi Risks
              </h4>
              <h5 className="font-medium mb-2">Common DeFi Risks:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Smart Contract Risk</strong> - Bugs in code can be exploited, leading to loss of funds</li>
                <li><strong>Impermanent Loss (IL)</strong> - When token prices diverge, LPs can lose value compared to just holding</li>
                <li><strong>Rug Pulls</strong> - Malicious projects where developers drain liquidity</li>
                <li><strong>Oracle Manipulation</strong> - Price feed attacks that drain protocols</li>
              </ul>
              <h5 className="font-medium mb-2">How to Minimize Risk:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Stick to audited protocols with a track record</li>
                <li>Check TVL - higher TVL usually means more trust</li>
                <li>Diversify across multiple protocols and chains</li>
                <li>Use DeFi insurance for large positions</li>
                <li>Avoid anonymous teams and unverified contracts</li>
              </ul>
              <h5 className="font-medium mb-2">Reading Risk Scores:</h5>
              <p className="mb-4">
                On DeFi Alpha Agent, we calculate risk-adjusted scores based on APY, TVL, and impermanent loss risk. Higher scores = better risk/reward balance.
              </p>
              <div className="mt-6">
                <TrezorBanner variant="inline" storageKey="learn-trezor-3" />
              </div>
            </CourseModule>

            <CourseModule
              id="auto-compounding"
              title="Module 4: Auto-Compounding Vaults"
              description="Why Beefy and Yearn vaults can boost your returns"
              duration="5 min"
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                The Power of Auto-Compounding
              </h4>
              <p className="mb-4">
                Manual compounding requires you to claim rewards and re-deposit them regularly. Auto-compounding vaults like <strong>Beefy</strong> and <strong>Yearn</strong> do this automatically, often multiple times per day.
              </p>
              <h5 className="font-medium mb-2">How Auto-Compound Vaults Work:</h5>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>You deposit LP tokens or single assets into the vault</li>
                <li>The vault harvests rewards automatically</li>
                <li>Rewards are sold and re-invested into your position</li>
                <li>Your share of the vault grows over time</li>
              </ol>
              <h5 className="font-medium mb-2">Benefits:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Higher Effective APY</strong> - Frequent compounding maximizes returns</li>
                <li><strong>Gas Savings</strong> - Costs are shared across all vault users</li>
                <li><strong>Set and Forget</strong> - No need to manually claim and reinvest</li>
              </ul>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm">
                  <strong>DeFi Alpha Agent Tip:</strong> Look for the green checkmark badge on pools - it means a Beefy vault is available for that LP position!
                </p>
              </div>
            </CourseModule>

            <CourseModule
              id="advanced-strategies"
              title="Module 5: Advanced Strategies"
              description="Leveraged farming, delta-neutral, and CeFi alternatives"
              duration="8 min"
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Going Beyond Basic Farming
              </h4>
              <h5 className="font-medium mb-2">Leveraged Farming:</h5>
              <p className="mb-4">
                Platforms like Alpaca Finance let you borrow funds to amplify your farming position. A 2x leverage means double the exposure - and double the risk.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Higher potential returns</li>
                <li>Risk of liquidation if prices move against you</li>
                <li>Borrowing costs eat into profits</li>
              </ul>
              <h5 className="font-medium mb-2">Delta-Neutral Strategies:</h5>
              <p className="mb-4">
                These strategies aim to earn yield while minimizing price exposure. Common approaches:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Provide liquidity in stablecoin pairs (USDC-USDT)</li>
                <li>Hedge LP positions with perpetual shorts</li>
                <li>Use funding rate arbitrage</li>
              </ul>
              <h5 className="font-medium mb-2">CeFi Alternative: When Simpler is Better</h5>
              <p className="mb-4">
                Sometimes the best strategy is the simplest. CeFi platforms like Nexo offer predictable yields without smart contract risk or impermanent loss.
              </p>
              <div className="mt-6">
                <NexoBanner variant="featured" storageKey="learn-nexo-5" />
              </div>
            </CourseModule>

            <CourseModule
              id="tax-tracking"
              title="Module 6: Tax & Portfolio Tracking"
              description="Track your yields and stay compliant"
              duration="4 min"
            >
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Managing Your DeFi Taxes
              </h4>
              <p className="mb-4">
                DeFi transactions can create taxable events. In most jurisdictions, you may owe taxes on:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Claiming and selling reward tokens</li>
                <li>Swapping tokens (even within DeFi)</li>
                <li>Withdrawing from liquidity pools</li>
                <li>Realized gains from any token sales</li>
              </ul>
              <h5 className="font-medium mb-2">Why Use a Crypto Tax Tool:</h5>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Automatically imports transactions from 100+ exchanges and chains</li>
                <li>Calculates cost basis using various methods (FIFO, LIFO, etc.)</li>
                <li>Generates tax reports for your accountant</li>
                <li>Tracks DeFi-specific events like LP deposits/withdrawals</li>
              </ul>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm">
                  <strong>Tip:</strong> Start tracking from day one. Trying to reconstruct your DeFi history at tax time is painful!
                </p>
              </div>
              <div className="mt-6">
                <KoinlyBanner variant="card" storageKey="learn-koinly-6" />
              </div>
            </CourseModule>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Ready to Find Alpha?</h3>
                  <p className="text-muted-foreground">Apply what you learned and discover high-yield opportunities.</p>
                </div>
                <Link href="/">
                  <Button size="lg" data-testid="button-go-to-dashboard">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <CourseProgress />
              
              <div className="p-4 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg border">
                <h4 className="font-semibold mb-2">Quick Reference</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Get our one-page DeFi cheat sheet with formulas and tips.
                </p>
                <EmailCaptureButton />
              </div>
              
              <LedgerImageBanner variant="sidebar" storageKey="learn-sidebar-ledger" />
              <KoinlyBanner variant="sidebar" storageKey="learn-sidebar-koinly" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
