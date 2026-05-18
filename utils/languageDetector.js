const PYTHON_RULES = [/\bdef\s+/i, /print\s*\(/i, /\belif\b/i, /\bimport\b/i, /\bclass\b/i, /\blambda\b/i];
const CPP_RULES = [/cout/i, /cin/i, /#include\s*<iostream>/i, /\bstd::/i, /::/];
const C_RULES = [/printf\s*\(/i, /scanf\s*\(/i, /#include\s*<stdio\.h>/i, /int\s+main\s*\(/i];

export function detectLanguage(code = '') {
  const source = String(code || '');

  if (matchesAny(source, CPP_RULES)) {
    return { language: 'cpp', displayName: 'C++' };
  }

  if (matchesAny(source, C_RULES)) {
    return { language: 'c', displayName: 'C' };
  }

  if (matchesAny(source, PYTHON_RULES)) {
    return { language: 'python', displayName: 'Python' };
  }

  return { language: 'unknown', displayName: 'Unknown' };
}

function matchesAny(source, rules) {
  return rules.some((rule) => rule.test(source));
}
