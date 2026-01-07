import { createConfig, http, type Config } from 'wagmi';
import { mainnet, arbitrum, optimism, polygon, base, bsc, avalanche } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const hasWalletConnectProjectId = !!projectId && projectId.length > 0;

export const chains = [mainnet, arbitrum, optimism, polygon, base, bsc, avalanche] as const;

const connectors = hasWalletConnectProjectId
  ? [
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
    ]
  : [injected()];

export const wagmiConfig: Config = createConfig({
  chains,
  connectors,
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

export { hasWalletConnectProjectId };
