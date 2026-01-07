const SENSITIVE_PATTERNS = [
  /api[_-]?key[s]?[:\s=]+['"]?([a-zA-Z0-9_\-]{20,})['"]/gi,
  /password[:\s=]+['"]?([^'"\\s]+)['"]/gi,
  /secret[:\s=]+['"]?([^'"\\s]+)['"]/gi,
  /token[:\s=]+['"]?([a-zA-Z0-9_\-\\.]{20,})['"]/gi,
  /bearer\s+([a-zA-Z0-9_\-\\.]+)/gi,
  /AKIA[0-9A-Z]{16}/gi,
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi
];

export function sanitizeContent(content: string): string {
  let sanitized = content;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, captured) => {
      if (captured) {
        return match.replace(captured, '[REDACTED]');
      }
      return '[REDACTED]';
    });
  }
  return sanitized;
}

export function hasSensitiveData(content: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(content));
}