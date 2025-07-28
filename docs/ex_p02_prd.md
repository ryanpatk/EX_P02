# EX_P02 Project Requirements Document

## Project Overview

**Project Codename:** EX_P02  
**Product Type:** Personal Knowledge Management Application  
**Platform:** Web (React), with future native app support via Capacitor/Tauri  

### Product Vision
A streamlined, dual-pane knowledge management application that enables users to organize and access their notes and bookmarks within project-based workspaces. The app prioritizes speed, responsiveness, and an intuitive user experience across desktop and mobile devices.

---

## Core Features & Functionality

### 1. Project Management
- **Project Organization**: Notes and links are grouped into projects/folders
- **Project Overview**: Dashboard view displaying all projects at a glance
- **Project Prioritization**: Ability to star/pin important projects
- **Project Sorting**: Default sort by `last_modified` date, with starred projects appearing first
- **Project Selection**: One-click access to enter a specific project workspace

### 2. Note Management
- **Rich Text Editor**: Live note editing with real-time updates
- **Note Navigation**: Carousel-style dots navigation for switching between notes within a project
- **Automatic Titles**: If no title is provided, auto-generate using timestamp
- **CRUD Operations**: Create, read, update, and delete notes seamlessly
- **Inline Creation**: New notes created instantly with blank content (no modals)
- **Cross-Project Movement**: Drag-and-drop or alternative intuitive method to move notes between projects

### 3. Link Management  
- **Link Preview Grid**: Infinite grid layout displaying rich link previews
- **Link Actions**: Click to open individual links or select multiple for batch opening
- **Link Metadata**: Store and display title, description, favicon, and preview image when available
- **CRUD Operations**: Create, read, update, and delete links with ease
- **Inline Creation**: New links created instantly with blank data (no modals)
- **Cross-Project Movement**: Drag-and-drop or alternative method to move links between projects

### 4. User Interface & Layout

#### Desktop Experience
- **Dual-Pane Layout**: Split-screen with note editor (left) and link grid (right)
- **Expandable Sections**: Either pane can expand to full-screen or be hidden
- **Responsive Design**: Optimized for various desktop screen sizes

#### Mobile Experience  
- **Single-Pane Layout**: Display either notes or links at a time due to screen constraints
- **Quick Switching**: Easy toggle between notes and links views
- **Touch Optimized**: Gestures and interactions optimized for mobile devices

### 5. Search Functionality
- **Global Search**: Search across all projects, notes, and links from the main dashboard
- **Project Search**: Scoped search within the currently active project
- **Real-time Results**: Instant search results as user types
- **Multi-Content Search**: Search through note content, link titles, and link URLs

### 6. User Management
- **Authentication**: Email/password and GitHub OAuth sign-in options
- **User Profile**: View current user information and account settings
- **Session Management**: Secure login/logout functionality

---

## Technical Architecture

### Frontend Stack
- **Framework**: React with Vite build tool
- **Styling**: Tailwind CSS for core styling and theming
- **Component Library**: Chakra UI for additional pre-built components  
- **State Management**: Zustand for application state
- **Data Fetching**: React Query (TanStack Query) for server state management
- **Routing**: React Router for navigation

### Backend & Infrastructure
- **Backend-as-a-Service**: Supabase for database, authentication, and real-time features
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with email/password and GitHub providers
- **File Storage**: Supabase Storage (if needed for link preview caching)

### Security & Data Protection
- **Client-Side Encryption**: Notes encrypted before storage in Supabase using app-managed encryption keys
- **Secure Authentication**: Industry-standard OAuth and session management
- **Type Safety**: Full TypeScript implementation with Supabase-generated types

### Performance & Optimization
- **Optimistic Updates**: React Query cache updater utilities for immediate UI feedback
- **Responsive Design**: Fast, fluid interactions across all device types
- **Code Architecture**: Business logic extracted from components using clean patterns
- **Caching Strategy**: Intelligent caching with React Query for optimal performance

### Future Technical Considerations
- **Link Preview Service**: Separate microservice for parsing rich link metadata (follow-up item)
- **Native Apps**: Capacitor (mobile) and/or Tauri (desktop) for native app versions
- **Real-time Sync**: Leverage Supabase real-time subscriptions for multi-device sync

---

## Data Schema

### Projects Table
```typescript
interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  is_starred: boolean
  created_at: timestamp
  updated_at: timestamp
  last_modified: timestamp
}
```

### Notes Table
```typescript
interface Note {
  id: string
  project_id: string
  user_id: string
  title?: string
  encrypted_content: string // Client-side encrypted
  created_at: timestamp
  updated_at: timestamp
  order_index: number
}
```

### Links Table
```typescript
interface Link {
  id: string
  project_id: string
  user_id: string
  url: string
  title?: string
  description?: string
  favicon_url?: string
  preview_image_url?: string
  created_at: timestamp
  updated_at: timestamp
  order_index: number
}
```

---

## Visual Design System & Aesthetic

### Design Philosophy
EX_P02 embraces a **technical brutalist aesthetic** with strong Y2K cyber influences, prioritizing function over form while maintaining visual sophistication. The design language reflects a digital-first mindset that celebrates utility and information density.

### Visual Principles
- **High Information Density**: Maximum content visibility with minimal UI chrome
- **Functional Minimalism**: Every visual element serves a purpose; no superfluous decoration
- **Technical Precision**: Sharp, precise layouts that feel engineered rather than designed
- **Digital Authenticity**: Embrace the medium with terminal-inspired aesthetics

### Color Palette
```css
/* Primary Colors */
--color-white: #FFFFFF
--color-light-grey: #F5F5F5
--color-medium-grey: #E0E0E0
--color-dark-grey: #333333
--color-black: #000000

/* Accent Colors */
--color-orange: #FF6B35        /* Primary accent for CTAs and highlights */
--color-pink: #FF69B4          /* Secondary accent for status and alerts */
--color-orange-muted: #FF8A5C  /* Hover states and secondary actions */
--color-pink-muted: #FFB3DA    /* Subtle highlights and backgrounds */

/* Semantic Colors */
--color-success: #00FF41       /* Terminal green for success states */
--color-warning: #FFFF00       /* High-contrast yellow for warnings */
--color-error: #FF0040         /* Bright red for errors */
--color-info: #00FFFF          /* Cyan for informational elements */
```

### Typography System
```css
/* Primary Font Stack - Monospace Terminal Aesthetic */
--font-primary: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 
                'Roboto Mono', 'Consolas', 'Courier New', monospace;

/* Font Sizes (rem scale) */
--text-xs: 0.75rem    /* 12px - Metadata, timestamps */
--text-sm: 0.875rem   /* 14px - Secondary text */
--text-base: 1rem     /* 16px - Body text */
--text-lg: 1.125rem   /* 18px - Subheadings */
--text-xl: 1.25rem    /* 20px - Headings */
--text-2xl: 1.5rem    /* 24px - Large headings */
--text-3xl: 2rem      /* 32px - Display text */

/* Font Weights */
--font-normal: 400
--font-medium: 500
--font-bold: 700
```

### Layout & Spacing
- **Bento Grid System**: Modular, grid-based layouts inspired by Japanese bento box organization
- **Thin Borders**: 1px solid borders in `--color-medium-grey` for subtle separation
- **Minimal Bezels**: 2-4px border radius maximum; prefer sharp corners
- **Consistent Spacing**: 8px base unit system (8, 16, 24, 32, 48, 64px)
- **Dense Information Layout**: Compact vertical spacing with clear visual hierarchy

### Component Aesthetic
- **Buttons**: Sharp rectangular buttons with thin borders, monospace labels
- **Input Fields**: Terminal-style inputs with thin borders and monospace text
- **Cards**: Minimal border containers with subtle shadows (2px max)
- **Modals**: Full-screen overlays with stark contrast and minimal decoration
- **Navigation**: Tab-like interfaces with clear state indicators

### Responsive Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px   /* Small devices */
--breakpoint-md: 768px   /* Medium devices */
--breakpoint-lg: 1024px  /* Large devices */
--breakpoint-xl: 1280px  /* Extra large devices */
```

### Animation & Interactions
- **Micro-animations**: Subtle 150-250ms transitions for state changes
- **Hover States**: Immediate color/border changes without morphing
- **Focus States**: High-contrast outline indicators for accessibility
- **Loading States**: Terminal-style progress indicators and spinners

### Y2K Cyber Influences
- **Chunky Interface Elements**: Bold, blocky UI components
- **High Contrast**: Strong black/white contrast with bright accent pops
- **Technical Typography**: Monospace fonts throughout for code/data aesthetic
- **Grid-based Layouts**: Rigid, systematic organization of interface elements
- **Digital Artifacts**: Subtle scan lines or digital texture overlays (optional)

### Brutalist Design Elements
- **Raw Functionality**: UI elements that clearly communicate their purpose
- **Unrefined Edges**: Sharp corners and angular shapes over soft curves
- **High Contrast Hierarchy**: Bold visual weight differences between elements
- **Minimal Ornamentation**: Focus on structure and function over decoration
- **Industrial Color Palette**: Concrete greys with strategic color accents

### Implementation Guidelines
- **CSS Custom Properties**: Use design tokens for consistent theming
- **Component Variants**: Each component should have light/dark mode variants
- **Accessibility**: Maintain WCAG 2.1 AA contrast ratios despite bold aesthetic
- **Performance**: Optimize for fast rendering with minimal CSS complexity

---

## User Experience Flow

### 1. Authentication Flow
1. User visits app
2. Presented with login options (email/password or GitHub)
3. Successful authentication redirects to project dashboard

### 2. Project Management Flow
1. Dashboard displays all projects (starred first, then by last_modified)
2. User can create new project via inline creation
3. User clicks project to enter workspace
4. Within workspace, user can edit project details or navigate back

### 3. Note Management Flow
1. In project workspace, left pane shows current note editor
2. Carousel dots at bottom allow switching between notes
3. User can create new note via + button (appears instantly with blank content)
4. Notes auto-save as user types
5. Drag-and-drop or context menu allows moving notes to other projects

### 4. Link Management Flow
1. In project workspace, right pane shows grid of link previews
2. User can add new link via + button (appears instantly for editing)
3. Link previews generate automatically from URL metadata
4. Single-click opens link, checkbox selection allows batch opening
5. Drag-and-drop or context menu allows moving links to other projects

### 5. Search Flow
1. Global search from dashboard searches all content
2. In-project search filters current project content
3. Search results highlight matches and allow direct navigation

---

## Success Metrics

### Performance Targets
- **Page Load Time**: < 2 seconds initial load
- **Navigation Speed**: < 200ms between views
- **Search Response**: < 500ms for search results
- **Auto-save Delay**: < 1 second after user stops typing

### User Experience Goals
- **Intuitive Navigation**: Users can accomplish core tasks without documentation
- **Responsive Feedback**: All actions provide immediate visual feedback
- **Cross-Device Consistency**: Seamless experience between desktop and mobile
- **Data Reliability**: Zero data loss with proper encryption and backup

---

## Development Phases

### Phase 1: Core Functionality (MVP)
- Basic authentication (email/password)
- Project CRUD operations
- Note CRUD with basic text editing
- Link CRUD with URL storage
- Simple search functionality
- Desktop-responsive dual-pane layout

### Phase 2: Enhanced Experience
- GitHub OAuth integration
- Rich link previews with metadata parsing
- Advanced search with filters
- Mobile-optimized layouts
- Drag-and-drop functionality
- Note encryption implementation

### Phase 3: Advanced Features
- Real-time collaboration capabilities
- Advanced text editing features
- Link preview caching service
- Performance optimizations
- Native app builds (Capacitor/Tauri)

---

## Risk Assessment & Mitigation

### Technical Risks
- **Encryption Complexity**: Client-side encryption may impact performance
  - *Mitigation*: Implement efficient encryption libraries and lazy loading
- **Link Preview Parsing**: External service dependency for rich previews
  - *Mitigation*: Implement graceful fallbacks and caching strategies

### User Experience Risks  
- **Mobile Layout Constraints**: Single-pane mobile experience may feel limiting
  - *Mitigation*: Optimize quick switching and implement intuitive navigation
- **Search Performance**: Large datasets may impact search speed
  - *Mitigation*: Implement proper indexing and progressive search loading

### Business Risks
- **Supabase Dependency**: Heavy reliance on third-party service
  - *Mitigation*: Design with potential migration paths and data export capabilities