import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance: bigint | undefined, decimals: number = 18): string {
  if (!balance) return '0';
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  return num.toFixed(4);
}

export function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEtherscan = () => {
    if (address && chain) {
      const explorers: Record<number, string> = {
        1: 'https://etherscan.io',
        42161: 'https://arbiscan.io',
        10: 'https://optimistic.etherscan.io',
        137: 'https://polygonscan.com',
        8453: 'https://basescan.org',
        56: 'https://bscscan.com',
        43114: 'https://snowtrace.io',
      };
      const explorer = explorers[chain.id] || 'https://etherscan.io';
      window.open(`${explorer}/address/${address}`, '_blank');
    }
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-wallet-connected">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <span className="sm:hidden">{address.slice(0, 6)}...</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{chain?.name || 'Unknown Network'}</p>
            <p className="text-xs text-muted-foreground">
              {balance ? `${formatBalance(balance.value, balance.decimals)} ${balance.symbol}` : 'Loading...'}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} data-testid="button-copy-address">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openEtherscan} data-testid="button-view-explorer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()} data-testid="button-disconnect">
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isPending}
        className="gap-2"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to Alpha Yield Scout
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {connectors.length > 0 ? (
              connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => {
                    connect({ connector });
                    setIsDialogOpen(false);
                  }}
                  disabled={isPending}
                  data-testid={`button-connector-${connector.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{connector.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {connector.id === 'injected' ? 'Browser Wallet' : 'Connect with ' + connector.name}
                      </p>
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No wallet detected</p>
                <p className="text-xs mt-1">Install MetaMask or another browser wallet extension</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
