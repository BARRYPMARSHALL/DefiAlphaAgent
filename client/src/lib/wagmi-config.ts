import { http, createConfig, createStorage } from 'wagmi';
import { mainnet, arbitrum, optimism, polygon, base, bsc, avalanche } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, optimism, polygon, base, bsc, avalanche],
  connectors: [
    injected(),
  ],
  storage: createStorage({ storage: noopStorage }),
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

export const supportedChains = [
  { id: mainnet.id, name: 'Ethereum' },
  { id: arbitrum.id, name: 'Arbitrum' },
  { id: optimism.id, name: 'Optimism' },
  { id: polygon.id, name: 'Polygon' },
  { id: base.id, name: 'Base' },
  { id: bsc.id, name: 'BSC' },
  { id: avalanche.id, name: 'Avalanche' },
];
