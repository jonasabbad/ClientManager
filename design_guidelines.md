# Customer Management App - Design Guidelines

## Design Approach

**Selected Approach:** Design System with Modern SaaS Influences

Drawing inspiration from Linear's clarity, Notion's data organization, and Stripe Dashboard's professional aesthetics. This utility-focused application prioritizes efficient workflows, data visibility, and rapid task completion while maintaining a polished, contemporary appearance.

**Core Principles:**
- Information clarity over decoration
- Consistent interaction patterns across all views
- Efficient use of screen real estate
- Fast visual scanning and task completion

---

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for code display)

**Hierarchy:**
- Page Titles: text-3xl, font-semibold
- Section Headers: text-xl, font-semibold
- Card Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Labels/Metadata: text-sm, font-medium
- Code Values: text-sm, font-mono, tracking-wide
- Captions: text-xs, font-normal

---

## Layout System

**Spacing Primitives:**
Primary units: 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (within components): p-2, gap-2, space-y-2
- Standard spacing (between elements): p-4, gap-4, mb-6
- Section spacing: p-8, py-12, gap-8
- Page margins: px-4 md:px-6 lg:px-8

**Container Strategy:**
- Dashboard shell: Full viewport with fixed sidebar
- Content area: max-w-7xl mx-auto px-4
- Cards/Modals: max-w-2xl for forms, max-w-4xl for data tables
- Mobile: Full-width with px-4 padding

**Grid Patterns:**
- Client cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Service badges: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3
- Dashboard stats: grid-cols-2 lg:grid-cols-4 gap-4

---

## Component Library

### Navigation Architecture

**Sidebar Navigation (Desktop):**
- Fixed left sidebar, w-64, full viewport height
- Logo/brand at top (h-16)
- Navigation items with icons (Heroicons) + labels
- Active state: subtle background, border-l-4 accent
- Spacing: py-2 px-4 per item, gap-1 between items
- Bottom section: user profile, settings, theme toggle

**Mobile Navigation:**
- Top bar with hamburger menu
- Slide-out drawer overlay
- Same navigation structure as desktop

**Search Bar (Global):**
- Prominent placement in top bar or sidebar top
- Large input field: h-12, rounded-lg
- Heroicons search icon prefix
- Clear button suffix when active
- Live results dropdown: absolute positioning, max-h-96, overflow-y-auto

### Dashboard Components

**Stats Cards:**
- Grid layout (2x2 on mobile, 1x4 on desktop)
- Card structure: p-6, rounded-xl, border
- Icon top-left (h-10 w-10 rounded-lg)
- Large number: text-3xl font-bold
- Label below: text-sm
- Trend indicator optional: text-xs with arrow icon

**Activity Feed:**
- List with timeline connector
- Each item: py-4, border-b
- Icon + timestamp + description layout
- Avatar for user actions (h-8 w-8 rounded-full)

**Charts Section:**
- Full-width card container
- Heading + filter controls in flex justify-between
- Chart area: h-80 to h-96
- Use Chart.js or Recharts library
- Responsive: stack controls on mobile

### Client Management

**Client Cards:**
- Card: p-6, rounded-xl, border, hover:shadow-lg transition
- Header: flex justify-between items-start
- Client name: text-lg font-semibold, mb-1
- Contact info: text-sm with phone/email icons, gap-3
- Service badges section: mt-4, flex flex-wrap gap-2
- Action buttons footer: mt-6, flex gap-2 justify-end

**Service Badges:**
- Pill shape: px-3 py-1.5 rounded-full
- Icon + text layout (gap-1.5)
- Text: text-xs font-medium
- Note: Service-specific colors applied later (Inwi, Orange, etc.)

**Code Display Cells:**
- Monospace font, text-sm
- Background: subtle fill, px-3 py-2 rounded-md
- Copy button inline: icon-only, h-6 w-6, hover opacity
- Toast notification on copy: bottom-right, slide-up animation

### Forms & Modals

**Modal Structure:**
- Overlay: fixed inset-0, backdrop blur
- Container: max-w-2xl, mx-auto, mt-20
- Content card: p-6, rounded-xl
- Header: text-xl font-semibold, mb-6
- Form spacing: space-y-6
- Footer: flex gap-3 justify-end, mt-8

**Input Fields:**
- Label: text-sm font-medium, mb-2, block
- Input: h-12, px-4, rounded-lg, border, w-full
- Focus state: ring-2 offset-2
- Error state: border-red with text-sm error message below
- Icon prefix where appropriate (phone icon for phone input)

**Buttons:**
- Primary: h-12, px-6, rounded-lg, font-medium
- Secondary: h-12, px-6, rounded-lg, border, font-medium  
- Icon-only: h-10 w-10, rounded-lg
- Loading state: spinner icon, disabled cursor

**Multi-Code Manager:**
- Each service row: flex items-center gap-4, py-3, border-b
- Service icon + name: flex-shrink-0, w-32
- Code input: flex-1, h-10
- Actions: flex gap-2 (edit, delete, copy icons)
- Add new button: mt-4, full-width, dashed border

### Data Tables (Alternative View)

**Table Structure:**
- Container: overflow-x-auto, rounded-xl, border
- Table: w-full, text-sm
- Header: font-medium, text-left, px-6 py-4, border-b
- Rows: px-6 py-4, border-b, hover background
- Actions column: text-right, icon buttons gap-2

### Print Layouts

**Print Stylesheet Specs:**
- 80mm thermal: max-width: 302px, padding minimal
- A4: max-width: 794px, standard margins
- Header: Logo centered (h-16), mb-6
- Client name: text-center, text-2xl, font-bold, mb-2
- Phone: text-center, text-lg, mb-8
- Service codes: 2-column grid for 80mm, 3-column for A4
- Each code: border, p-4, rounded, mb-3
- QR code footer: centered, mt-8, size 128px

---

## Icons & Assets

**Icon Library:** Heroicons (CDN link)
- Navigation: outline style, h-5 w-5
- Cards/buttons: solid or outline, h-4 w-4 to h-6 w-6
- Services: Service icons from Heroicons or custom SVG placeholders

**Images:**
No hero images required. This is a utility dashboard application. Any images should be:
- Client avatars: generated initials or placeholder icons
- Empty states: Simple illustrations (undraw.co style)
- Logo: Company branding in header

---

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px - Single column, stacked navigation, full-width cards
- Tablet: 768px-1024px - 2-column grids, sidebar collapses to icons only
- Desktop: > 1024px - Full sidebar, 3-4 column grids, optimal spacing

**Mobile Optimizations:**
- Bottom sheet for add/edit forms (full-screen modal)
- Swipe actions for quick delete/edit on cards
- Collapsible service code sections
- Sticky search bar at top
- FAB (Floating Action Button) for primary actions: fixed bottom-right, h-14 w-14, rounded-full

---

## Animations (Minimal)

**Approved Animations:**
- Toast notifications: slide-up + fade (200ms)
- Modal open/close: fade + scale (150ms)
- Dropdown menus: fade + translateY (100ms)
- Button interactions: scale on tap (100ms)
- Theme toggle: 200ms transition on background/text colors

**Prohibited:**
- Page transitions
- Card hover lifts (except subtle shadow)
- Scroll-triggered animations
- Loading skeleton shimmer (use static skeleton)

---

## Dark/Light Mode Implementation

Apply theme toggle with system preference detection. Maintain identical spacing, sizing, and layout between modes. Ensure code displays, service badges, and dashboard charts remain legible in both themes.