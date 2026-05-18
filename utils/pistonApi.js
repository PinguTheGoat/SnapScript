const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_MAP = {
  python: { piston: 'python', version: '*', fileName: 'main.py' },
  c: { piston: 'c', version: '*', fileName: 'main.c' },
  cpp: { piston: 'cpp', version: '*', fileName: 'main.cpp' },
};

export async function checkSyntax(code, language) {
  const languageConfig = LANGUAGE_MAP[language];

  if (!languageConfig) {
    return { errors: [], warnings: [], all: [] };
  }

  try {
    const response = await fetch(PISTON_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: languageConfig.piston,
        version: languageConfig.version,
        files: [{ name: languageConfig.fileName, content: code }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Piston request failed with status ${response.status}`);
    }

    const data = await response.json();
    const stderr = [data?.compile?.stderr, data?.run?.stderr, data?.compile?.output, data?.run?.output].filter(Boolean).join('\n');
    const exitCode = Number(data?.run?.code ?? data?.compile?.code ?? 0);

    return parseDiagnostics(stderr, exitCode);
  } catch (error) {
    return {
      errors: [
        {
          type: 'error',
          line: 1,
          title: 'Piston unavailable',
          description: 'SnapScript could not reach the free Piston API for syntax analysis.',
        },
      ],
      warnings: [],
      all: [
        {
          type: 'error',
          line: 1,
          title: 'Piston unavailable',
          description: 'SnapScript could not reach the free Piston API for syntax analysis.',
        },
      ],
    };
  }
}

function parseDiagnostics(stderr, exitCode) {
  const errors = [];
  const warnings = [];
  const rawLines = String(stderr || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = 0; index < rawLines.length; index += 1) {
    const current = rawLines[index];
    const next = rawLines[index + 1] || '';
    const parsed = parseDiagnosticLine(current, next);

    if (parsed) {
      pushDiagnostic(parsed.type === 'warning' ? warnings : errors, parsed);
      continue;
    }

    if (/warning:/i.test(current)) {
      pushDiagnostic(warnings, {
        type: 'warning',
        line: extractLineNumber(current) || 1,
        title: extractHeadline(current, 'warning'),
        description: current,
      });
      continue;
    }

    if (/error:|exception|traceback/i.test(current)) {
      pushDiagnostic(errors, {
        type: 'error',
        line: extractLineNumber(current) || 1,
        title: extractHeadline(current, 'error'),
        description: current,
      });
    }
  }

  if (!errors.length && !warnings.length && exitCode !== 0) {
    pushDiagnostic(errors, {
      type: 'error',
      line: 1,
      title: 'Execution failed',
      description: `Piston returned exit code ${exitCode}.`,
    });
  }

  return {
    errors,
    warnings,
    all: [...errors, ...warnings],
  };
}

function parseDiagnosticLine(currentLine, nextLine) {
  const genericMatch = currentLine.match(/^(.+?):(\d+)(?::\d+)?:\s*(warning|error):\s*(.+)$/i);

  if (genericMatch) {
    const [, fileName, lineNumber, type, message] = genericMatch;
    return {
      type: type.toLowerCase() === 'warning' ? 'warning' : 'error',
      line: Number(lineNumber),
      title: `${fileName} ${type.toLowerCase()}`,
      description: message.trim(),
    };
  }

  const pythonMatch = currentLine.match(/^File\s+".*",\s+line\s+(\d+)/i);

  if (pythonMatch) {
    const message = (nextLine || currentLine).replace(/^\s+/, '');
    const headline = message.match(/^(\w+(?:Error|Warning|Exception)):\s*(.*)$/i);

    return {
      type: /warning/i.test(message) ? 'warning' : 'error',
      line: Number(pythonMatch[1]),
      title: headline ? headline[1] : 'Python syntax issue',
      description: headline ? headline[2] : message,
    };
  }

  return null;
}

function extractLineNumber(line) {
  const match = line.match(/:(\d+)(?::\d+)?:/);
  return match ? Number(match[1]) : null;
}

function extractHeadline(line, fallback) {
  const match = line.match(/(?:warning|error):\s*(.+)$/i);

  if (match) {
    return match[1].trim().slice(0, 120);
  }

  return fallback === 'warning' ? 'Warning' : 'Error';
}

function pushDiagnostic(target, diagnostic) {
  const key = `${diagnostic.type}-${diagnostic.line}-${diagnostic.title}`;

  if (!target.some((item) => `${item.type}-${item.line}-${item.title}` === key)) {
    target.push(diagnostic);
  }
}
