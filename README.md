# Support Ticketing Platform

A full-stack support ticketing platform built with TypeScript, Node.js/Express backend, and React + Tailwind CSS frontend.

## Project Structure

```text
support-ticketing/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── jobs/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

1. Install root & service dependencies:
   ```bash
   npm run install:all
   ```

2. Run backend:
   ```bash
   npm run dev:backend
   ```

3. Run frontend:
   ```bash
   npm run dev:frontend
   ```
