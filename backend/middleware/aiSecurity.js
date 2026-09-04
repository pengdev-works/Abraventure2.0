// AI Security Guard: Prompt Injection Prevention, Secrets Masking, & Output Validation

const DANGEROUS_INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /override\s+system\s+prompt/i,
  /reveal\s+secret/i,
  /show\s+password/i,
  /dump\s+database/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /select\s+\*\s+from\s+user_accounts/i,
  /exec\s*\(/i,
  /eval\s*\(/i,
];

const SECRET_PATTERNS = [
  /eyJ[A-Za-z0-9-_=]*(\.[A-Za-z0-9-_=]+)*/g, // JWT Tokens & Headers
  /sk-[A-Za-z0-9]{20,}/g, // API Keys
  /postgres:\/\/[^:]+:[^@]+@[^/]+\/[^\s]+/g, // Database URLs
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email PII
];

/**
 * Validates incoming text against prompt injection attempts.
 * Returns { safe: boolean, error?: string }
 */
export const validateAiInput = (text) => {
  if (typeof text !== 'string') return { safe: true };

  for (const pattern of DANGEROUS_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        error: 'Security Warning: Input contains disallowed instruction patterns or prompt injection attempts.'
      };
    }
  }

  return { safe: true };
};

/**
 * Mask sensitive credentials and secrets from text before logging or processing.
 */
export const maskSecretsAndPii = (text) => {
  if (typeof text !== 'string') return text;
  let masked = text;
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, '[REDACTED_SECRET]');
  }
  return masked;
};

/**
 * Validates AI output before returning to client to ensure no raw code/SQL or sensitive tokens leaked.
 */
export const sanitizeAiOutput = (output) => {
  if (typeof output !== 'string') return output;

  // Block execution tags or raw database queries in output
  const cleanOutput = output
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/DROP\s+TABLE/gi, '')
    .replace(/DELETE\s+FROM/gi, '');

  return maskSecretsAndPii(cleanOutput);
};
