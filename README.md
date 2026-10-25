# SecureLab — SQL Injection Practice Lab

**SecureLab** is a full-stack cybersecurity educational web application and interactive penetration testing laboratory designed exclusively for authorized cybersecurity education, penetration testing practice, and defensive software engineering in a local development environment.

It pairs a realistic Developer & Security Community Forum (**DevSecExchange**) with an isolated, hands-on **SQL Injection Training Lab** allowing students to investigate, execute, and remediate vulnerabilities side-by-side with secure parameterized prepared statements.

---

## 1. Quick Start & Installation

```bash
# 1. Install dependencies
npm install

# 2. Launch the full-stack application (runs Express backend + Vite frontend on port 3000)
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 2. Pre-Seeded Laboratory Accounts

The local database is pre-seeded with fictional user accounts:

| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `DevSecAdmin2026!` | User suspension, audit log review, content moderation, full DB reset |
| **Security Lead** | `sarah_sec` | `SarahSec#2026` | Standard user: post discussions, comment, edit/delete own comments |
| **Developer** | `alex_dev` | `AlexDev#2026` | Standard user: post discussions, comment, edit/delete own comments |
| **Cloud Ops** | `marcus_k` | `MarcusCode#2026` | Standard user: post discussions, comment, edit/delete own comments |

*Note: 1-click Quick Login buttons are available in the Authentication Portal modal for immediate testing.*

---

## 3. Architecture & Security Boundaries

### Production-Style Defensive Platform (DevSecExchange)
All forum modules (User Authentication, Session Tokens, Discussions, Search, Comments, and Admin Moderation) enforce **medium-to-high defensive posture**:
- **Parameterized SQL Queries**: Every query uses prepared statements with bound parameters (`?`). Characters like `'`, `"`, `;`, `--`, and `/*` are strictly treated as data literals without modifying query grammar.
- **Salted Password Hashing**: Passwords are encrypted using `bcrypt` (10 rounds). Plaintext passwords and hashes are never exposed.
- **Role-Based Access Control (RBAC)**: Enforced strictly on the server (`requireAdmin` middleware). Non-admin users cannot access administrative endpoints.
- **Rate Limiting**: Sliding-window rate limiters protect the `/api/auth/login` (20/min) and `/api/posts` search (40/min) endpoints against brute force.
- **Tamper-Evident Audit Logging**: Administrative logins, failed authentication attempts, rate-limit triggers, user status changes, and database resets are immutably logged in `audit_logs`.

### Isolated SQL Injection Training Lab
The interactive lab module runs in a separate execution sandbox (`/api/lab/execute`):
- Operates on dedicated synthetic tables (`lab_accounts`, `lab_products`, `lab_feedback`, `lab_secrets`).
- Allows local students to compare **Vulnerable Dynamic Query Execution** against **Secure Parameterized Query Execution**.
- Sandbox security guards block DDL commands (`DROP TABLE USERS`, `ATTACH`, `PRAGMA WRITABLE_SCHEMA`) to prevent tampering with host files or production credentials.

---

## 4. Interactive SQLi Scenarios

1. **Lab 1: Authentication Bypass (In-Band / Tautology)**
   - *Vulnerable pattern*: Direct string interpolation in login query.
   - *Sample payload*: `lab_admin' --` or `' OR '1'='1' --`
   - *Remediation*: Bind credentials using prepared statements (`stmt.bind([username, password])`).

2. **Lab 2: UNION-Based Cross-Table Exfiltration**
   - *Vulnerable pattern*: Direct string interpolation in product category search.
   - *Sample payload*: `Hardware Security' UNION SELECT token_value, service_name, notes, 0 FROM lab_secrets --`
   - *Remediation*: Query parameterization locks the expected result columns, treating `UNION` as a literal word.

3. **Lab 3: Error-Based Diagnostic Leakage**
   - *Vulnerable pattern*: Unsanitized rating parameter with verbose SQLite errors surfaced to the client.
   - *Sample payload*: `5 AND 1=CAST((SELECT token_value FROM lab_secrets LIMIT 1) AS INTEGER) --`
   - *Remediation*: Parameterized numeric binding + generic error handling boundaries that mask driver internals.

4. **Lab 4: Blind SQL Injection (Boolean & Timing Analysis)**
   - *Vulnerable pattern*: Insecure boolean condition in SKU check.
   - *Sample payload*: `HW-SEC-101' AND (SELECT SUBSTR(token_value,1,4) FROM lab_secrets WHERE service_name='SYNTHETIC_VAULT_FLAG') = 'FLAG' --`
   - *Remediation*: Parameterized SKU verification prevents query condition alteration.

---

## 5. Automated Security Test Suite

SecureLab includes an integrated automated test harness:
- Navigate to the **Test Runner** tab in the navigation bar or click **Run Automated Tests**.
- The harness validates each vulnerability class, asserting:
  1. The vulnerable dynamic SQL construction successfully triggers the exploit or leaks data.
  2. The secure parameterized implementation cleanly neutralizes the exploit and protects data integrity.
  3. Production forum endpoints safely handle quotes and special characters (`Robert'); DROP TABLE Students;--`) without database errors.

---

## 6. One-Click Database Reset

Whenever desired, click **Reset Lab Database** in the lab header or **Reset Full Database** in the Admin Console to drop all modifications and reseed clean synthetic records and capture-the-flag vault tokens.
