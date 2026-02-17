# Finance Tracker API - OpenAPI Documentation

## Overview

This API now includes comprehensive OpenAPI 3.0/3.1 documentation with **Scalar API Reference** UI for interactive testing and exploration.

## 🚀 Quick Start

### Starting the Development Server

```bash
cd apps/api
pnpm dev
```

The server will start on `http://localhost:8787`

## 📚 Accessing the API Documentation

### Scalar API Reference UI (Recommended)
Interactive, beautiful API documentation with built-in request testing:

```
http://localhost:8787/reference
```

### OpenAPI Specification (JSON)
Raw OpenAPI 3.0 specification:

```
http://localhost:8787/api/doc
```

OpenAPI 3.1 specification (with security schemes):

```
http://localhost:8787/api/doc31
```

## 🔐 Authentication

All documented endpoints require Bearer token authentication:

1. **Get a JWT token** from the `/api/auth/login` endpoint
2. **In Scalar UI**: Click the "Authenticate" button and enter: `Bearer YOUR_TOKEN_HERE`
3. **In API requests**: Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

## 📖 Documented Endpoints

### Analytics Endpoints (Fully Documented)

#### 1. **GET /api/analytics/summary**
Get comprehensive financial summary including:
- Total income and expenses
- Available balance
- Savings rate and expense ratio
- Percentage changes vs previous period
- Transaction count

**Query Parameters:**
- `preset` (optional): Date range preset (`30days`, `lastMonth`, `last3Months`, `lastYear`, `thisMonth`, `thisYear`, `allTime`, `custom`)
- `from` (optional): Custom start date (ISO format: `2026-01-01`)
- `to` (optional): Custom end date (ISO format: `2026-01-31`)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/summary?preset=30days"
```

#### 2. **GET /api/analytics/chart**
Get daily transaction data for charting:
- Daily income and expenses aggregated by date
- Total income and expense transaction counts
- Date range information

**Query Parameters:** (Same as summary)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/chart?preset=thisMonth"
```

#### 3. **GET /api/analytics/expense-breakdown**
Get expense breakdown by category:
- Top 3 spending categories
- Remaining categories grouped as "others"
- Percentage breakdown
- Total spent amount

**Query Parameters:** (Same as summary)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/expense-breakdown?preset=lastMonth"
```

## 🎨 Scalar UI Features

The Scalar API Reference provides:

- **Interactive Testing**: Test endpoints directly from the browser
- **Request/Response Examples**: See sample requests and responses
- **Schema Validation**: View detailed request/response schemas
- **Authentication Support**: Built-in authentication configuration
- **Beautiful UI**: Modern, purple-themed interface
- **Search**: Quick search across all endpoints
- **Code Examples**: Generate code snippets in multiple languages

## 📁 Project Structure

```
apps/api/src/
├── index.ts                           # Main app with OpenAPI & Scalar setup
├── routes/
│   ├── analytics.route.ts             # Original analytics routes
│   └── analytics.openapi.route.ts     # OpenAPI-documented analytics routes
└── schemas/
    └── analytics.schema.ts            # Zod schemas for validation & docs
```

## 🔧 Configuration

### Customizing Scalar UI

Edit `apps/api/src/index.ts`:

```typescript
app.get(
  "/reference",
  apiReference({
    theme: "purple",      // Options: purple, blue, green, etc.
    pageTitle: "Your API Documentation",
    metaData: {
      title: "Your API",
      description: "API description",
    },
  } as any),
)
```

### Adding More Documented Routes

1. Create Zod schemas in `schemas/`
2. Create routes using `createRoute` from `@hono/zod-openapi`
3. Use `app.openapi(route, handler)` to register routes
4. Add tags in the OpenAPI doc configuration

## 🌐 Environment URLs

The documentation includes these server configurations:

- **Development**: `http://localhost:8787`
- **Production**: Update in `index.ts` with your production URL

## 📦 Dependencies

- `@hono/zod-openapi`: OpenAPI integration for Hono
- `@scalar/hono-api-reference`: Scalar API documentation UI
- `zod`: Schema validation and OpenAPI types

## 🚀 Next Steps

### To Document More Routes:

1. **Auth Routes**: Create `auth.openapi.route.ts`
2. **User Routes**: Create `user.openapi.route.ts`
3. **Transaction Routes**: Create `transaction.openapi.route.ts`

### Example Template:

```typescript
import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { z } from "zod"

const route = createRoute({
  method: "get",
  path: "/endpoint",
  tags: ["YourTag"],
  summary: "Short description",
  description: "Detailed description",
  security: [{ BearerAuth: [] }],
  request: {
    query: z.object({
      param: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: YourResponseSchema,
        },
      },
    },
  },
})

app.openapi(route, async (c) => {
  // Your handler logic
})
```

## 🎯 Benefits

- **Type Safety**: Zod schemas ensure type safety
- **Auto-Generated**: Documentation auto-updates with code
- **Interactive**: Test APIs without Postman/Insomnia
- **Standards Compliant**: OpenAPI 3.0/3.1 compatible
- **Developer Friendly**: Beautiful, searchable UI

## 📝 Notes

- Currently only Analytics routes are fully documented
- Other routes (Auth, Users, Transactions) still use regular Hono routes
- The old `analytics.route.ts` is kept for reference
- Security schemes are defined in the OpenAPI 3.1 spec (`/api/doc31`)

## 🐛 Troubleshooting

### Documentation not showing?
- Ensure the server is running: `pnpm dev`
- Check the console for errors
- Verify the route is registered in `index.ts`

### Authentication not working in Scalar?
- Make sure to include "Bearer " prefix in the token
- Verify the JWT token is valid
- Check token expiration

### Changes not reflected?
- The documentation auto-updates when routes change
- Restart the dev server if needed
- Clear browser cache

---

**Enjoy exploring your API with Scalar! 🎉**
