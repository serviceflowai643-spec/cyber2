export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
  avatarSeed: string;
  bio?: string;
  reputation: number;
  createdAt: string;
}

export interface Post {
  id: number;
  author_id: number;
  author_username: string;
  author_display_name: string;
  author_avatar_seed: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  excerpt?: string;
  views: number;
  likes_count: number;
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  author_username: string;
  author_display_name: string;
  author_avatar_seed: string;
  author_role: 'admin' | 'user';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor_username: string;
  action: string;
  ip_address: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  details: string;
}

export interface LabScenario {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  description: string;
  context: string;
  vulnerableCodeSnippet: string;
  secureCodeSnippet: string;
  defaultPayload: string;
  samplePayloads: { label: string; value: string; hint: string }[];
  targetTable: string;
  remediationGuide: string;
}

export interface LabExecutionResult {
  mode: 'vulnerable' | 'secure';
  scenarioId: string;
  constructedSql: string;
  boundParameters: any[] | null;
  executionTimeMs: number;
  rowCount: number;
  rows: any[];
  error: string | null;
  isExploitSuccessful: boolean;
  educationalVerdict: string;
}

export interface SecurityTestCase {
  testId: string;
  name: string;
  vulnerabilityType: string;
  payload: string;
  vulnerableBehavior: string;
  secureBehavior: string;
  status: 'PASSED' | 'FAILED';
  explanation: string;
}

export interface SecurityTestSuiteResult {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    timestamp: string;
  };
  tests: SecurityTestCase[];
}
