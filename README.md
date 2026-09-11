# 🏡 Home Services Marketplace

A production-ready, highly scalable local services platform (similar to Urban Company / TaskRabbit). This monorepo contains the backend infrastructure, database models, payment gateways, and admin dashboard required to run a full-scale marketplace.

---

## 🏗️ System Architecture

The project is structured as an **NPM Workspace Monorepo**, ensuring seamless dependency management across the backend and frontend client applications.

```mermaid
graph TD
    %% Clients
    CustomerWeb[🌐 Customer Website \n Next.js 15]
    ProviderApp[📱 Provider App \n Flutter]
    AdminWeb[💻 Admin Dashboard \n Next.js 15]

    %% API Gateway / Backend
    subgraph "Backend Infrastructure (NestJS)"
        API Gateway --> AuthGuard[Firebase Auth Guard]
        AuthGuard --> RBAC[Role-Based Access Control]
        RBAC --> BookingsModule[Bookings Service]
        RBAC --> ProviderModule[Providers & KYC Service]
        RBAC --> PaymentsModule[Razorpay Payments]
        RBAC --> WebsocketGateway[Socket.io Gateway]
    end

    %% Databases
    subgraph "Data Persistence"
        Prisma[Prisma ORM]
        Postgres[(PostgreSQL + PostGIS)]
        Redis[(Redis Cache / WS State)]
    end

    %% Third-Party Services
    Firebase((Firebase Auth \n OTP))
    Razorpay((Razorpay \n Webhooks))

    %% Connections
    CustomerApp <-->|REST & WSS| API Gateway
    ProviderApp <-->|REST & WSS| API Gateway
    AdminWeb <-->|REST| API Gateway

    API Gateway --> Prisma
    Prisma --> Postgres
    API Gateway --> Redis

    AuthGuard -.-> Firebase
    PaymentsModule <--> Razorpay
```

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
|--------|------------|---------|
| **Backend API** | NestJS | Scalable, strictly-typed Node.js framework |
| **Database** | PostgreSQL | Primary relational data store |
| **ORM** | Prisma (v5) | Type-safe database queries and migrations |
| **Authentication** | Firebase Admin | Phone OTP and JWT verification |
| **Payments** | Razorpay | Transaction processing with idempotent webhooks |
| **Real-time** | Socket.io | Bidirectional booking status updates |
| **Admin UI** | Next.js 15, Tailwind | Server-side rendered dashboard |
| **Containerization** | Docker | Multi-stage production builds |
| **CI/CD** | GitHub Actions | Automated linting, building, and GHCR publishing |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js `v18+`
- Docker & Docker Compose
- A Firebase Project (for Authentication)
- A Razorpay Account (for test API keys)

### 1. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/homeservices?schema=public"
PORT=3001
FIREBASE_SERVICE_ACCOUNT="{...}"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

### 2. Bootstrapping Infrastructure
Start the PostgreSQL and Redis containers:
```bash
docker-compose up -d
```

### 3. Install & Seed
Install dependencies across the monorepo, push the schema, and seed mock data:
```bash
npm install
npm run prisma:push --workspace=backend
npm run prisma:seed --workspace=backend
```
*(The seed script provisions an Admin user, mock Categories, Services, Customers, and Providers with KYC data).*

### 4. Run the Stack
Start both the NestJS API and Next.js Admin Dashboard simultaneously:
```bash
npm run dev --workspaces
```
- **Backend API:** `http://localhost:3001`
- **Admin Dashboard:** `http://localhost:3000`

---

## 🛡️ Core Features & Engineering Patterns

### 1. Concurrency-Safe Bookings Engine
Marketplaces live and die by state management. When a customer books a provider, the system enforces strict state machine transitions (`REQUESTED` -> `ACCEPTED` -> `COMPLETED`) protected by **PostgreSQL Transactions**. This prevents race conditions where a provider might accept a cancelled booking.

### 2. Idempotent Fintech Integration
The Razorpay webhook processor utilizes cryptographic signature validation (`crypto.createHmac`) to ensure the payload actually originated from Razorpay. It also implements idempotency checks to prevent duplicate payment processing in the event of webhook retries.

### 3. Role-Based Access Control (RBAC)
Security is implemented globally at the route level. By decorating controllers with `@Roles(Role.ADMIN)`, the custom `RolesGuard` strictly validates the requester's database identity against their Firebase JWT token.

### 4. Real-time Websocket Dispatching
Client applications do not need to poll for updates. The `NotificationsGateway` maps authenticated socket connections to user IDs. When a database transaction updates a booking, the backend instantly pushes a `bookingStatusUpdated` payload to both the Customer and Provider over TCP.

---

## 🚢 Production Deployment

This monorepo is fully configured for zero-downtime cloud deployments.

1. **Dockerized:** Both the NestJS and Next.js applications have highly optimized multi-stage `Dockerfile` configurations designed to aggressively prune node modules and shrink image sizes.
2. **CI/CD:** Pushing a tag (e.g., `v1.0.0`) triggers `.github/workflows/cd.yml`, which automatically builds and pushes the containers to the GitHub Container Registry (`ghcr.io`).
