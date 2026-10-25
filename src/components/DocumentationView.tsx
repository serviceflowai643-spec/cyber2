import React from 'react';
import { BookOpen, ShieldCheck, AlertTriangle, Database, Lock, Server, Cpu, FileCheck } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-xs font-sans">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-blue-400 font-mono text-[11px] font-semibold">
          <BookOpen className="w-4 h-4" />
          SYSTEM SPECIFICATION & SECURITY BOUNDARY MATRIX
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
          SecureLab Security Model & Architecture Manual
        </h1>
        <p className="text-slate-400 mt-1 leading-relaxed">
          Technical documentation outlining the structural separation between production-style defensive systems and isolated educational vulnerability sandboxes.
        </p>
      </div>

      {/* Component Security Classification Matrix */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          1. Component Classification & Security Boundary Matrix
        </h2>

        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Component / Module</th>
                <th className="p-3.5">Security Posture</th>
                <th className="p-3.5">Database Target</th>
                <th className="p-3.5">Defensive Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-3.5 font-semibold text-white">
                  Authentication & Sessions (<code className="text-blue-400 font-mono">/api/auth/*</code>)
                </td>
                <td className="p-3.5">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">SECURE BY DEFAULT</span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">users</td>
                <td className="p-3.5 text-slate-400">
                  Strict parameterized queries, bcrypt password hashing, cryptographic session tokens, rate limiting (20/min).
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">
                  Forum Discussions (<code className="text-blue-400 font-mono">/api/posts/*</code>)
                </td>
                <td className="p-3.5">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">SECURE BY DEFAULT</span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">posts</td>
                <td className="p-3.5 text-slate-400">
                  Prepared statement bind placeholders (<code className="text-blue-300 font-mono">?</code>) for search patterns and filter tags.
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">
                  Thread Comments (<code className="text-blue-400 font-mono">/api/comments/*</code>)
                </td>
                <td className="p-3.5">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">SECURE BY DEFAULT</span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">comments</td>
                <td className="p-3.5 text-slate-400">
                  Parameterized INSERT/UPDATE; ownership validation on edit/delete; safe HTML rendering.
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">
                  Administrator Console (<code className="text-blue-400 font-mono">/api/admin/*</code>)
                </td>
                <td className="p-3.5">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">SECURE BY DEFAULT</span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">users, audit_logs</td>
                <td className="p-3.5 text-slate-400">
                  Strict server-side RBAC validation (<code className="text-blue-300 font-mono">requireAdmin</code>); immutable audit trails for every admin event.
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white">
                  Training Lab Sandbox (<code className="text-amber-400 font-mono">/api/lab/execute</code>)
                </td>
                <td className="p-3.5">
                  <span className="text-amber-400 font-mono text-[10px] font-bold">DUAL / CONTROLLED ISOLATION</span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-slate-400">lab_accounts, lab_products, lab_secrets</td>
                <td className="p-3.5 text-slate-400">
                  Allows students to compare raw string concatenation vs parameterized binding on synthetic records. DDL commands and access to production tables are forbidden.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Security Controls in Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Database className="w-4 h-4 text-blue-400" />
            Query Parameterization & AST Compilation
          </div>
          <p className="text-slate-400 leading-relaxed">
            In dynamic SQL (<code className="text-red-400 font-mono">"WHERE name = '" + input + "'"</code>), the database lexer interprets quotes and SQL operators within user data. With parameterized statements, the SQL grammar is parsed into an Abstract Syntax Tree (AST) before user parameters are bound, guaranteeing that inputs are treated strictly as data literals.
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-4 h-4 text-blue-400" />
            Authentication & Role-Based Access Control
          </div>
          <p className="text-slate-400 leading-relaxed">
            Passwords are encrypted using salted bcrypt hashing. Sessions are maintained via cryptographically random 256-bit bearer tokens. Administrative privileges are verified on the server for each request—ordinary users cannot gain elevated permissions through modified request bodies.
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Server className="w-4 h-4 text-blue-400" />
            Sliding-Window Rate Limiting
          </div>
          <p className="text-slate-400 leading-relaxed">
            Sensitive endpoints (e.g., authentication login, post search) enforce sliding-window rate limits by IP address. Exceeded quotas result in an HTTP 429 response and trigger immediate logging in the security audit trail.
          </p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Cpu className="w-4 h-4 text-blue-400" />
            WASM Linear-Memory Containment
          </div>
          <p className="text-slate-400 leading-relaxed">
            The SQLite database engine executes in isolated WebAssembly linear memory. Even during vulnerable query simulation, operations cannot access local file paths, host network sockets, or OS process primitives outside the designated SQLite buffer.
          </p>
        </div>
      </div>

      {/* Pre-Seeded Laboratory Test Accounts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-amber-400" />
          Pre-Seeded Laboratory Test Credentials
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-amber-400 font-bold block">Administrator</span>
            <div className="text-slate-300 mt-1">Username: <span className="text-white font-semibold">admin</span></div>
            <div className="text-slate-300">Password: <span className="text-white font-semibold">DevSecAdmin2026!</span></div>
            <div className="text-slate-500 text-[10px] mt-1 font-sans">Full user & database moderation rights</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-blue-400 font-bold block">Security Practitioner</span>
            <div className="text-slate-300 mt-1">Username: <span className="text-white font-semibold">sarah_sec</span></div>
            <div className="text-slate-300">Password: <span className="text-white font-semibold">SarahSec#2026</span></div>
            <div className="text-slate-500 text-[10px] mt-1 font-sans">Standard user privileges</div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-slate-400 font-bold block">Software Engineer</span>
            <div className="text-slate-300 mt-1">Username: <span className="text-white font-semibold">alex_dev</span></div>
            <div className="text-slate-300">Password: <span className="text-white font-semibold">AlexDev#2026</span></div>
            <div className="text-slate-500 text-[10px] mt-1 font-sans">Standard user privileges</div>
          </div>
        </div>
      </div>

    </div>
  );
};
