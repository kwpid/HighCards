# HighCard - Single Player Card Game

## Overview

HighCard is a single-player card game application built with React, TypeScript, and Firebase. The game features both casual and ranked gameplay modes where players compete against AI opponents in 1v1 and 2v2 card battles. Players are dealt 8 random cards plus 2 power-up cards for 10-round matches, with highest card winning each round. The application includes a comprehensive ranking system with seasonal resets, placement matches, and MMR-based matchmaking simulation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks and context (useAuth, useGame) with TanStack Query for server state
- **Routing**: Single-page application with programmatic navigation between game screens
- **Theme System**: Dark mode support with system preference detection

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Database Integration**: Configured for PostgreSQL with Drizzle ORM but currently using in-memory storage
- **API Structure**: RESTful API with `/api` prefix for all routes
- **Session Management**: Express sessions with PostgreSQL session store configuration
- **Development**: Hot module replacement with Vite integration

### Data Storage Solutions
- **Primary Database**: Firebase Firestore for user data, game statistics, and seasonal rankings
- **Authentication**: Firebase Authentication with email/username login
- **Local Storage**: Browser storage for theme preferences and temporary game state
- **In-Memory Cache**: Server-side memory storage for active game sessions

### Authentication and Authorization
- **Provider**: Firebase Authentication with custom username validation
- **User Management**: AuthContext provider managing user state across the application
- **Username Requirements**: 3-20 characters, English alphanumeric only, unique across platform
- **Session Persistence**: Firebase handles authentication persistence automatically

### Game Logic Architecture
- **Game Engine**: Custom React hooks managing game state, card dealing, and AI behavior
- **Ranking System**: MMR-based ranking with Bronze through Grand Champion tiers
- **Seasonal System**: Monthly seasons with soft resets and placement matches
- **AI Opponents**: Simulated matchmaking with realistic queue times based on player MMR
- **Card System**: Standard deck with power-up cards (BOOST, DOUBLE, STEAL, SHIELD)

### External Dependencies
- **Firebase**: Complete backend-as-a-service for authentication and data persistence
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations (configured but not actively used)
- **Neon Database**: PostgreSQL hosting service (configured via environment variables)