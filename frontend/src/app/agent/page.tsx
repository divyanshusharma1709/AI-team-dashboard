'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { SparklesIcon, BoltIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type AgentStatus = 'idle' | 'pending' | 'complete' | 'failed';

interface EvidenceItem {
  collection: 'tasks' | 'employees' | 'meetings' | string;
  id?: string;
  score: number;
  preview: Record<string, unknown>;
}

interface AgentResult {
  answer: string;
  confidence: number;
  query_type: string;
  kpis: {
    total_tasks?: number;
    total_employees?: number;
    completion_rate?: number;
    overdue_tasks?: number;
    in_progress_tasks?: number;
  };
  evidence: EvidenceItem[];
  follow_ups: string[];
  risk_flags: string[];
}

const POLLING_INTERVAL = 2500;
const DEFAULT_RESULT: AgentResult = {
  answer: '',
  confidence: 0,
  query_type: 'task-related',
  kpis: {},
  evidence: [],
  follow_ups: [],
  risk_flags: [],
};

const EXAMPLE_QUERIES = [
  'Who is overloaded with tasks this week?',
  'Give me a risk summary for overdue tasks and owners.',
  'What is the completion rate and where are bottlenecks?',
  'Show me all in-progress tasks in Engineering.',
  'Which tasks are overdue and not assigned?'
];

export default function AgentPage() {
  const [query, setQuery] = useState('');
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [result, setResult] = useState<AgentResult>(DEFAULT_RESULT);
  const [errorText, setErrorText] = useState('');

  const pipelineStep = useMemo(() => {
    if (status !== 'pending') return '';
    const steps = ['Retrieving team context', 'Ranking evidence', 'Generating decision-ready answer'];
    return steps[Math.floor((Date.now() / 1400) % steps.length)];
  }, [status]);

  const resetState = () => {
    setResult(DEFAULT_RESULT);
    setErrorText('');
    setJobId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) return;

    resetState();
    setStatus('pending');

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/query`, { query: cleaned });
      setJobId(res.data.jobId);
    } catch (error) {
      setStatus('failed');
      setErrorText('Failed to submit query. Please try again.');
      console.error(error);
    }
  };

  const runQuickPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  useEffect(() => {
    if (!jobId || status !== 'pending') return;

    const poll = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/query-status`, {
          params: { jobId },
        });

        if (res.data.status === 'complete') {
          setStatus('complete');
          const payload = res.data.result;

          if (typeof payload === 'string') {
            setResult({ ...DEFAULT_RESULT, answer: payload });
          } else {
            setResult({
              ...DEFAULT_RESULT,
              ...payload,
              evidence: Array.isArray(payload?.evidence) ? payload.evidence : [],
              follow_ups: Array.isArray(payload?.follow_ups) ? payload.follow_ups : [],
              risk_flags: Array.isArray(payload?.risk_flags) ? payload.risk_flags : [],
            });
          }
        } else if (res.data.status === 'failed') {
          setStatus('failed');
          setErrorText(res.data.error || 'Agent processing failed.');
        }
      } catch (error) {
        setStatus('failed');
        setErrorText('Polling failed while waiting for results.');
        console.error(error);
      }
    };

    const interval = setInterval(poll, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, status]);

  const confidenceText = `${Math.round((result.confidence || 0) * 100)}% confidence`;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-7 shadow-sm">
        <div className="absolute -top-20 -right-24 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-700">
            <SparklesIcon className="h-4 w-4" />
            AI Copilot
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Decision-Ready Team Intelligence</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Ask for workload insights, project risks, or staffing signals. Answers include confidence, supporting records, and follow-up actions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: Summarize overdue tasks by assignee and risk level"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            />
            <button
              type="submit"
              disabled={status === 'pending'}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              <BoltIcon className="h-4 w-4" />
              {status === 'pending' ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => runQuickPrompt(sample)}
                className="rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-800"
              >
                {sample}
              </button>
            ))}
          </div>

          {status === 'pending' && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800">
              <MagnifyingGlassIcon className="h-4 w-4 animate-pulse" />
              {pipelineStep}
            </div>
          )}
        </div>
      </section>

      {(status === 'complete' || status === 'failed') && (
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Agent Answer</h2>
              {status === 'complete' && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{confidenceText}</span>
              )}
            </div>

            {status === 'failed' ? (
              <p className="text-sm text-rose-700">{errorText}</p>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{result.answer}</p>
            )}

            {result.risk_flags.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Risk Flags
                </div>
                <ul className="space-y-1 text-sm text-amber-800">
                  {result.risk_flags.map((flag) => (
                    <li key={flag}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.follow_ups.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Recommended Follow-ups</p>
                <div className="flex flex-wrap gap-2">
                  {result.follow_ups.map((followUp) => (
                    <button
                      key={followUp}
                      type="button"
                      onClick={() => setQuery(followUp)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Context Snapshot</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between"><span>Total Tasks</span><span className="font-semibold">{result.kpis.total_tasks ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Team Members</span><span className="font-semibold">{result.kpis.total_employees ?? 0}</span></div>
                <div className="flex items-center justify-between"><span>Completion</span><span className="font-semibold">{result.kpis.completion_rate ?? 0}%</span></div>
                <div className="flex items-center justify-between"><span>Overdue</span><span className="font-semibold text-rose-700">{result.kpis.overdue_tasks ?? 0}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Top Evidence</p>
              <div className="mt-3 space-y-3">
                {result.evidence.length === 0 && (
                  <p className="text-sm text-slate-500">No evidence returned for this query.</p>
                )}
                {result.evidence.slice(0, 4).map((item) => (
                  <div key={`${item.collection}-${item.id ?? 'unknown'}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="rounded bg-white px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-600">{item.collection}</span>
                      <span className="font-semibold text-cyan-700">score {item.score.toFixed(2)}</span>
                    </div>
                    <p className="text-xs leading-5 text-slate-600">
                      {Object.entries(item.preview)
                        .slice(0, 3)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(' | ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
