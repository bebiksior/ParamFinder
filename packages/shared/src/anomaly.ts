export interface ResponseComparison {
  same_code?: number | null;
  same_body?: string | null;
  same_plaintext?: string | null;
  lines_num?: number | null;
  lines_diff?: string[] | null;
  same_headers?: string[] | null;
  same_redirect?: string | null;
  param_missing?: string[] | null;
  same_value_count?: number | null;
}

export interface AnomalyResult {
  anomaly: string;
  rule: string;
  additionalInfo?: string;
}
