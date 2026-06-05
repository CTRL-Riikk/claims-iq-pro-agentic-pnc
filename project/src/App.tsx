import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import ClaimForm from './components/ClaimForm';
import AgentPanel from './components/AgentPanel';
import type { FormData, AgentState, DecisionData } from './types';

const WEBHOOK_URL = 'https://rikkkkkkkkkkkkk.app.n8n.cloud/webhook-test/process-pc-claim';

const SCENARIO_A: FormData = {
  claimantName: 'Jane Smith',
  policyNumber: 'P-9921',
  incidentDate: '2026-06-01',
  claimType: 'Auto Collision',
  details:
    'Rear-ended at a red light on Main St. The other driver failed to stop. Vehicle sustained significant rear-end damage. Repair quote attached.',
};

const SCENARIO_B: FormData = {
  claimantName: 'Mark Jones',
  policyNumber: 'P-1140',
  incidentDate: '2026-05-15',
  claimType: 'Property Damage',
  details:
    'Claims tree fell on garage during storm, but metal on gutters shows historic rust and prior damage inconsistent with a recent event.',
};

const EMPTY_FORM: FormData = {
  claimantName: '',
  policyNumber: '',
  incidentDate: '',
  claimType: '',
  details: '',
};

const IDLE_AGENTS: AgentState = {
  dataIntake: 'idle',
  coverageInspector: 'idle',
  fraudSleuth: 'idle',
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parseWebhookResponse(data: unknown): DecisionData {
  // Case 1: well-formed structured object
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    // Unwrap n8n envelope keys like { output: "..." } or { text: "..." }
    const raw =
      typeof obj.output === 'string'
        ? obj.output
        : typeof obj.text === 'string'
        ? obj.text
        : null;

    if (raw) {
      return parseTextToDecision(raw);
    }

    // Has explicit structured keys — use them directly
    if (obj.status || obj.reasoning) {
      return {
        status: typeof obj.status === 'string' ? obj.status : deriveStatus(String(obj.reasoning ?? '')),
        payoutAmount: obj.payoutAmount ?? obj.payout_amount ?? obj.amount ?? '',
        reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : JSON.stringify(obj),
      };
    }

    // Fallback: treat the whole object stringified as reasoning
    return parseTextToDecision(JSON.stringify(obj));
  }

  // Case 2: plain string response
  if (typeof data === 'string') {
    return parseTextToDecision(data);
  }

  // Case 3: array (n8n sometimes wraps in an array)
  if (Array.isArray(data) && data.length > 0) {
    return parseWebhookResponse(data[0]);
  }

  return { status: 'Flagged for Human Review', payoutAmount: '', reasoning: String(data) };
}

function deriveStatus(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('approved') || t.includes('approve')) return 'Approved';
  if (t.includes('denied') || t.includes('deny') || t.includes('rejected')) return 'Denied';
  return 'Flagged for Human Review';
}

function parseTextToDecision(text: string): DecisionData {
  // Try to extract a payout amount from the text (e.g. "$4,200" or "4200")
  const amountMatch = text.match(/\$[\d,]+(?:\.\d{2})?|\b\d{3,}(?:,\d{3})*(?:\.\d{2})?\b/);
  const payoutAmount = amountMatch ? amountMatch[0] : '';

  return {
    status: deriveStatus(text),
    payoutAmount,
    reasoning: text,
  };
}

export default function App() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [agents, setAgents] = useState<AgentState>(IDLE_AGENTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<DecisionData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setHasSubmitted(true);
    setDecision(null);
    setError(null);
    setAgents({ dataIntake: 'running', coverageInspector: 'idle', fraudSleuth: 'idle' });

    const fetchPromise = fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    await delay(1500);
    setAgents({ dataIntake: 'complete', coverageInspector: 'running', fraudSleuth: 'idle' });

    await delay(1500);
    setAgents({ dataIntake: 'complete', coverageInspector: 'complete', fraudSleuth: 'running' });

    await delay(1000);

    try {
      const response = await fetchPromise;
      if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') ?? '';
      let raw: unknown;
      if (contentType.includes('application/json')) {
        raw = await response.json();
      } else {
        raw = await response.text();
      }

      setAgents({ dataIntake: 'complete', coverageInspector: 'complete', fraudSleuth: 'complete' });
      setDecision(parseWebhookResponse(raw));
    } catch (err) {
      setAgents((prev) => ({ ...prev, fraudSleuth: 'error' }));
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">ClaimsIQ Pro</h1>
              <p className="text-xs text-slate-400 leading-tight">
                P&amp;C Insurance Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systems Online
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              Adjuster Portal
            </span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4 text-xs text-slate-400">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">New Claim Submission</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">AI-Assisted Claims Processing</h2>
          <p className="text-sm text-slate-500 mt-1">
            Submit a new claim to run it through the three-agent adjudication pipeline and receive
            an instant decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ClaimForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onScenarioA={() => setFormData(SCENARIO_A)}
            onScenarioB={() => setFormData(SCENARIO_B)}
            isSubmitting={isSubmitting}
          />
          <AgentPanel
            agents={agents}
            decision={decision}
            hasSubmitted={hasSubmitted}
            error={error}
          />
        </div>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            &copy; 2026 ClaimsIQ Pro &mdash; Powered by Multi-Agent AI
          </p>
          <p className="text-xs text-slate-300">v2.4.1</p>
        </div>
      </footer>
    </div>
  );
}
