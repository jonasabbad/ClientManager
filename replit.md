# Customer Management System

## Overview

A modern web application for managing clients and their payment/service codes for Moroccan utility providers (Inwi, Orange, Maroc Telecom, Water, Gas, Electricity). The system provides efficient client management, smart search capabilities, and printing functionality for receipts and client cards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state management
- **UI Framework:** shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design system
- **Forms:** React Hook Form with Zod validation

**Design Philosophy:**
- Inspired by Linear, Notion, and Stripe Dashboard aesthetics
- Information clarity over decoration
- Consistent interaction patterns
- Efficient screen real estate usage
- Typography: Inter font family with JetBrains Mono for code
- Responsive grid layouts with mobile-first approach
- Dark/light theme support with ThemeProvider

**Key UI Components:**
- Client cards with service badges and code displays
- Dashboard with statistics and activity feed
- Dialog-based forms for adding/editing clients
- Print functionality for thermal (80mm) and A4 formats using jsPDF

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript (minimal backend for static file serving)
- ESM module system
- Vite middleware integration for development

**Data Operations:**
- **All data operations now handled client-side using Firebase Web SDK**
- No backend API routes for data operations
- Direct Firestore access from browser using Firebase Web SDK
- TanStack React Query for client-side state management and caching

**Data Validation:**
- Zod schemas for runtime type validation
- Shared schema definitions in `shared/schema.ts`
- Client schema enforces required fields and validation
- Service type enum: `inwi | orange | maroc-telecom | water | gas | electricity`

**Development Features:**
- Vite middleware integration for HMR
- Firebase Web SDK initialization in `client/src/lib/firebase.ts`
- Firestore service layer in `client/src/lib/firestoreService.ts`

### Data Storage

**Database:**
- Firebase Firestore (NoSQL cloud database)
- Firebase Web SDK (client-side) for browser operations
- Real-time updates and offline support
- Serverless and globally distributed

**Firebase Configuration:**
- API Key: AIzaSyBiuVZzpqPMP-Q_76aGifJHKWknEU4Jr9o
- Project ID: customer-management-34f78
- App ID: 1:207346074611:web:1e860799194881ee594886
- **NOTE:** Firestore security rules must be configured in Firebase Console

**Collections:**
- **Clients Collection:**
  - `id` (string, document ID)
  - `name` (string, required)
  - `phone` (string, required)
  - `codes` (array of service/code objects)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

- **Activities Collection:**
  - `id` (string, document ID)
  - `type` (string: created, updated, deleted)
  - `clientId` (number)
  - `clientName` (string)
  - `description` (string)
  - `createdAt` (timestamp)

- **Service Codes Collection:**
  - `id` (string, document ID)
  - `serviceType` (string)
  - `displayName` (string)
  - `isActive` (number: 0 or 1)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

**Data Access Pattern:**
- Service layer pattern via firestoreService
- All CRUD operations in `client/src/lib/firestoreService.ts`:
  - `getAllClients()` - Fetch all clients
  - `getClientById(id)` - Fetch single client  
  - `createClient(data)` - Create new client
  - `updateClient(id, data)` - Update existing client
  - `deleteClient(id)` - Delete client
  - `getStatistics()` - Calculate dashboard statistics
- Search functionality implemented client-side
- Searches across name, phone, and code values
- Statistics aggregation using Firestore queries

**Type System:**
- `FirestoreClient` type with `createdAt: string` and `updatedAt?: string`
- All components migrated to use FirestoreClient instead of Client
- Query keys use direct service names ("clients", "statistics") instead of API paths

**Deployment Strategy:**
- Static site deployment to Vercel or any hosting platform
- Frontend: Static HTML/JS/CSS files
- No backend API required - direct Firebase connection from browser
- Database: Firebase Firestore (cloud NoSQL)
- Firebase credentials embedded in frontend config (public API key)
- **Security handled via Firestore security rules in Firebase Console**
- Schema defined in `shared/schema.ts` for type sharing

### External Dependencies

**Core Libraries:**
- **@tanstack/react-query** - Client state management and caching
- **firebase** - Firebase Web SDK for client-side Firestore operations
- **drizzle-zod** - Schema validation (retained for Zod schemas)
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **jspdf** & **jspdf-autotable** - PDF generation for printing
- **date-fns** - Date manipulation and formatting

**UI Component Libraries:**
- **@radix-ui/** packages - Accessible unstyled UI primitives
- **class-variance-authority** - Component variant management
- **tailwindcss** - Utility-first CSS framework
- **lucide-react** - Icon library
- **recharts** - Data visualization for dashboard charts

**Development Tools:**
- **vite** - Build tool and dev server
- **tsx** - TypeScript execution for development
- **esbuild** - Production bundling
- **@replit/** plugins - Replit-specific development enhancements

**Font Delivery:**
- Google Fonts CDN for Inter and JetBrains Mono fonts

**Deployment:**
- Static site deployment (Vercel, Netlify, or any static hosting)
- Firebase Firestore for database
- Firebase config embedded in frontend code (public API key)
- **Important:** Configure Firestore security rules in Firebase Console
- No authentication system (open access - secure via Firestore rules)

## Recent Changes (October 27, 2025)

**Complete Migration to Firebase Web SDK:**
- Migrated from Firebase Admin SDK (server-side) to Firebase Web SDK (client-side)
- Eliminated all backend API routes for data operations
- All database operations now handled directly in browser via firestoreService
- Updated all pages and components to use FirestoreClient type
- Changed query keys from API paths to service names
- Tested end-to-end: Settings, Dashboard, Clients, Add/Edit functionality all working
- Application now deployable as static site without backend complexity

**Settings Persistence:**
- Added full settings management with Firebase Firestore persistence
- Settings stored in `settings/app-settings` document
- "Save All Settings" button now actually saves all settings to database
- Settings persist across page reloads and sessions
- Firebase connection test results auto-save and persist
- Settings include: Company Name, Default Country Code, Records Per Page
- All settings load automatically on page mount
- Tested: Settings save, load, and persist correctly

**Recent Activity Tracking:**
- Implemented full activity tracking in Firestore `activities` collection
- Automatic activity logging for all create/update/delete operations
- Dashboard card displays recent 5 activities with real data
- Recent Activity page shows complete activity history
- Activity types: created, updated, deleted
- Each activity includes: clientId, clientName, description, timestamp
- All CRUD operations invalidate both 'clients' and 'activities' caches

**Export/Import Functionality (Latest):**
- **Database Backup**: JSON export of all clients with version info
- **CSV Export**: Pipe-delimited format with one row per service code
  - Format: SERVICE|CODE|DETAILS|Address
  - Each service code gets its own row in the export
  - Example: INWI|700669885|mobile facture|youness
- **CSV Import**: Pipe-delimited CSV import
  - Groups rows by client name/address automatically
  - Creates one client per unique address with multiple service codes
  - Simple format without comma escaping complexity
- **Download Example**: Sample CSV file download with correct format
- All export/import features accessible from Settings page
- Round-trip export→import preserves data integrity

**UI Updates (Latest):**
- Removed Phone column from Service Codes table on Client Detail page
- Service Codes table now shows: Code, Type, Address, Full Name, Actions
- Cleaner, more focused display of service code information

**Service Code Management (Latest):**
- All service type codes now managed centrally in Settings page
- Add/Edit/Delete service types from Settings instead of hardcoded values
- Service dropdowns in Add/Edit Client dialogs pull from Settings database
- Auto-seeds default service codes (Inwi, Orange, Maroc Telecom, Water, Gas, Electricity) on first load
- Service codes have: Service ID, Name, Category (telecom/utility), and Active status
- Only active service codes appear in dropdown menus