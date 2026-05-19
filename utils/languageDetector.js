const PYTHON_RULES = [/^\s*def\s+/m, /^\s*class\s+/m, /\bprint\s*\(/i, /\belif\b/i, /\bimport\b/i, /\bfrom\s+\w+\s+import\b/i, /:\s*$/m, /\blambda\b/i];
const CPP_RULES = [/\bcout\s*<</i, /\bcin\s*>>/i, /#include\s*<iostream>/i, /\bstd::/i, /using\s+namespace\s+std\b/i, /\bclass\s+\w+/i, /::/];
const C_RULES = [/\bprintf\s*\(/i, /\bscanf\s*\(/i, /#include\s*<stdio\.h>/i, /#include\s*<stdlib\.h>/i, /\bint\s+main\s*\(/i, /\bmalloc\s*\(/i, /\bfree\s*\(/i];

export function detectLanguage(code = '') {
  const source = String(code || '');
  const hasCppSignals = matchesAny(source, CPP_RULES);
  const hasCSignals = matchesAny(source, C_RULES);
  const hasPythonSignals = matchesAny(source, PYTHON_RULES);

  if (hasCppSignals) {
    return { language: 'cpp', displayName: 'C++' };
  }

  if (hasCSignals && !hasCppSignals) {
    return { language: 'c', displayName: 'C' };
  }

  if (hasPythonSignals) {
    return { language: 'python', displayName: 'Python' };
  }

  return { language: 'unknown', displayName: 'Unknown' };
}

function matchesAny(source, rules) {
  return rules.some((rule) => rule.test(source));
}
