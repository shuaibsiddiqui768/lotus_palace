---
description: Repository Information Overview
alwaysApply: true
---

# Food Menu Application Information

## Summary

A Next.js-based food menu application with admin panel for restaurant management. Features include food item management, ordering system, and cart functionality. The application uses MongoDB for data storage and is built with TypeScript and React.

## Structure

- **app/**: Next.js application routes and pages
  - **admin/**: Admin panel components and pages
  - **api/**: API routes for food items and orders
  - **cart/**: Shopping cart functionality
  - **menu/**: Food menu display
  - **orders/**: Order management
- **components/**: Reusable UI components
  - **ui/**: Shadcn UI component library
- **contexts/**: React context providers (Cart, Orders)
- **hooks/**: Custom React hooks
- **lib/**: Utility functions and database connection
- **models/**: MongoDB schema definitions
- **public/**: Static assets

## Language & Runtime

**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.2.2
**Framework**: Next.js 13.5.1
**Runtime**: Node.js
**Build System**: Next.js build system
**Package Manager**: npm

## Dependencies

**Main Dependencies**:

- React 18.2.0
- Next.js 13.5.1
- Mongoose 7.5.0
- Tailwind CSS 3.3.3
- Radix UI components
- React Hook Form 7.53.0
- Zod 3.23.8
- Lucide React 0.446.0
- Framer Motion 12.23.24

**Development Dependencies**:

- ESLint 8.49.0
- TypeScript 5.2.2
- Autoprefixer 10.4.15
- PostCSS 8.4.30

## Build & Installation

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Database

**Database**: MongoDB
**Connection**: Mongoose ORM
**Models**:

- Food: Manages food items with categories, pricing, and availability
  **Configuration**: Environment variables for MongoDB URI

## API Routes

- **/api/food**: CRUD operations for food items
- **/api/food/[id]**: Operations on specific food items
- **/api/food/category/[category]**: Filter food by category

## Main Files

**Entry Point**: app/page.tsx
**Layout**: app/layout.tsx
**Configuration**:

- next.config.js: Next.js configuration
- tsconfig.json: TypeScript configuration
- tailwind.config.ts: Tailwind CSS configuration

## Testing

No specific testing framework identified in the project.

## Deployment

The application is configured for static export with `output: 'export'` in next.config.js, making it deployable to static hosting services.
