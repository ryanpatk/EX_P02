# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EX_P02 is a personal knowledge management application built as a React web app with Supabase backend. The app features a dual-pane interface for managing notes and bookmarks within project-based workspaces, targeting a technical brutalist aesthetic with Y2K cyber influences.

## Development Commands

```bash
# Development
npm run dev                 # Start development server with Vite
npm run build              # Build for production (runs TypeScript check + Vite build)
npm run lint               # Run ESLint with TypeScript support
npm run preview            # Preview production build locally

# Environment Setup
# Create .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Custom CSS with utility classes (Technical Brutalist design system)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: Zustand global store
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v7

### Core Structure
- **Authentication Flow**: Supabase Auth with email/password and GitHub OAuth
- **Session Management**: Global session context via `SessionProvider` and `useSession` hook
- **Route Protection**: `AuthProtectedRoute` component guards authenticated routes
- **Project-Based Organization**: Notes and links grouped by projects/workspaces
- **Design System**: Technical brutalist aesthetic with CSS custom properties and utility classes

### Key Files and Patterns
- `/src/router/index.tsx` - Route definitions with nested protected routes
- `/src/context/SessionContext.tsx` - Global session state management
- `/src/Providers.tsx` - Provider composition (add new providers here)
- `/src/supabase/index.ts` - Supabase client configuration
- `/src/pages/` - Page components organized by feature area

### Data Schema (Per PRD)
The application will implement three main database tables:
- **Projects**: User workspaces with starring and sorting capabilities
- **Notes**: Encrypted note content with project association and ordering
- **Links**: URL bookmarks with metadata and project association

### Security Considerations
- Notes will be encrypted client-side before storage in Supabase
- All data is user-scoped through Supabase RLS policies
- Authentication handled via Supabase Auth with secure session management

### Design System (Per PRD)
- **Aesthetic**: Technical brutalist with Y2K cyber influences
- **Typography**: JetBrains Mono monospace font throughout
- **Color Palette**: Grayscale base with orange/pink accents
- **Layout**: Bento grid system with minimal borders and sharp corners
- **Responsive**: Mobile-first with dual-pane desktop, single-pane mobile

## Development Notes

### Current State
The EX_P02 MVP is fully implemented with all core features working. The application includes GitHub OAuth, project management, note editing with auto-save, link management, search functionality, and a responsive dual-pane layout with technical brutalist styling.

### Implementation Priorities
1. **Phase 1 (MVP)**: Basic CRUD for projects, notes, and links with simple search
2. **Phase 2**: Rich link previews, mobile layouts, drag-and-drop, encryption
3. **Phase 3**: Real-time features, advanced editing, native app builds

### Key Integration Points
- Supabase client is configured in `/src/supabase/index.ts`
- Session state flows through `SessionProvider` to all components
- Route protection uses `AuthProtectedRoute` wrapper for authenticated areas
- All new features should integrate with existing auth and routing patterns

### Testing Strategy
No testing framework is currently configured. Consider adding Vitest for unit tests and Playwright for E2E testing as the application grows.