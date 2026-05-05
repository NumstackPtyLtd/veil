export interface ExtractedEntity {
  value: string;
  type: EntityType;
  start: number;
  end: number;
}

export type EntityType =
  | "person"
  | "organization"
  | "place"
  | "email"
  | "phone"
  | "account_number"
  | "id_number"
  | "date"
  | "custom";

export interface StoredEntity {
  id: string;
  realValue: string;
  entityType: EntityType;
  encryptedAvatar: string;
  metadata?: Record<string, unknown>;
}

export interface VectorMatch {
  entity: StoredEntity;
  score: number;
}

export interface EncryptionResult {
  originalText: string;
  veiled: string;
  mappings: EntityMapping[];
}

export interface EntityMapping {
  original: string;
  replacement: string;
  entityType: EntityType;
  matchScore: number;
  source: "vector" | "ner";
}

export interface DecryptionResult {
  veiledText: string;
  unveiled: string;
  mappings: EntityMapping[];
}

export interface ConfidenceThresholds {
  autoMatch: number;
  probableMatch: number;
  uncertainMatch: number;
}

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  autoMatch: 0.95,
  probableMatch: 0.85,
  uncertainMatch: 0.7,
};

export interface PatternRule {
  id: string;
  name: string;
  pattern: string;
  entityType: EntityType;
  enabled: boolean;
}

export interface TenantConfig {
  tenantId: string;
  patterns: PatternRule[];
  thresholds: ConfidenceThresholds;
  labelOverrides: Record<string, string>;
}

export const DEFAULT_PATTERNS: PatternRule[] = [
  {
    id: "policy-number",
    name: "Policy Number",
    pattern: "POL-\\d{4,10}",
    entityType: "account_number",
    enabled: true,
  },
  {
    id: "sa-id-number",
    name: "SA ID Number",
    pattern: "\\b\\d{13}\\b",
    entityType: "id_number",
    enabled: true,
  },
  {
    id: "credit-card",
    name: "Credit Card",
    pattern: "\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b",
    entityType: "account_number",
    enabled: true,
  },
  {
    id: "email",
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    entityType: "email",
    enabled: true,
  },
  {
    id: "phone-intl",
    name: "Phone (International)",
    pattern: "\\+?\\d{1,3}[- ]?\\(?\\d{1,4}\\)?[- ]?\\d{1,4}[- ]?\\d{1,9}",
    entityType: "phone",
    enabled: true,
  },
];
