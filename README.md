# NEXT TAX

Bangladesh-focused **Tax + Trade (Import/Export) Calculator** web application with a bilingual (English/Bangla) interface.

---

## Overview

NEXT TAX is a web-based calculation platform designed for Bangladesh that provides:

- Personal income tax calculation based on progressive slabs
- Import/Export (trade) calculation using country- and category-based rules
- Secure login system with user dashboards
- Persistent calculation history for logged-in users

The application is built with a focus on clarity, maintainability, and real-world usability.

---

## Important Design Decision

### Centralized Database-Driven Tax & Trade Rules

All **tax rates, trade rules, product categories, country data, and conversion rates** are stored in the **database**, not hardcoded in the frontend.

This means:

- ✅ The app works immediately after deployment
- ✅ Tax or trade rate updates **do not require code changes**
- ✅ No redeploy is needed when rates are updated
- ✅ Admins can update rates directly from the database
- ✅ Rules can be changed dynamically based on fiscal year or policy updates

This approach makes the system scalable, maintainable, and suitable for long-term real-world use.

---

## Technology Stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn-ui
- React Router
- TanStack React Query
- Supabase (Authentication + Database)
- PostgreSQL (Managed)

---

## Application Features

- Bilingual UI (English & Bangla)
- Personal income tax calculator (Bangladesh rules)
- Import/Export duty & tax calculator
- Login / Signup / Password reset
- User dashboard
- Calculation history (tax & trade)
- Secure backend-powered data storage

---

## App Routes

### Public Routes
- `/` – Home
- `/auth` – Login / Signup
- `/auth/reset` – Password reset
- `/guide` – User guide
- `/team` – Team information

### Protected Routes (Login Required)
- `/dashboard` – User dashboard
- `/tax` – Tax calculator
- `/trade` – Trade calculator
- `/trade/history` – Trade calculation history

---

## Getting Started (Local Development)

### Requirements
- Node.js 18+
- npm

### Installation
```bash
npm install
npm run dev
npm run test

### Environment Variables
This project requires backend environment variables for authentication and database access.
Create a .env file in the project root and add:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

### Deployment Notes (SPA Routing)
This is a Single Page Application (SPA).
Directly refreshing or opening nested routes (e.g. /auth, /tax) requires a rewrite to index.html.
✅ A vercel.json file is included for proper SPA routing on Vercel.
If deploying on another platform, ensure all non-static routes are redirected to index.html.

### Project Structure
src/pages/ – Application pages (routes)
src/components/ – Reusable UI components
src/lib/tax/ – Tax calculation logic
src/lib/trade/ – Trade calculation logic
src/integrations/ – Backend & database integration



