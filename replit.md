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
- Express.js with TypeScript
- ESM module system
- Custom middleware for request logging and JSON parsing

**API Design:**
- RESTful endpoints under `/api` prefix
- Routes:
  - `GET /api/clients` - Fetch all clients
  - `GET /api/clients/:id` - Fetch single client
  - `GET /api/clients/search/:query` - Search clients
  - `POST /api/clients` - Create client
  - `PUT /api/clients/:id` - Update client
  - `DELETE /api/clients/:id` - Delete client
  - `GET /api/statistics` - Dashboard statistics

**Data Validation:**
- Zod schemas for runtime type validation
- Shared schema definitions between client and server
- Client schema enforces required fields and email validation
- Service type enum: `inwi | orange | maroc-telecom | water | gas | electricity`

**Development Features:**
- Vite middleware integration for HMR
- Request/response logging with duration tracking
- Error handling with appropriate HTTP status codes

### Data Storage

**Database:**
- Firebase Firestore (NoSQL cloud database)
- Firebase Admin SDK for server-side operations
- Real-time updates and offline support
- Serverless and globally distributed

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
- Repository pattern via FirebaseStorage class
- Search functionality filters in-memory (Firestore limitation)
- Searches across name, phone, and code values
- Statistics aggregation using Firestore queries

**Deployment Strategy:**
- Configured for Vercel serverless deployment
- Firebase credentials via environment variable
- Schema defined in `shared/schema.ts` for type sharing

### External Dependencies

**Core Libraries:**
- **@tanstack/react-query** - Server state management and caching
- **firebase-admin** - Firebase Admin SDK for Firestore operations
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
- Designed for Vercel serverless hosting
- Firebase Firestore for database
- Environment variable `FIREBASE_SERVICE_ACCOUNT` required
- No authentication system (disabled for flexible deployment)