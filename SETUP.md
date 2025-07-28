# EX_P02 Setup Instructions

## Overview

EX_P02 is a personal knowledge management application built with React, Supabase, and a technical brutalist design aesthetic. This document provides setup instructions for local development.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account and project

## Initial Setup

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the project root with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy and execute the contents of supabase-schema.sql in your Supabase SQL editor
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components (to be added)
├── context/            # React contexts (SessionContext)
├── hooks/              # Custom React hooks (useProjects, useNotes, useLinks)
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── DashboardPage.tsx
│   ├── ProjectPage.tsx
│   └── HomePage.tsx
├── router/             # React Router configuration
├── store/              # Zustand state management
├── supabase/           # Supabase client configuration
└── types/              # TypeScript type definitions
```

## Key Features Implemented

### ✅ Phase 1 (MVP) - COMPLETED
- **Authentication System**: Email/password sign-in with Supabase Auth
- **Project Management**: Full CRUD operations for projects with starring functionality
- **Note Management**: Basic text editing with auto-save and carousel navigation
- **Link Management**: URL storage with basic metadata extraction
- **Dual-Pane Layout**: Desktop interface with expandable left (notes) and right (links) panes
- **Search Functionality**: Real-time project search in dashboard
- **Responsive Design**: Mobile-friendly layouts
- **Technical Brutalist Design**: Monospace fonts, minimal borders, high contrast

### Key Technical Implementations

1. **State Management**: Zustand store for global application state
2. **Data Fetching**: React Query for server state management with optimistic updates
3. **Database**: PostgreSQL via Supabase with Row Level Security
4. **Authentication**: Supabase Auth with session management
5. **Routing**: React Router v7 with protected routes
6. **Styling**: CSS-in-JS with design system variables

### Database Schema

- **Projects**: User workspaces with metadata and starring
- **Notes**: Encrypted content with project association and ordering
- **Links**: URLs with metadata and project association

### Security Features

- Row Level Security (RLS) policies on all tables
- User-scoped data access
- Prepared for client-side encryption (placeholder implemented)

## Development Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

## Next Steps (Phase 2)

- GitHub OAuth integration
- Rich link previews with metadata parsing
- Advanced search with filters
- Mobile-optimized layouts
- Drag-and-drop functionality
- Client-side note encryption
- Real-time collaboration

## Architecture Notes

- The application follows a clean architecture pattern with separation of concerns
- Business logic is extracted from components into custom hooks
- The design system is implemented with CSS custom properties
- Type safety is enforced throughout with TypeScript
- The codebase is prepared for future scaling with modular architecture

## Configuration

The application uses environment variables for configuration. See `src/config.ts` for the configuration setup.

## Troubleshooting

1. **Build Issues**: Ensure all environment variables are set correctly
2. **Database Errors**: Verify Supabase credentials and schema setup
3. **Authentication Issues**: Check Supabase Auth configuration and RLS policies

## Contributing

Follow the existing code patterns and ensure TypeScript compliance. The project uses ESLint for code quality enforcement.