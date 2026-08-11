export interface TsqxDefinition {
  name: string;
  line: number;
  start: number;
  end: number;
  expression: string;
  generatedBy?: 'triangle' | 'regular';
}

export interface TsqxBuiltin {
  name: string;
  signature: string;
  description: string;
  snippet: string;
}

export const TSQX_BUILTINS: readonly TsqxBuiltin[] = [
  builtin('dir', 'dir angle', 'Point on the unit circle at the given angle in degrees.', 'dir ${1:110}'),
  builtin('incenter', 'incenter A B C', 'Incenter of triangle ABC.', 'incenter ${1:A} ${2:B} ${3:C}'),
  builtin('circumcenter', 'circumcenter A B C', 'Circumcenter of triangle ABC.', 'circumcenter ${1:A} ${2:B} ${3:C}'),
  builtin('orthocenter', 'orthocenter A B C', 'Orthocenter of triangle ABC.', 'orthocenter ${1:A} ${2:B} ${3:C}'),
  builtin('centroid', 'centroid A B C', 'Centroid of triangle ABC.', 'centroid ${1:A} ${2:B} ${3:C}'),
  builtin('midpoint', 'midpoint A--B', 'Midpoint of a segment or path.', 'midpoint ${1:A}--${2:B}'),
  builtin('foot', 'foot P A B', 'Foot of the perpendicular from P to line AB.', 'foot ${1:P} ${2:A} ${3:B}'),
  builtin('extension', 'extension A B C D', 'Intersection of lines AB and CD.', 'extension ${1:A} ${2:B} ${3:C} ${4:D}'),
  builtin('incircle', 'incircle A B C', 'Incircle of triangle ABC.', 'incircle ${1:A} ${2:B} ${3:C}'),
  builtin('circumcircle', 'circumcircle A B C', 'Circumcircle of triangle ABC.', 'circumcircle ${1:A} ${2:B} ${3:C}'),
  builtin('unitcircle', 'unitcircle', 'The unit circle centered at the origin.', 'unitcircle'),
  builtin('CP', 'CP P A', 'Circle centered at P through A.', 'CP ${1:P} ${2:A}'),
  builtin('CR', 'CR P r', 'Circle centered at P with radius r.', 'CR ${1:P} ${2:r}'),
  builtin('IP', 'IP p q', 'First intersection point of two paths.', 'IP ${1:p} ${2:q}'),
  builtin('OP', 'OP p q', 'Second intersection point of two paths.', 'OP ${1:p} ${2:q}'),
  builtin('Line', 'Line A B', 'Extended line through points A and B.', 'Line ${1:A} ${2:B}'),
  builtin('rotate', 'rotate angle center', 'Asymptote rotation transform.', 'rotate ${1:-30} ${2:O}'),
  builtin('shift', 'shift vector', 'Asymptote translation transform.', 'shift (${1:0}, ${2:1})'),
  builtin('scale', 'scale factor', 'Asymptote scale transform.', 'scale ${1:2}'),
] as const;

export const TSQX_COLORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'magenta',
  'black', 'white', 'gray', 'lightblue', 'lightcyan', 'lightgreen',
  'lightyellow', 'lightgray', 'lightred', 'darkblue', 'darkgreen', 'darkred',
  'darkcyan', 'darkgray', 'brown', 'pink', 'olive', 'defaultpen', 'dashed',
] as const;

export function parseDefinitions(text: string): TsqxDefinition[] {
  const definitions: TsqxDefinition[] = [];
  const lines = text.split(/\r?\n/);

  for (let line = 0; line < lines.length; line += 1) {
    const sourceLine = stripComment(lines[line]);
    if (!sourceLine.trim() || sourceLine.trimStart().startsWith('!')) {
      continue;
    }

    const special = sourceLine.match(/^\s*~(triangle|regular)\s+(.+)$/);
    if (special) {
      const kind = special[1] as 'triangle' | 'regular';
      for (const match of special[2].matchAll(/[A-Za-z][A-Za-z0-9_']*/g)) {
        const name = match[0];
        const start = sourceLine.indexOf(name, special.index ?? 0);
        definitions.push({
          name,
          line,
          start,
          end: start + name.length,
          expression: `~${kind}`,
          generatedBy: kind,
        });
      }
      continue;
    }

    const equalsIndex = sourceLine.indexOf('=');
    if (equalsIndex < 0) {
      continue;
    }
    const left = sourceLine.slice(0, equalsIndex);
    const nameMatch = left.match(/^\s*([A-Za-z][A-Za-z0-9_']*)/);
    if (!nameMatch) {
      continue;
    }
    const name = nameMatch[1];
    const start = sourceLine.indexOf(name);
    definitions.push({
      name,
      line,
      start,
      end: start + name.length,
      expression: sourceLine.slice(equalsIndex + 1).trim(),
    });
  }

  return definitions;
}

export function findBuiltin(name: string): TsqxBuiltin | undefined {
  return TSQX_BUILTINS.find(item => item.name === name);
}

export function findDefinition(
  definitions: readonly TsqxDefinition[],
  name: string,
  beforeLine = Number.POSITIVE_INFINITY
): TsqxDefinition | undefined {
  return [...definitions]
    .reverse()
    .find(item => item.name === name && item.line <= beforeLine)
    ?? definitions.find(item => item.name === name);
}

function stripComment(line: string): string {
  const index = line.indexOf('#');
  return index < 0 ? line : line.slice(0, index);
}

function builtin(name: string, signature: string, description: string, snippet: string): TsqxBuiltin {
  return { name, signature, description, snippet };
}
