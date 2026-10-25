import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'securelab.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing database file, creating fresh instance:', e);
      dbInstance = new SQL.Database();
      await initSchemaAndSeed(dbInstance);
      saveDb();
    }
  } else {
    dbInstance = new SQL.Database();
    await initSchemaAndSeed(dbInstance);
    saveDb();
  }

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

// Helper to run parameterized query returning all rows as objects
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// Helper to run parameterized query returning first row
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to run INSERT/UPDATE/DELETE with parameters
export async function run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  
  // Get last insert rowid and changes
  const lastIdRes = db.exec("SELECT last_insert_rowid() AS id, changes() AS changes;");
  let lastInsertRowid = 0;
  let changes = 0;
  if (lastIdRes.length > 0 && lastIdRes[0].values.length > 0) {
    lastInsertRowid = Number(lastIdRes[0].values[0][0]) || 0;
    changes = Number(lastIdRes[0].values[0][1]) || 0;
  }
  
  saveDb();
  return { lastInsertRowid, changes };
}

// Raw execution helper for isolated lab queries
export async function execRaw(sql: string): Promise<{ columns: string[]; values: any[][] }[]> {
  const db = await getDb();
  const res = db.exec(sql);
  saveDb();
  return res;
}

// Audit log helper
export async function addAuditLog(actorUsername: string, action: string, ip: string, status: 'SUCCESS' | 'DENIED' | 'FLAGGED', details: string) {
  try {
    await run(
      `INSERT INTO audit_logs (timestamp, actor_username, action, ip_address, status, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [new Date().toISOString(), actorUsername, action, ip, status, details]
    );
  } catch (e) {
    console.error('Audit log write failed:', e);
  }
}

export async function initSchemaAndSeed(db: Database) {
  // 1. Drop existing tables if resetting
  db.run(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS lab_accounts;
    DROP TABLE IF EXISTS lab_products;
    DROP TABLE IF EXISTS lab_feedback;
    DROP TABLE IF EXISTS lab_secrets;
  `);

  // 2. Create Production Schema
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      display_name TEXT NOT NULL,
      avatar_seed TEXT NOT NULL,
      bio TEXT,
      reputation INTEGER DEFAULT 100,
      is_banned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      content TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      actor_username TEXT NOT NULL,
      action TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  // 3. Create Dedicated, Isolated Lab Tables for SQL Injection Training
  // These tables are synthetically seeded and isolated from real session/user credentials
  db.run(`
    CREATE TABLE lab_accounts (
      account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      account_tier TEXT NOT NULL,
      email TEXT NOT NULL,
      api_access_key TEXT NOT NULL
    );

    CREATE TABLE lab_products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      description TEXT NOT NULL,
      is_public INTEGER DEFAULT 1
    );

    CREATE TABLE lab_feedback (
      feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      feedback_type TEXT NOT NULL,
      message TEXT NOT NULL,
      rating INTEGER NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE lab_secrets (
      secret_id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      token_value TEXT NOT NULL,
      confidentiality_level TEXT NOT NULL,
      notes TEXT NOT NULL
    );
  `);

  // 4. Seed Production Users (Fictional, synthetic credentials)
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('DevSecAdmin2026!', salt);
  const user1Hash = bcrypt.hashSync('AlexDev#2026', salt);
  const user2Hash = bcrypt.hashSync('SarahSec#2026', salt);
  const user3Hash = bcrypt.hashSync('MarcusCode#2026', salt);

  const now = new Date().toISOString();

  db.run(`
    INSERT INTO users (username, email, password_hash, role, display_name, avatar_seed, bio, reputation, is_banned, created_at)
    VALUES
      ('admin', 'admin@securelab.local', '${adminHash}', 'admin', 'DevSec Administrator', 'admin', 'SecureLab Platform Systems Administrator and Security Auditor.', 950, 0, '${now}'),
      ('alex_dev', 'alex@devsec.io', '${user1Hash}', 'user', 'Alex Rivera', 'alex', 'Full-stack developer focused on modern web architectures and defensive programming.', 340, 0, '${now}'),
      ('sarah_sec', 'sarah@threatintel.org', '${user2Hash}', 'user', 'Sarah Lin, CISSP', 'sarah', 'AppSec practitioner, vulnerability researcher, and CTF contributor.', 480, 0, '${now}'),
      ('marcus_k', 'marcus@cloudops.dev', '${user3Hash}', 'user', 'Marcus Keller', 'marcus', 'Infrastructure automation, Linux internals, and database hardening advocate.', 210, 0, '${now}');
  `);

  // 5. Seed Production Forum Posts (Synthetic, realistic technical discussions)
  db.run(`
    INSERT INTO posts (author_id, title, category, tags, content, views, likes_count, created_at, updated_at)
    VALUES
      (
        2,
        'Parameterized Queries vs Dynamic SQL: A Practical Look at AST Compilation',
        'Defensive Engineering',
        'sql-hardening,parameterization,database-internals',
        'When an application executes dynamic SQL via string concatenation, the database engine parser treats user input as structural code tokens. In contrast, parameterized queries separate the query grammar tree from literal values.\n\n### Why Parameterization Works\nDuring compilation, the database engine produces an Abstract Syntax Tree (AST) with fixed bind placeholders. User input provided to those placeholders is treated purely as literal constants (text, numbers, or blobs), completely precluding SQL grammar alteration.\n\n\`\`\`sql\n-- Safe: Bind parameters evaluated strictly as data literals\nSELECT id, title FROM posts WHERE category = ? AND views >= ?;\n\`\`\`\n\nNo matter what characters are passed inside the parameter, the execution structure cannot change.',
        428,
        34,
        '${now}',
        '${now}'
      ),
      (
        3,
        'Dissecting Second-Order SQL Injections in Auditing and Profile Pipelines',
        'Vulnerability Research',
        'second-order,audit-logging,appsec',
        'Second-order SQL injection occurs when user-supplied input is safely stored in the database on initial submission (perhaps properly parameterized or escaped), but subsequently retrieved and concatenated unsafely into a secondary database query.\n\n### Typical Attack Vector\n1. Attacker registers with username \`admin''--\`\n2. User profile is stored safely via parameterized INSERT.\n3. An administrative batch script runs: \`SELECT * FROM users WHERE username = '''' || user.name || ''''\`\n4. The stored payload triggers syntax break-out during the secondary operation.\n\nAlways ensure that data read back from trusted databases is still bound with parameters when used in secondary queries.',
        612,
        49,
        '${now}',
        '${now}'
      ),
      (
        4,
        'Understanding SQLite Memory Footprint and WASM Execution Guarantees',
        'Database Internals',
        'sqlite,wasm,architecture',
        'SQLite compiled to WebAssembly offers exceptional determinism for local laboratory environments. Because it operates within a sandboxed linear memory space, intentional lab injection scenarios can safely execute without any access to host system calls, sockets, or local file descriptors outside the designated database buffer.\n\nIn our upcoming release, we will share benchmarks comparing in-memory virtual tables against persistent B-Tree storage.',
        290,
        18,
        '${now}',
        '${now}'
      ),
      (
        3,
        'Defense-in-Depth: Combining Least Privilege with Static Code Analysis',
        'AppSec & Compliance',
        'least-privilege,sast,compliance',
        'Relying solely on runtime input validation or Web Application Firewalls (WAF) is a fragile defense. Genuine defense-in-depth requires:\n\n1. **Query Parameterization**: The primary and non-negotiable defense.\n2. **Least Privilege**: The database application user should never possess DDL privileges (\`DROP TABLE\`, \`ALTER\`) or administrative schemas in production.\n3. **Static Analysis (SAST)**: Automated linting rules detecting string concatenation inside query builder calls before pull requests merge.\n\nWhat rulesets are you currently enforcing in your CI/CD pipelines?',
        385,
        27,
        '${now}',
        '${now}'
      );
  `);

  // 6. Seed Realistic Comments (including designated test records with special SQL characters for student testing)
  db.run(`
    INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
    VALUES
      (1, 3, 'Excellent breakdown! It is also critical to note that ORMs do not guarantee safety if developers fall back to raw clauses like \`User.where("name = ''" + input + "''")\`.', '${now}', '${now}'),
      (1, 4, 'Tested this with unusual names like Brian O''Connor and corporate names like Smith & Sons; parameterization handles apostrophes effortlessly without manual escaping.', '${now}', '${now}'),
      (2, 2, 'Great reminder on second-order injections. We caught one in a monthly invoice generation routine last quarter.', '${now}', '${now}'),
      (2, 1, 'Notice for lab students: Test records containing quotes like \`Robert''); DROP TABLE Students;--\` are safely rendered in our forum comments thanks to HTML entity encoding and parameterized persistence.', '${now}', '${now}'),
      (3, 3, 'The zero-privilege sandboxing of WASM linear memory makes it the gold standard for secure testing labs.', '${now}', '${now}');
  `);

  // 7. Seed Initial Audit Logs
  db.run(`
    INSERT INTO audit_logs (timestamp, actor_username, action, ip_address, status, details)
    VALUES
      ('${now}', 'system', 'DATABASE_INITIALIZATION', '127.0.0.1', 'SUCCESS', 'SecureLab SQLite schema initialized and synthetic seed records populated.'),
      ('${now}', 'admin', 'AUTHENTICATION_LOGIN', '127.0.0.1', 'SUCCESS', 'Administrator session authenticated via secure PBKDF2/bcrypt token verification.'),
      ('${now}', 'guest', 'LAB_SCENARIO_INSPECT', '127.0.0.1', 'SUCCESS', 'Student opened SQLi Lab Module: Union-based data extraction.');
  `);

  // 8. Seed Isolated Lab Tables (Educational targets)
  db.run(`
    INSERT INTO lab_accounts (username, password_hash, account_tier, email, api_access_key)
    VALUES
      ('lab_admin', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Executive Tier', 'lab_admin@synthetic-corp.test', 'sk_live_synthetic_98a72b1c4e'),
      ('developer_dan', '7895e63e230350cfc51cae5e192ff07b483e5fa8d7a12b6df522b3b0b57e7992', 'Standard Member', 'dan@synthetic-corp.test', 'sk_test_synthetic_21f58a74e0'),
      ('auditor_elena', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Senior Auditor', 'elena@synthetic-corp.test', 'sk_test_synthetic_54c89d12a7');

    INSERT INTO lab_products (product_name, category, sku, price, stock, description, is_public)
    VALUES
      ('SecureGate Hardware Token Pro', 'Hardware Security', 'HW-SEC-101', 89.99, 140, 'FIDO2 & U2F compliant physical authentication key with biometric thumbprint.', 1),
      ('Encrypted NVMe SSD 2TB', 'Storage', 'STR-ENC-204', 199.50, 45, 'Hardware AES-256 self-encrypting enterprise SSD with tamper-resistant casing.', 1),
      ('PacketSentry Network Probe', 'Network Auditing', 'NET-SEN-301', 349.00, 20, 'Gigabit packet inspection tap with isolated SPAN output and zero-drop buffer.', 1),
      ('Internal Prototype HSM Rev 4', 'Confidential R&D', 'RND-HSM-999', 4200.00, 2, 'UNRELEASED: Hardware security module test unit for post-quantum key derivation.', 0),
      ('YubiShield Dual-Band NFC', 'Hardware Security', 'HW-SEC-105', 65.00, 210, 'Ruggedized USB-C and NFC physical security key for enterprise SSO.', 1);

    INSERT INTO lab_feedback (author_name, feedback_type, message, rating, submitted_at)
    VALUES
      ('Security Lead Jane', 'Feature Request', 'Would love to see support for WebAuthn passkeys in the next firmware revision.', 5, '${now}'),
      ('DevOps Tyler', 'Bug Report', 'Occasional timeout when exporting high-volume packet captures over USB 3.0.', 4, '${now}'),
      ('Pentester Max', 'Security Commendation', 'Clean parameterized endpoints prevent query leakage. Well architected!', 5, '${now}');

    INSERT INTO lab_secrets (service_name, token_value, confidentiality_level, notes)
    VALUES
      ('SYNTHETIC_VAULT_FLAG', 'FLAG{sqli_union_data_exfiltration_success_2026}', 'TOP_SECRET', 'Synthetic capture-the-flag reward for successfully executing UNION-based exfiltration in the lab.'),
      ('INTERNAL_BACKUP_S3', 's3://synthetic-backups-securelab-restricted/db-dump-2026.sql', 'CONFIDENTIAL', 'Synthetic internal storage identifier for error-based discovery testing.'),
      ('RESTRICTED_AUTH_TOKEN', 'tok_synthetic_educational_only_8492018302', 'RESTRICTED', 'Synthetic API key demonstrating cross-table leak prevention.');
  `);

  console.log('SecureLab database schema and synthetic seed data initialized successfully.');
}

export async function resetDatabase() {
  const db = await getDb();
  await initSchemaAndSeed(db);
  saveDb();
  return { success: true, message: 'Database reset and re-seeded with synthetic lab data successfully.' };
}
