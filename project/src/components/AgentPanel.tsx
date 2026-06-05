import { Database, ShieldCheck, Eye, CheckCircle2, XCircle, Loader2, AlertTriangle, DollarSign, Brain, TrendingUp } from 'lucide-react';
import type { AgentState, AgentStatus, DecisionData, DecisionStatus } from '../types';

interface Props {
  agents: AgentState;
  decision: DecisionData | null;
  hasSubmitted: boolean;
  error: string | null;
}

interface AgentCardProps {
  step: number;
  title: string;
  description: string;
  status: AgentStatus;
  icon: React.ReactNode;
}

function AgentCard({ step, title, description, status, icon }: AgentCardProps) {
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <div
      className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
        isIdle
          ? 'border-slate-200 bg-slate-50/50 opacity-50'
          : isRunning
          ? 'border-blue-200 bg-blue-50/60 shadow-sm shadow-blue-100'
          : isComplete
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-red-200 bg-red-50/60'
      }`}
    >
      {/* Step number / status icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          isIdle
            ? 'bg-slate-200 text-slate-400'
            : isRunning
            ? 'bg-blue-100 text-blue-600'
            : isComplete
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-red-100 text-red-600'
        }`}
      >
        {isRunning ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isComplete ? (
          <CheckCircle2 size={16} />
        ) : isError ? (
          <XCircle size={16} />
        ) : (
          <span className="text-xs">{step}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`transition-colors duration-300 ${
              isIdle
                ? 'text-slate-400'
                : isRunning
                ? 'text-blue-600'
                : isComplete
                ? 'text-emerald-600'
                : 'text-red-500'
            }`}
          >
            {icon}
          </span>
          <span
            className={`text-sm font-semibold transition-colors duration-300 ${
              isIdle
                ? 'text-slate-400'
                : isRunning
                ? 'text-blue-800'
                : isComplete
                ? 'text-emerald-800'
                : 'text-red-700'
            }`}
          >
            {title}
          </span>
          {isRunning && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Active
            </span>
          )}
          {isComplete && (
            <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Done
            </span>
          )}
          {isError && (
            <span className="ml-auto text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              Error
            </span>
          )}
        </div>
        <p
          className={`text-xs mt-0.5 transition-colors duration-300 ${
            isIdle ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; glow: string }> = {
  Approved: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: 'border-emerald-600',
    icon: <CheckCircle2 size={18} />,
    glow: 'shadow-emerald-200',
  },
  Denied: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-600',
    icon: <XCircle size={18} />,
    glow: 'shadow-red-200',
  },
  'Flagged for Human Review': {
    bg: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-600',
    icon: <AlertTriangle size={18} />,
    glow: 'shadow-amber-200',
  },
  Flagged: {
    bg: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-600',
    icon: <AlertTriangle size={18} />,
    glow: 'shadow-amber-200',
  },
};

const FALLBACK_CONFIG = {
  bg: 'bg-slate-500',
  text: 'text-white',
  border: 'border-slate-600',
  icon: <AlertTriangle size={18} />,
  glow: 'shadow-slate-200',
};

function DecisionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text} border ${config.border} shadow-lg ${config.glow} font-bold text-sm`}
    >
      {config.icon}
      {status}
    </div>
  );
}

const DECISION_PANEL_COLORS: Record<string, string> = {
  Approved: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
  Denied: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
  'Flagged for Human Review': 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
  Flagged: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
};

function panelColor(status: string) {
  return DECISION_PANEL_COLORS[status] ?? 'border-slate-200 bg-white';
}

function headerIconColor(status: string) {
  if (status === 'Approved') return 'bg-emerald-500';
  if (status === 'Denied') return 'bg-red-500';
  return 'bg-amber-500';
}

function payoutBorderColor(status: string) {
  if (status === 'Approved') return 'bg-white border-emerald-200';
  if (status === 'Denied') return 'bg-white border-red-100';
  return 'bg-white border-amber-100';
}

function payoutIconBg(status: string) {
  if (status === 'Approved') return 'bg-emerald-100';
  if (status === 'Denied') return 'bg-red-100';
  return 'bg-amber-100';
}

function payoutIconColor(status: string) {
  if (status === 'Approved') return 'text-emerald-600';
  if (status === 'Denied') return 'text-red-500';
  return 'text-amber-600';
}

function payoutTextColor(status: string) {
  if (status === 'Approved') return 'text-emerald-700';
  if (status === 'Denied') return 'text-red-600';
  return 'text-amber-700';
}

export default function AgentPanel({ agents, decision, hasSubmitted, error }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Agent execution log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Agent Execution Log</h2>
              <p className="text-xs text-slate-400">Real-time AI processing pipeline</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {!hasSubmitted && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Brain size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Awaiting claim submission</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Fill out the form and click "Submit to AI Agents"
                </p>
              </div>
            </div>
          )}

          {hasSubmitted && (
            <div className="space-y-3">
              <AgentCard
                step={1}
                title="Data Intake Agent"
                description="Parses and normalizes claim fields, validates dates, policy IDs, and claimant identity."
                status={agents.dataIntake}
                icon={<Database size={15} />}
              />
              <AgentCard
                step={2}
                title="Coverage Inspector Agent"
                description="Cross-references policy bounds, exclusions, deductibles, and coverage limits."
                status={agents.coverageInspector}
                icon={<ShieldCheck size={15} />}
              />
              <AgentCard
                step={3}
                title="Fraud Sleuth Agent"
                description="Calculates risk metrics, flags anomalies, and assigns a fraud probability score."
                status={agents.fraudSleuth}
                icon={<Eye size={15} />}
              />

              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg border border-red-200 bg-red-50">
                  <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Webhook Error</p>
                    <p className="text-xs text-red-500 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Final Decision Panel */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-500 ${
          decision
            ? `${panelColor(decision.status)} opacity-100 translate-y-0`
            : 'border-slate-200 bg-white opacity-60'
        }`}
      >
        <div className="px-6 py-4 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500 ${
                decision ? headerIconColor(decision.status) : 'bg-slate-300'
              }`}
            >
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Final Decision Panel</h2>
              <p className="text-xs text-slate-400">
                {decision ? 'AI adjudication complete' : 'Awaiting agent pipeline completion'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!decision ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <ShieldCheck size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No decision yet</p>
              <p className="text-xs text-slate-300">
                Decision will appear once all agents complete
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <DecisionStatusBadge status={decision.status} />
              </div>

              {decision.payoutAmount !== undefined && decision.payoutAmount !== null && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${payoutBorderColor(decision.status)}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payoutIconBg(decision.status)}`}>
                    <DollarSign size={18} className={payoutIconColor(decision.status)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total Approved Payout
                    </p>
                    <p className={`text-2xl font-bold ${payoutTextColor(decision.status)}`}>
                      {typeof decision.payoutAmount === 'number'
                        ? `$${decision.payoutAmount.toLocaleString()}`
                        : decision.payoutAmount}
                    </p>
                  </div>
                </div>
              )}

              {decision.reasoning && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Brain size={12} />
                    AI Reasoning
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 leading-relaxed">
                    {decision.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
