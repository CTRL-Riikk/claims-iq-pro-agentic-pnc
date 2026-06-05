export type ClaimType = 'Auto Collision' | 'Property Damage' | '';

export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

export type DecisionStatus = 'Approved' | 'Denied' | 'Flagged for Human Review';

export interface FormData {
  claimantName: string;
  policyNumber: string;
  incidentDate: string;
  claimType: ClaimType;
  details: string;
}

export interface AgentState {
  dataIntake: AgentStatus;
  coverageInspector: AgentStatus;
  fraudSleuth: AgentStatus;
}

export interface DecisionData {
  status: string;
  payoutAmount: string | number;
  reasoning: string;
}
