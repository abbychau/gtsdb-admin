# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Next.js development server on port 3000
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint (no auto-fix)
- `npm run lint:fix` - Run ESLint with automatic fixes

## Architecture

This is a Next.js 14 TypeScript application that serves as an admin interface for GTSDB (Go Time Series Database).

### Core Structure
- **App Router**: Uses Next.js 14 app directory structure
- **Dual Context System**: Two React contexts manage application state:
  - `SettingsContext` - Manages API connection settings (hostname, port, apiUrl) with localStorage persistence
  - `ConfigContext` - Handles dynamic configuration from GTSDB API (multipliers, units, offsets, hints with wildcard matching)

### API Layer
- **Backend for Frontend (BFF)**: `/app/api/tsdb/route.ts` proxies requests to GTSDB API
- **Redis Integration**: Stores configuration data keyed by API URL
- **CORS Support**: Handles cross-origin requests with proper headers
- **Streaming Support**: Server-sent events for real-time data subscription

### Key Features
- **Real-time Visualization**: ECharts integration for time series data
- **Key Management**: CRUD operations for GTSDB keys
- **Configuration Management**: Dynamic multipliers/units via Redis
- **Dark/Light Theme**: Tailwind CSS with shadcn/ui components

### Component Organization
- `AdminDashboard` - Main dashboard container with conditional data loading
- `DataOperations` - Handles read/write operations and visualizations
- `Sidebar` - Key browser with TreeView for hierarchical display
- `ServerInfo` - Displays GTSDB server information
- UI components in `/app/components/ui/` following shadcn/ui patterns

### State Management Pattern
Settings flow: URL params → SettingsContext → localStorage persistence
Config flow: API URL change → fetch from GTSDB → Redis storage → ConfigContext

### TypeScript Configuration
- Path aliases: `@/*` maps to `./app/*`
- Strict mode enabled with ES2017 target
- ESLint ignores builds (configured in next.config.mjs)