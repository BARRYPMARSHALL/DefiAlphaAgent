import { createContext, useContext, type ReactNode } from 'react';
import { WagmiProvider, useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig, chains } from './wagmi-config';
import { formatUnits, type Address } from 'viem';

const queryClient = new QueryClient();

interface ChainInfo {
  id: number;
  name: string;
}

interface WalletContextValue {
  address: Address | undefined;
  chainId: number | undefined;
  balance: bigint | null;
  balanceSymbol: string;
  balanceDecimals: number;
  isConnected: boolean;
  isConnecting: boolean;
  chain: ChainInfo | undefined;
  connect: (connectorId?: string) => void;
  disconnect: () => void;
  connectors: ReturnType<typeof useConnect>['connectors'];
}

const WalletContext = createContext<WalletContextValue | null>(null);

function WalletContextProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });

  const handleConnect = (connectorId?: string) => {
    const connector = connectorId 
      ? connectors.find(c => c.id === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase()))
      : connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const value: WalletContextValue = {
    address,
    chainId,
    balance: balanceData?.value ?? null,
    balanceSymbol: balanceData?.symbol || 'ETH',
    balanceDecimals: balanceData?.decimals || 18,
    isConnected,
    isConnecting,
    chain: chain ? { id: chain.id, name: chain.name } : undefined,
    connect: handleConnect,
    disconnect,
    connectors,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function formatBalance(balance: bigint | null, decimals: number = 18): string {
  if (!balance) return '0';
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  return num.toFixed(4);
}

export { chains };
