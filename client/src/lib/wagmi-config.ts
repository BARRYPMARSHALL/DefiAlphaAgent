import { createConfig, http, type Config } from 'wagmi';
import { mainnet, arbitrum, optimism, polygon, base, bsc, avalanche } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const chains = [mainnet, arbitrum, optimism, polygon, base, bsc, avalanche] as const;

export const wagmiConfig: Config = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Alpha Yield Scout',
        description: 'DeFi Yield Optimizer Dashboard',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://alpha-yield-scout.replit.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
  },
});
