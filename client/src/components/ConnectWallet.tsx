import { useWallet, formatBalance } from '@/lib/wallet-context';
import { hasWalletConnectProjectId } from '@/lib/wagmi-config';
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
import { SiWalletconnect } from 'react-icons/si';

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    chain, 
    balance, 
    balanceSymbol, 
    balanceDecimals,
    connect, 
    disconnect,
    connectors 
  } = useWallet();
  
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

  const handleConnectorClick = async (connectorId: string) => {
    try {
      connect(connectorId);
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Connection error:', err);
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
              {balance !== null ? `${formatBalance(balance, balanceDecimals)} ${balanceSymbol}` : 'Loading...'}
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

  const injectedConnector = connectors.find(c => c.id === 'injected');
  const wcConnector = hasWalletConnectProjectId ? connectors.find(c => c.id === 'walletConnect') : null;

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={isConnecting}
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
            {injectedConnector && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handleConnectorClick('injected')}
                disabled={isConnecting}
                data-testid="button-connector-injected"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Browser Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      MetaMask, Coinbase Wallet, etc.
                    </p>
                  </div>
                </div>
              </Button>
            )}

            {wcConnector && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handleConnectorClick('walletConnect')}
                disabled={isConnecting}
                data-testid="button-connector-walletconnect"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-[#3B99FC] flex items-center justify-center">
                    <SiWalletconnect className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">WalletConnect</p>
                    <p className="text-xs text-muted-foreground">
                      Scan with mobile wallet
                    </p>
                  </div>
                </div>
              </Button>
            )}

            {connectors.length === 0 && (
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
