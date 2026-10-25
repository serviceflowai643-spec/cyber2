# SecureLab — SQL Injection Practice Lab

SecureLab is a production-grade, full-stack cybersecurity educational web application and interactive penetration testing lab. It pairs a realistic Developer & Security Community Forum ("DevSecExchange") with an isolated, hands-on SQL Injection Training Lab allowing students and security professionals to explore, execute, and remediate vulnerabilities (Auth Bypass, UNION-based, Error-based, and Blind SQLi) alongside secure parameterized counterparts.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been confirmed through initial requirements alignment:

- **Confirmed SQLi Suite**: Comprehensive 4-scenario suite featuring (1) Authentication Bypass `' OR '1'='1`, (2) UNION-based data extraction across schema tables, (3) Error-based verbose diagnostic leakage, and (4) Blind SQLi (Boolean true/false differences & simulated time-delay response analysis).
- **Confirmed Platform Theme**: Developer & Security Community Forum ("DevSecExchange") featuring technical discussions, code snippet sharing, vulnerability disclosures, tagged topics, user profiles, and threaded comments.
- **Confirmed Database & Isolation**: Embedded local SQLite database (`better-sqlite3` / `sql.js`) with instant one-click reseeding and state resets, keeping all vulnerable query simulations strictly isolated within sandbox tables to prevent any escalation into host OS or server credentials.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a dual-mode experience:
  1. A realistic production forum where users register, authenticate securely (password hashing, secure session tokens, rate limiting), browse posts, search discussions, manage their profile, post articles, and submit comments.
  2. A dedicated, interactive **SQL Injection Training Lab** where students can toggle between "Vulnerable Query Execution" and "Secure Parameterized Query", inspect raw queries, test payloads, observe execution timelines, read remediation deep-dives, and run automated regression tests.
  3. A full-featured **Administrator Moderation Dashboard** allowing authorized admins to manage users, ban accounts, moderate discussions/comments, view real-time audit logs, and trigger instant database reseeds.
- **Target Audience / Persona**: Cybersecurity students, penetration testers, software engineers, and application security instructors seeking safe, realistic local practice.
- **Key Value**: Bridges the gap between synthetic "toy" capture-the-flag exercises and realistic modern web applications by showing how vulnerabilities manifest in real codebases and how parameterized queries cleanly prevent them.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Public Forum Exploration & Secure Search**: Visitors browse active technical threads, filter by tags (`application-security`, `cryptography`, `sql-hardening`, `kernel`), and execute live keyword searches powered by secure parameterized queries.
2. **Authentication & RBAC**: Users register and log in with bcrypt-hashed credentials. Standard users get personalized profile controls and comment edit/delete privileges. The seeded Admin (`admin@securelab.local`) gains instant access to the Admin Dashboard.
3. **Interactive SQLi Practice Lab**:
   - Students select one of 4 vulnerability scenarios:
     - **Lab 1: Login Authentication Bypass** (`admin' --`, `' OR '1'='1'`)
     - **Lab 2: UNION-Based Data Extraction** (extracting hidden users/tokens from search queries)
     - **Lab 3: Error-Based Diagnostic Leakage** (forcing SQLite syntax errors to leak table names and column layouts)
     - **Lab 4: Blind SQL Injection** (Boolean inferences and time-delay timing differentials)
   - Interactive payload playground with pre-built educational cheat-sheets and custom input execution.
   - Side-by-side comparison: "Execute Vulnerable" vs. "Execute Secure Parameterized", with visual AST/query inspector and defense breakdown.
4. **Admin Dashboard & Content Moderation**: Admins review account analytics, ban suspicious users, view server audit events, and trigger a one-click database reset.

### Visual Identity & Theme (Domain-Native Dark Palette)
- **Aesthetic Direction**: High-trust, sleek modern engineering and security console. Dark navy canvas with crisp slate borders, electric blue accents, and tabular data density without clutter or fake telemetry.
- **Color Palette (60-30-10 Discipline)**:
  - *60% Neutral Canvas*: Deep Navy / Midnight Slate (`#0B0F19`, `#0F172A`).
  - *30% Structural Surfaces*: Bordered cards and headers (`#1E293B`, `#334155`), clean hairline borders (`border-slate-800`).
  - *10% Action Accent*: Focused Electric Blue (`#3B82F6` / `#2563EB`) and Emerald (`#10B981`) for secure indicators, Ruby Crimson (`#EF4444`) for vulnerability indicators.
- **Typography & Scale**:
  - Display & Headings: `Plus Jakarta Sans` or modern sans-serif with balanced line wrapping.
  - Body & UI: Clean sans with 1.6 line height and unboxed metadata (`·` separators).
  - Code & Query Telemetry: Monospace tabular numerals (`JetBrains Mono` / `font-mono tabular-nums`).
- **Interactive Feedback & Motion**:
  - Smooth 150ms transitions on interactive buttons and tabs.
  - Clear query execution result panels with syntax-highlighted SQL and execution timings.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Query Sandboxing (Safe vs Vulnerable)**
  - *Chosen Approach*: The application's core production routes (auth, posts, comments, profile, admin) strictly enforce parameterized queries (`db.prepare('... WHERE id = ?')`). The training lab routes run in a strictly contained sandbox module (`/api/lab/execute`) using dedicated lab tables (`lab_products`, `lab_members`, `lab_feedback`) with an execution timeout and forbidden commands (`ATTACH`, `PRAGMA writable_schema`, system calls).
  - *Why*: Allows authentic, educational SQL injection exploitation while ensuring that testing cannot corrupt system security, compromise real administrative tokens, or breach the host environment.
- **Decision 2: Integrated Full-Stack Express Server with Vite Dev Proxy**
  - *Chosen Approach*: Express full-stack backend running concurrently or integrated via Vite middleware / proxy on port 3000, serving robust REST endpoints (`/api/auth/*`, `/api/posts/*`, `/api/comments/*`, `/api/admin/*`, `/api/lab/*`).
  - *Why*: Provides genuine server-side authorization checks, rate limiting, secure HTTP-only cookies/tokens, real SQL query compilation, and instant database reset without artificial client-side mock logic.
- **Decision 3: Built-in Automated Verification & Security Test Suite**
  - *Chosen Approach*: An interactive "Security Test Runner" tab inside the lab UI that runs automated regression test cases verifying: (a) Vulnerable query succeeds in exploit, (b) Parameterized query neutralizes the exploit, (c) Admin route rejects unauthorized users, and (d) Rate limiting triggers on brute force.
  - *Why*: Fulfills prompt requirement #7 and #8 for automated tests demonstrating the difference between vulnerable and parameterized execution.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SecureLab Frontend (React)                      │
│                                                                        │
│   ┌─────────────────────┐   ┌─────────────────┐   ┌────────────────┐   │
│   │ DevSec Community UI │   │  SQLi Lab Suite │   │ Admin Console  │   │
│   │ - Threads & Search  │   │  - 4 Scenarios  │   │ - User Mgmt    │   │
│   │ - Comments & Posts  │   │  - Side-by-Side │   │ - Audit Logs   │   │
│   │ - Profile & Auth    │   │  - Test Suite   │   │ - DB Reset     │   │
│   └──────────┬──────────┘   └────────┬────────┘   └───────┬────────┘   │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
               ▼                       ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Express Server API Layer (Node.js)                    │
│                                                                        │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────┐   │
│   │ Production API /api  │  │ Lab Sandbox API      │  │ Middleware │   │
│   │ - /auth /posts       │  │ - /lab/scenarios     │  │ - Auth RBAC│   │
│   │ - /comments /admin   │  │ - /lab/execute       │  │ - RateLimit│   │
│   │ (Parameterized Only) │  │ - /lab/reset-db      │  │ - AuditLog │   │
│   └──────────┬───────────┘  └──────────┬───────────┘  └─────┬──────┘   │
└──────────────┼─────────────────────────┼────────────────────┼──────────┘
               │                         │                    │
               ▼                         ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Local SQLite Database                           │
│                                                                        │
│   [Production Tables]               [Isolated Lab Tables]              │
│   - users (hashed passwords, roles) - lab_accounts                     │
│   - posts (technical articles)      - lab_products                     │
│   - comments (threaded)             - lab_feedback                     │
│   - audit_logs                      - lab_secrets (educational flags)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Key Schema
1. **users**: `id, username, email, password_hash, role ('admin'|'user'), bio, avatar_seed, created_at, is_banned`
2. **posts**: `id, author_id, title, category, tags, content, views, likes_count, created_at, updated_at`
3. **comments**: `id, post_id, author_id, content, created_at, updated_at`
4. **audit_logs**: `id, timestamp, actor_username, action, ip_address, status, details`
5. **lab_accounts / lab_products / lab_feedback**: Resettable synthetic tables for UNION-based extraction, blind boolean extraction, and error probing.

### Interactive Component Mapping
- `Navbar`: 3-zone header with brand mark, forum links, Lab Switcher, Search bar, and User Account/Admin pill-free dropdown.
- `ForumFeed`: Tag filtering, post cards with unboxed author and timestamp metadata, like counts, and view counts.
- `PostDetail & Comments`: Full article view with markdown/code snippets, interactive comment creation, inline edit/delete for comment owners.
- `LabConsole`: Scenario selector, attack goal description, payload editor with pre-set payloads, side-by-side Vulnerable vs Secure executor, query execution inspector, and remediation guide.
- `AdminDashboard`: Statistics cards (Users, Posts, Comments, Audit count), user suspension toggle, audit log viewer, and one-click DB reset button.
- `SecurityTestRunner`: Automated client/server test suite verifying SQLi exploitability on vulnerable routes and complete neutralization on parameterized routes.
