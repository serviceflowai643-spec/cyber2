import React, { useState, useEffect } from 'react';
import { Terminal, Shield, AlertTriangle, Play, RefreshCw, CheckCircle, HelpCircle, Code, Database, Clock, ArrowRight } from 'lucide-react';
import { LabScenario, LabExecutionResult } from '../types.js';
import { api } from '../lib/api.js';

export const LabConsole: React.FC = () => {
  const [scenarios, setScenarios] = useState<LabScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<LabScenario | null>(null);
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<LabExecutionResult | null>(null);
  const [resettingDb, setResettingDb] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const data = await api.getLabScenarios();
        setScenarios(data.scenarios || []);
        if (data.scenarios && data.scenarios.length > 0) {
          setSelectedScenario(data.scenarios[0]);
          setPayload(data.scenarios[0].defaultPayload);
        }
      } catch (e) {
        console.error('Failed to load lab scenarios:', e);
      }
    }
    loadScenarios();
  }, []);

  const handleSelectScenario = (s: LabScenario) => {
    setSelectedScenario(s);
    setPayload(s.defaultPayload);
    setExecutionResult(null);
  };

  const handleExecute = async (mode: 'vulnerable' | 'secure') => {
    if (!selectedScenario) return;
    setLoading(true);
    setExecutionResult(null);
    try {
      const res = await api.executeLabQuery({
        scenarioId: selectedScenario.id,
        mode,
        payload,
      });
      setExecutionResult(res);
    } catch (err: any) {
      console.error('Execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetLabTables = async () => {
    setResettingDb(true);
    setResetSuccess(null);
    try {
      await api.resetDatabase();
      setResetSuccess('Lab tables and synthetic flags reseeded successfully.');
      setTimeout(() => setResetSuccess(null), 3500);
      setExecutionResult(null);
    } catch (e: any) {
      alert(e.message || 'Reset failed');
    } finally {
      setResettingDb(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Lab Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-[11px] font-semibold">
              ISOLATED TRAINING ENVIRONMENT
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">
              SYNTHETIC DATA ONLY
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            SQL Injection Educational Testing Lab
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Test and contrast vulnerable dynamic SQL query compilation against secure prepared statements across 4 realistic vulnerability classes. All queries run in isolated synthetic tables without access to host files or live user accounts.
          </p>
        </div>

        <button
          onClick={handleResetLabTables}
          disabled={resettingDb}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${resettingDb ? 'animate-spin' : ''}`} />
          <span>{resettingDb ? 'Reseeding Tables...' : 'Reset Lab Database'}</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map(s => {
          const isSelected = selectedScenario?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelectScenario(s)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-md shadow-blue-950/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span className={isSelected ? 'text-blue-300 font-semibold' : 'text-slate-400'}>
                    {s.difficulty}
                  </span>
                  <span className="text-slate-500">{s.type}</span>
                </div>
                <h3 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {s.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Target: {s.targetTable}</span>
                {isSelected && <span className="text-blue-400 font-bold">ACTIVE</span>}
              </div>
            </button>
          );
        })}
      </div>

      {selectedScenario && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Playground & Payload Builder (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Scenario Context Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  Scenario Scenario Context & Target Objective
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedScenario.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedScenario.context}
              </p>
            </div>

            {/* Payload Editor & Execution Trigger */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  SQL Injection Payload Input
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Target: {selectedScenario.targetTable}
                </span>
              </div>

              <textarea
                rows={3}
                value={payload}
                onChange={e => setPayload(e.target.value)}
                placeholder="Enter SQL injection payload or string..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />

              {/* Sample Payloads Cheat Sheet */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-mono block">
                  Quick Educational Payload Presets:
                </span>
                <div className="space-y-1">
                  {selectedScenario.samplePayloads.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPayload(sample.value)}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors group flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-[11px] font-semibold text-blue-300 group-hover:text-blue-200">
                          {sample.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-md">
                          {sample.value}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-sans shrink-0 mt-0.5">
                        {sample.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Execution Controls */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecute('vulnerable')}
                  className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-500 text-red-300 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Execute Vulnerable Query</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecute('secure')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-900/30"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-200" />
                  <span>Execute Parameterized (Secure)</span>
                </button>
              </div>

            </div>

            {/* Side-by-Side Code Architecture Comparison */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code className="w-4 h-4 text-blue-400" />
                Backend Code Implementation Comparison
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-1.5">
                  <span className="text-red-400 font-semibold block text-[10px]">
                    INSECURE PATTERN (STRING CONCATENATION)
                  </span>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-tight overflow-x-auto">
                    {selectedScenario.vulnerableCodeSnippet}
                  </pre>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1.5">
                  <span className="text-emerald-400 font-semibold block text-[10px]">
                    SECURE REMEDIATION (PREPARED STATEMENT)
                  </span>
                  <pre className="text-slate-300 whitespace-pre-wrap leading-tight overflow-x-auto">
                    {selectedScenario.secureCodeSnippet}
                  </pre>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 leading-relaxed font-sans">
                <strong className="text-slate-200">Defense Mechanism: </strong>
                {selectedScenario.remediationGuide}
              </div>
            </div>

          </div>

          {/* Right Column: Live Query Inspector & Execution Results (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  Query Execution Inspector
                </h3>
                {executionResult && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="tabular-nums font-semibold">{executionResult.executionTimeMs}</span> ms
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Parsing SQL query tree & executing...</p>
                </div>
              ) : !executionResult ? (
                <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                  <Terminal className="w-8 h-8 text-slate-700 mx-auto" />
                  <p>Select a scenario and click either <strong>Execute Vulnerable</strong> or <strong>Execute Parameterized</strong> to inspect runtime behavior.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  
                  {/* Verdict Badge Card */}
                  <div className={`p-3.5 rounded-lg border leading-relaxed ${
                    executionResult.mode === 'vulnerable'
                      ? (executionResult.isExploitSuccessful
                          ? 'bg-red-500/10 border-red-500/40 text-red-300'
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-300')
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <div className="font-semibold text-xs mb-1">
                      {executionResult.mode === 'vulnerable' ? 'Vulnerable Execution Path' : 'Parameterized Execution Path'}
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      {executionResult.educationalVerdict}
                    </div>
                  </div>

                  {/* Constructed SQL */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      Constructed SQL Statement:
                    </span>
                    <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 whitespace-pre-wrap leading-tight break-all">
                      {executionResult.constructedSql}
                    </pre>
                  </div>

                  {/* Bound Parameters (if parameterized) */}
                  {executionResult.boundParameters && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Bound Parameter Literals:
                      </span>
                      <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
                        {JSON.stringify(executionResult.boundParameters, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Output if thrown */}
                  {executionResult.error && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-red-400 block">
                        Database Engine Error:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/60 text-[11px] font-mono text-red-300 whitespace-pre-wrap">
                        {executionResult.error}
                      </pre>
                    </div>
                  )}

                  {/* Returned Rows Table */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Result Set ({executionResult.rowCount} rows):</span>
                    </div>

                    {executionResult.rows.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-500 text-[11px]">
                        Zero records returned. Query matched 0 rows.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-x-auto max-h-56">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                              {Object.keys(executionResult.rows[0]).map(col => (
                                <th key={col} className="p-2 font-medium">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {executionResult.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                {Object.values(row).map((val: any, cIdx) => (
                                  <td key={cIdx} className="p-2 truncate max-w-[140px]">
                                    {String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
