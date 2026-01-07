# Alpha Yield Scout

## Overview

Alpha Yield Scout is a real-time DeFi yield optimizer dashboard that helps users find the best liquidity pools and lending opportunities across multiple blockchain networks. The application fetches yield data from DeFiLlama's public API, calculates risk-adjusted scores, and presents actionable recommendations for yield farming strategies.

The dashboard displays yield opportunities with filtering, sorting, and smart recommendations based on APY, TVL, and impermanent loss risk factors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode)
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Charts**: Recharts for data visualization (chain distribution pie chart)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints proxying and processing DeFiLlama data
- **Data Processing**: Server-side filtering, sorting, and risk score calculations
- **Caching**: In-memory cache with 2-minute TTL for API responses

### Data Flow
1. Client requests pool data via `/api/pools` with filter/sort parameters
2. Server fetches from DeFiLlama API (https://yields.llama.fi/pools) or returns cached data
3. Server calculates risk-adjusted scores and applies filters
4. Processed data returned to client with stats and chain distribution

### Key Design Decisions

**Server-side filtering over client-side**: The DeFiLlama API returns thousands of pools. Processing happens server-side to reduce client payload and computation.

**Risk-adjusted scoring algorithm**: Pools are scored using the formula: `APY * (TVL / 1e7) * (1 - ilRiskFactor)` where impermanent loss risk factor varies by exposure type.

**Persistent user preferences**: Filter and sort preferences are saved to localStorage and restored on page load.

**Auto-refresh pattern**: Data refreshes every 5 minutes using React Query's refetch interval.

### Database Schema
The application includes a basic Drizzle ORM schema with PostgreSQL for user management (currently using in-memory storage). The `users` table supports future authentication features.

### Build System
- Development: Vite dev server with HMR, proxying API requests to Express
- Production: Vite builds static assets, esbuild bundles server code

## External Dependencies

### APIs
- **DeFiLlama Yields API**: `https://yields.llama.fi/pools` - Primary data source for yield pool information (no API key required)

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable, managed with Drizzle ORM
- **Drizzle Kit**: Used for schema migrations (`db:push` script)

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Data fetching and caching
- `recharts`: Chart visualization
- `@radix-ui/*`: Accessible UI primitives
- `wouter`: Lightweight React router
- `zod`: Runtime type validation
