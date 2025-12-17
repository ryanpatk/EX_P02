# Keyboard Selection Feature Documentation

## Overview

The keyboard selection feature enables users to select multiple link cards within the selected project(s) view using keyboard commands. This provides a fast, efficient way to bulk-select and operate on multiple links without using a mouse.

## Product Requirements

### Core Functionality

1. **Multi-Select Capability**: Users can select multiple link cards simultaneously within the selected project(s) view.

2. **Selection States**: The feature distinguishes between two visual states:
   - **Cursor State**: A neutral selection border (cursor) that indicates the current position
   - **Selected State**: A prominent border with brand orange color and red-orange overlay indicating selected cards

3. **Persistent Selection**: Selected cards remain highlighted even after releasing the CMD key, allowing users to build up a selection over time.

### Keyboard Controls

#### CMD Key (Mac) / CTRL Key (Windows)

- **Press CMD**: Reveals the neutral selection border (cursor) on link cards
- **Release CMD**: Hides the neutral selection border, but selected cards remain highlighted
- **Visual Indicator**: A "⌘ CMD" badge appears in the AppHeader when CMD is held down

#### Cursor Navigation (while CMD is held)

- **Arrow Up**: Move cursor up by one row (based on current column count)
- **Arrow Down**: Move cursor down by one row (based on current column count)
- **Arrow Left**: Move cursor to the previous link card
- **Arrow Right**: Move cursor to the next link card

#### Selection Actions

- **CMD + SHIFT**: Toggle selection of the link card currently under the cursor
- **CMD + SHIFT + Arrow Keys**: Select the target link card along the path of movement (only the target item, not the entire range)
- **ESC**: Deselect all currently selected cards (works even without CMD held)
- **CMD + ENTER**: Open all selected links in new tabs

#### Cursor Position Persistence

- When CMD is released, the current cursor position is saved
- When CMD is pressed again, the cursor returns to the last position it was on
- The cursor position resets to null when:
  - A project is deselected
  - A new project is selected

### Visual Design Requirements

1. **Selected State**:
   - Prominent border using primary brand orange color (`var(--color-orange)`)
   - Red-orange overlay (`rgba(255, 59, 60, 0.15)`) over the entire card
   - Border and overlay must not adjust the scale or layout of the selected cards

2. **Cursor State**:
   - Dashed grey border (`#999999`) indicating the neutral selection position
   - Border must not adjust the scale or layout of the card

3. **Default State**:
   - Standard border (`border-medium-grey`) on all link cards
   - Hover states remain independent of selection states

### Auto-Scrolling

- When the link card selection cursor moves to a link that is partially offscreen (due to scroll position), the grid automatically scrolls to bring the entire link card into view
- Works for both upward and downward navigation
- Uses smooth scrolling behavior

## Current Implementation

### State Management (Zustand Store)

The selection state is managed globally using Zustand with persistence:

**State Variables**:
- `selectedLinkIds: string[]` - Array of IDs for selected link cards
- `selectionCursorIndex: number | null` - Current cursor position index (null when CMD not held)
- `isCommandHeld: boolean` - Whether CMD/CTRL key is currently held down
- `lastCursorIndex: number | null` - Last cursor position before CMD was released

**Actions**:
- `setSelectedLinkIds(ids: string[])` - Set the selected link IDs
- `toggleLinkSelection(linkId: string)` - Toggle selection of a specific link
- `clearSelectedLinks()` - Clear all selections
- `setSelectionCursorIndex(index: number | null)` - Set the cursor position
- `setIsCommandHeld(held: boolean)` - Update CMD key state
- `setLastCursorIndex(index: number | null)` - Save last cursor position

**Persistence**:
- All selection state variables are persisted to localStorage via Zustand's persist middleware
- State persists across browser refreshes

### Component Architecture

#### DashboardPage.tsx

**Responsibilities**:
- Centralized keyboard event handling for all selection functionality
- Manages cursor navigation logic (arrow key movement)
- Handles selection toggling and range selection
- Coordinates with LinksGrid for auto-scrolling
- Displays visual CMD indicator in AppHeader

**Key Logic**:
- Detects CMD/CTRL key press/release (platform-aware: Mac uses metaKey, Windows uses ctrlKey)
- Calculates cursor movement based on current column count (responsive grid)
- Handles ESC key to clear selections (works globally, not just with CMD)
- Opens selected links in new tabs with CMD+ENTER
- Resets cursor position when projects change

**Column Calculation**:
- Mobile (< 640px): 2 columns
- Tablet (640px - 1024px): 3 columns
- Desktop (> 1024px): 4 columns

#### LinksGrid.tsx

**Responsibilities**:
- Receives `selectedLinkIds` and `cursorIndex` props
- Passes `isSelected` and `isCursor` props to individual LinkCard components
- Exposes `scrollToIndex` method via `forwardRef` and `useImperativeHandle`
- Auto-scrolls when cursor moves to offscreen items

**Auto-Scroll Implementation**:
- Uses TanStack Virtual's `scrollToIndex` method
- Triggers on cursor index changes for vertical movement (up/down)
- Uses `requestAnimationFrame` for smooth scrolling
- Aligns cursor card to center of viewport

#### LinkCard.tsx

**Responsibilities**:
- Receives `isSelected` and `isCursor` props
- Applies visual styling based on selection state
- Uses absolutely positioned overlays to avoid layout shifts

**Visual Implementation**:
- **Selected State**:
  - Absolutely positioned border overlay with orange color
  - Absolutely positioned red-orange background overlay
  - Both overlays use `z-index` to appear above card content
- **Cursor State**:
  - Absolutely positioned dashed grey border overlay
- **Default Border**: Standard border class applied to main card div

**Important**: Uses absolutely positioned overlays instead of modifying the card's border directly to prevent layout shifts and work correctly with `overflow-hidden` on the card container.

#### AppHeader.tsx

**Responsibilities**:
- Displays visual "⌘ CMD" indicator when `isCommandHeld` is true
- Provides user feedback about keyboard selection mode

### Keyboard Event Handling

**Event Listeners**:
- Global `keydown` and `keyup` listeners attached to `window`
- Cleaned up on component unmount

**Input Field Handling**:
- Keyboard events are ignored when user is typing in INPUT, TEXTAREA, or contentEditable elements
- Exception: CMD+ENTER works in input fields to open selected links

**Platform Detection**:
- Detects Mac vs Windows/Linux to use correct modifier key (metaKey vs ctrlKey)

**Key Combinations**:
1. **CMD Press**:
   - Sets `isCommandHeld` to true
   - Restores cursor to `lastCursorIndex` or sets to 0 if no previous position

2. **CMD Release**:
   - Saves current `selectionCursorIndex` to `lastCursorIndex`
   - Sets `isCommandHeld` to false
   - Sets `selectionCursorIndex` to null (hides cursor)

3. **Arrow Keys (with CMD)**:
   - Calculates new index based on current position and column count
   - Updates `selectionCursorIndex`
   - Triggers auto-scroll via LinksGrid ref
   - If SHIFT is also held, adds target item to selection

4. **CMD + SHIFT**:
   - Toggles selection of link at current cursor position
   - Works independently of arrow key navigation

5. **ESC**:
   - Clears all selections
   - Works globally (doesn't require CMD)

6. **CMD + ENTER**:
   - Opens all selected links in new tabs
   - Works in input fields as well

### Visual States Summary

| State | Visual Indicator | Implementation |
|-------|-----------------|----------------|
| Default | Standard grey border | `border border-medium-grey` class |
| Hover | Background color change | Existing hover logic (independent) |
| Cursor | Dashed grey border overlay | Absolutely positioned div with `border: 2px dashed #999999` |
| Selected | Orange border + red-orange overlay | Two absolutely positioned overlays: border (`2px solid var(--color-orange)`) and background (`rgba(255, 59, 60, 0.15)`) |
| Selected + Cursor | Both indicators visible | Cursor overlay has higher z-index (z-30) than selected overlay (z-20) |

### Technical Notes

1. **Layout Preservation**: All selection indicators use absolutely positioned overlays to ensure they don't affect card dimensions or layout.

2. **Z-Index Layering**:
   - Selected overlay: `z-20`
   - Cursor overlay: `z-30`
   - Card content: default stacking context

3. **Performance**:
   - Uses TanStack Virtual for efficient rendering of large link grids
   - Selection state updates are optimized through Zustand's selector pattern
   - Auto-scrolling uses `requestAnimationFrame` for smooth performance

4. **Accessibility**:
   - Keyboard navigation is fully functional
   - Visual indicators provide clear feedback
   - Works with screen readers (selection state could be enhanced with ARIA attributes in future)

5. **Edge Cases Handled**:
   - Cursor position bounds checking (prevents negative indices or indices beyond array length)
   - Empty link lists (no cursor shown)
   - Project changes (cursor resets)
   - Input field focus (keyboard events ignored except CMD+ENTER)

## Future Enhancements (Potential)

- Add ARIA attributes for better screen reader support
- Support for range selection (e.g., CMD+SHIFT+Click to select range)
- Bulk operations on selected links (delete, move to project, etc.)
- Visual count indicator showing number of selected links
- Keyboard shortcuts for other bulk operations

