# 🏔️ ABRAVENTURE | Integrated Tourism Platform
> **Province of Abra · Cordillera Administrative Region (CAR), Philippines**

ABRAVENTURE is an enterprise-grade Integrated Tourism Information, Homestay Management, and Municipal Governance Platform built for the Provincial Tourism Office (DOT) of Abra and its **27 municipalities**. It connects travelers with accredited homestays, verified tour guides, interactive cultural maps, and municipal tourism desks, while providing government officers with real-time analytics, compliance tracking, and automated reporting.

---

## 📸 Platform Overview & Key Features

### 1. 🧭 Multi-Role User Portals & Access Control
- **Tourists & Travelers**:
  - Discover attractions, heritage sites, and events across all 27 municipalities.
  - Interactive Leaflet map with GeoJSON municipality boundaries and route planning.
  - Plan custom itineraries with budget and duration tracking.
  - Book verified homestays and accredited local tour guides.
  - Direct host messaging and payment proof upload (GCash / Bank Transfer).
  - Submit reviews and file official tourist grievances/complaints directly to municipal desks.
- **Municipal Tourism Officers (Municipal DOT)**:
  - Verify and endorse local homestays and tour guide accreditation applications.
  - Manage municipal tourist attractions, events, and emergency contacts.
  - Resolve tourist complaints and track municipal tourism statistics.
  - Download official PDF & Excel tourism reports.
- **Provincial DOT Officers**:
  - Master administrative overview of province-wide tourism statistics.
  - Approve Municipal DOT Officers and stakeholder accreditation applications.
  - Broadcast official announcements and manage homepage hero content.
  - Automated nightly cron notifications for overdue compliance documents.
  - Full system database backup and data export engine.
- **Homestay Owners**:
  - Manage homestay profiles, room listings, rates, and photo galleries.
  - Manage booking inquiries, communicate with guests, and confirm stays.
  - Submit mandatory compliance documents for municipal accreditation.
- **Accredited Tour Guides**:
  - Manage guide profiles, pricing rates, languages spoken, and availability calendars.
  - Receive booking requests from tourists.

---

### 2. 🛡️ Enterprise 15-Point Security Hardening
ABRAVENTURE implements a comprehensive 15-point security architecture:
- **Separated Auth Portals**: Isolated **Tourist Sign In** (`/login`) from the **Official & Stakeholder Portal** (`/portal/login`) with strict role enforcement.
- **Brute-Force & API Rate Limiting**: In-memory sliding window rate limiting (5 attempts/15 min on auth, 200 req/15 min globally).
- **HTTP Security Headers**: HSTS, Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `X-XSS-Protection`.
- **Input Sanitization**: Recursive XSS input sanitizer stripping dangerous script tags, `javascript:` protocols, and executable attributes.
- **Parameterized SQL Queries**: 100% PostgreSQL parameterized queries (`$1`, `$2`) to prevent SQL Injection vulnerabilities.
- **IDOR Protection**: Owner-scoped server-side permission checks on all database resource updates and deletions.
- **File Upload Security**: Strict MIME and extension whitelisting (`.jpg`, `.png`, `.pdf`, `.mp4`), double-extension rejection (`file.png.exe`), and cryptographically random filenames (`crypto.randomBytes`).
- **AI Security Guard**: Prompt injection defender (`validateAiInput`), system prompt protection, and secrets/PII masker (`maskSecretsAndPii`).
- **Audit Logging**: Mandatory logging of authentication events, admin actions, and 2FA requests into PostgreSQL `activity_logs`.
- **Automated Security Test Suite**: Integrated security test runner (`npm run test:security`) asserting 23 security controls.

---

## 🛠️ Technology Stack

### **Frontend**
- **Core Framework**: React 18 (Vite)
- **Styling & Icons**: TailwindCSS v4, Lucide React Icons, Custom Itneg Cultural Design System
- **Routing & State**: React Router DOM (v6/v7), React Context API (`AuthContext`, `AlertContext`)
- **Mapping & Visualization**: React Leaflet, Leaflet MarkerCluster, Recharts (Analytics Charts)
- **Exports & Documents**: jsPDF, XLSX (SheetJS), SweetAlert2

### **Backend**
- **Runtime & Server**: Node.js 20+, Express.js (ES Modules)
- **Database & Pooling**: PostgreSQL (`pg` connection pool / Neon serverless compatible)
- **Authentication**: Bcrypt.js (salt rounds 10), JSON Web Tokens (JWT)
- **Media & File Storage**: Multer with Cloudinary API integration & local disk storage fallback
- **Cron Jobs**: Node-Cron background scheduling

### **DevOps & Infrastructure**
- **Containerization**: Docker, Docker Compose
- **Web Server & Reverse Proxy**: Nginx
- **Hosting Targets**: Vercel (Frontend), Render / Railway / Docker (Backend), Neon (Database)

---

## 📁 Project Folder Structure

```text
Abraventure/
├── package.json                   # Root monorepo workspace orchestration
├── docker-compose.yml             # Unified Docker composition (Postgres + Express + Vite)
├── README.md                      # Project documentation
│
├── backend/
│   ├── Dockerfile                 # Production Express Node.js container setup
│   ├── index.js                   # Server entrypoint with security middleware
│   ├── schema.sql                 # PostgreSQL DDL database schema & migrations
│   ├── seed.js                    # Initial database seeder
│   │
│   ├── config/                    # Database connection pool (db.js)
│   ├── controllers/               # API Controllers (auth, listings, inquiries, etc.)
│   ├── jobs/                      # Background cron jobs (overdueAssetsCron.js)
│   ├── middleware/                # Security headers, XSS sanitizer, rate limiters, uploads
│   ├── routes/                    # Express API route modules
│   ├── tests/                     # Automated security test suite (securityCheck.js)
│   └── uploads/                   # Local static media uploads directory
│
└── frontend/
    ├── Dockerfile                 # Production Nginx container setup
    ├── vite.config.js             # Vite build configuration
    ├── nginx.conf                 # Production Nginx server configuration
    │
    └── src/
        ├── App.jsx                # Main React router with modular imports
        ├── main.jsx               # React DOM entrypoint
        ├── index.css              # Custom styling & Tailwind design tokens
        │
        ├── context/               # AuthContext.jsx, AlertContext.jsx
        │
        ├── components/
        │   ├── ui/                # Shadcn UI Components (Button, Card, Dialog, Input, Badge, etc.)
        │   ├── layout/            # Layout.jsx, Navbar.jsx, RouteGuard.jsx
        │   └── common/            # SafeImage.jsx
        │
        └── pages/
            ├── auth/              # Login.jsx, PortalLogin.jsx, Register.jsx
            ├── dashboards/        # Provincial, Municipal, Owner, Guide, Tourist Dashboards
            └── explore/           # Home, Municipalities, Details, Map, Events, TravelTips, etc.
```

---

## 🚀 Quick Start & Installation

### **Prerequisites**
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v15` or higher (or a free [Neon PostgreSQL](https://neon.tech) database)
- *(Optional)* **Docker & Docker Compose**

---

### **Option 1: Standard Local Setup**

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/Abraventure.git
   cd Abraventure
   ```

2. **Backend Configuration**:
   Navigate to `backend/` and set up environment variables:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   Configure `.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgres://user:password@localhost:5432/abraventure_db
   JWT_SECRET=supersecretkeyforabraventure2026
   CLIENT_ORIGIN=http://localhost:3000
   
   # Optional Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Initialize & Seed Database**:
   ```bash
   # Run schema migration and seed initial data
   node seed.js
   ```

4. **Frontend Configuration**:
   In a new terminal window, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

5. **Run Development Servers**:
   - **Backend Server**: `npm run dev` (Runs on `http://localhost:5000`)
   - **Frontend App**: `npm run dev` (Runs on `http://localhost:3000`)

---

### **Option 2: Unified Docker Compose Setup**

Run the full stack (PostgreSQL Database + Node Backend + Vite Frontend) in Docker with a single command:

```bash
docker-compose up --build
```
- **Frontend Portal**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🧪 Testing & Verification

Run the automated security test suite to verify 23 security assertions (XSS filtering, SQLi protection, password policy, AI prompt injection defense, rate limiting, and security headers):

```bash
npm run test:security
```

Build the production frontend bundle:

```bash
npm run build
```

---

## 📋 Default Credentials (Seed Data)

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Provincial DOT Admin** | `provincial@dot.abra.gov.ph` | `password123` | `/portal/login` |
| **Tourist Account** | *(Register via UI)* | *(User Created)* | `/login` |

---

## 🏛️ License & Credits

Developed for the **Provincial Tourism Office of Abra, Cordillera Administrative Region (CAR), Philippines**. All rights reserved.
