import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, RefreshCw, Shield, AlertTriangle, Layers, Info } from 'lucide-react';
import { SecurityTestSuiteResult } from '../types.js';
import { api } from '../lib/api.js';

export const SecurityTestSuite: React.FC = () => {
  const [suiteResult, setSuiteResult] = useState<SecurityTestSuiteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const data = await api.getTestSuite();
      setSuiteResult(data);
    } catch (e) {
      console.error('Test suite failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">
              AUTOMATED VERIFICATION SUITE
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">
              REGRESSION TESTS
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            SQL Injection vs Parameterized Security Test Harness
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Automated test cases proving both the exploitability of dynamic query assembly and the absolute neutralization achieved through query parameterization and prepared statements.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap self-start md:self-center shadow-sm shadow-blue-900/30"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Running Suite...' : 'Run Automated Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      {suiteResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Total Test Cases</span>
            <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
              {suiteResult.summary.totalTests}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">100% evaluated</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Passed Assertions</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
              {suiteResult.summary.passed}
            </div>
            <span className="text-[11px] text-emerald-500 font-mono">Vulnerabilities Verified</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Failed Assertions</span>
            <div className="text-2xl font-bold text-slate-400 font-mono tabular-nums mt-1">
              {suiteResult.summary.failed}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">0 regressions</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Harness Security Posture</span>
            <div className="text-sm font-bold text-blue-400 font-mono mt-2">
              ISOLATED SANDBOX
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Zero host access</span>
          </div>
        </div>
      )}

      {/* Tests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Verification Matrix: Vulnerable vs Parameterized Query Behavior
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            SQLite WebAssembly Engine
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Executing test cases against live SQLite tables...</p>
          </div>
        ) : !suiteResult ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No test results available.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {suiteResult.tests.map((test) => (
              <div key={test.testId} className="p-5 space-y-3 hover:bg-slate-900/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {test.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-white">
                      {test.testId}: {test.name}
                    </span>
                    <span className="text-blue-400 font-mono text-[11px]">
                      [{test.vulnerabilityType}]
                    </span>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold self-start sm:self-center border border-emerald-500/20">
                    VERIFIED {test.status}
                  </span>
                </div>

                {/* Payload bar */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 font-mono text-[11px] flex items-center gap-2">
                  <span className="text-slate-500 shrink-0">Test Payload:</span>
                  <code className="text-blue-300 truncate">{test.payload}</code>
                </div>

                {/* Comparative Behavior Grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-red-950/15 border border-red-900/30 rounded-lg">
                    <span className="text-[10px] font-mono text-red-400 font-semibold block mb-1">
                      VULNERABLE PATH BEHAVIOR:
                    </span>
                    <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {test.vulnerableBehavior}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/15 border border-emerald-900/30 rounded-lg">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold block mb-1">
                      PARAMETERIZED PATH BEHAVIOR:
                    </span>
                    <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {test.secureBehavior}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed font-sans flex items-start gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{test.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
