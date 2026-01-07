import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPublicClient, http, formatUnits, type Address, type Chain } from 'viem';
import { mainnet, arbitrum, optimism, polygon, base, bsc, avalanche } from 'viem/chains';

interface WalletState {
  address: Address | null;
  chainId: number | null;
  balance: bigint | null;
  balanceSymbol: string;
  balanceDecimals: number;
  isConnected: boolean;
  isConnecting: boolean;
  chain: Chain | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  hasProvider: boolean;
}

const chains: Chain[] = [mainnet, arbitrum, optimism, polygon, base, bsc, avalanche];

const getChainById = (chainId: number): Chain | null => {
  return chains.find(c => c.id === chainId) || null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    balanceSymbol: 'ETH',
    balanceDecimals: 18,
    isConnected: false,
    isConnecting: false,
    chain: null,
  });

  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    const checkProvider = () => {
      const provider = typeof window !== 'undefined' && (window as any).ethereum;
      setHasProvider(!!provider);
    };
    checkProvider();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('ethereum#initialized', checkProvider);
      return () => window.removeEventListener('ethereum#initialized', checkProvider);
    }
  }, []);

  const fetchBalance = useCallback(async (address: Address, chainId: number) => {
    const chain = getChainById(chainId);
    if (!chain) return;

    try {
      const client = createPublicClient({
        chain,
        transport: http(),
      });

      const balance = await client.getBalance({ address });
      setState(prev => ({
        ...prev,
        balance,
        balanceSymbol: chain.nativeCurrency.symbol,
        balanceDecimals: chain.nativeCurrency.decimals,
      }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = (window as any).ethereum;
    if (!provider) return;

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      const chain = getChainById(chainId);
      const address = accounts[0] as Address;

      setState(prev => ({
        ...prev,
        address,
        chainId,
        chain,
        isConnected: true,
        isConnecting: false,
      }));

      await fetchBalance(address, chainId);
    } catch (error) {
      console.error('Failed to connect:', error);
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [fetchBalance]);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      balance: null,
      balanceSymbol: 'ETH',
      balanceDecimals: 18,
      isConnected: false,
      isConnecting: false,
      chain: null,
    });
  }, []);

  useEffect(() => {
    const provider = (window as any).ethereum;
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const address = accounts[0] as Address;
        setState(prev => ({ ...prev, address }));
        if (state.chainId) {
          fetchBalance(address, state.chainId);
        }
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const chain = getChainById(chainId);
      setState(prev => ({ ...prev, chainId, chain }));
      if (state.address) {
        fetchBalance(state.address, chainId);
      }
    };

    const handleDisconnect = () => {
      disconnect();
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, [state.address, state.chainId, disconnect, fetchBalance]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, hasProvider }}>
      {children}
    </WalletContext.Provider>
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
