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

export interface TsqxSemanticToken {
  name: string;
  role: string;
  description: string;
}

export interface TsqxSourceWarning {
  line: number;
  start: number;
  end: number;
  message: string;
}

export const TSQX_BUILTINS: readonly TsqxBuiltin[] = [
  builtin('dir', 'dir angle', 'Point on the unit circle at the given angle in degrees.', 'dir ${1:110}'),
  builtin('incenter', 'incenter A B C', 'Incenter of triangle ABC.', 'incenter ${1:A} ${2:B} ${3:C}'),
  builtin('circumcenter', 'circumcenter A B C', 'Circumcenter of triangle ABC.', 'circumcenter ${1:A} ${2:B} ${3:C}'),
  builtin('orthocenter', 'orthocenter A B C', 'Orthocenter of triangle ABC.', 'orthocenter ${1:A} ${2:B} ${3:C}'),
  builtin('centroid', 'centroid A B C', 'Centroid of triangle ABC.', 'centroid ${1:A} ${2:B} ${3:C}'),
  builtin('excenter', 'excenter A B C', 'A-excenter of triangle ABC (built into Asymptote geometry).', 'excenter ${1:A} ${2:B} ${3:C}'),
  builtin('midpoint', 'midpoint A--B', 'Midpoint of a segment or path.', 'midpoint ${1:A}--${2:B}'),
  builtin('foot', 'foot P A B', 'Foot of the perpendicular from P to line AB.', 'foot ${1:P} ${2:A} ${3:B}'),
  builtin('extension', 'extension A B C D', 'Intersection of lines AB and CD.', 'extension ${1:A} ${2:B} ${3:C} ${4:D}'),
  builtin('incircle', 'incircle A B C', 'Incircle of triangle ABC.', 'incircle ${1:A} ${2:B} ${3:C}'),
  builtin('circumcircle', 'circumcircle A B C', 'Circumcircle of triangle ABC.', 'circumcircle ${1:A} ${2:B} ${3:C}'),
  builtin('unitcircle', 'unitcircle', 'The unit circle centered at the origin.', 'unitcircle'),
  builtin('CP', 'CP P A', 'Circle centered at P through A.', 'CP ${1:P} ${2:A}'),
  builtin('CR', 'CR P r', 'Circle centered at P with radius r.', 'CR ${1:P} ${2:r}'),
  builtin('IP', 'IP p q', 'Index-0 intersection of two paths. For the second intersection excluding a known vertex, prefer otherPt.', 'IP ${1:p} ${2:q}'),
  builtin('OP', 'OP p q', 'Index-1 intersection of two paths. Does not guarantee the non-vertex branch; prefer otherPt.', 'OP ${1:p} ${2:q}'),
  builtin('Line', 'Line A B', 'Extended line through points A and B (0.6x extension on each side).', 'Line ${1:A} ${2:B}'),
  builtin('rotate', 'rotate angle center', 'Asymptote rotation transform.', 'rotate ${1:-30} ${2:O}'),
  builtin('reflect', 'reflect A B', 'Asymptote reflection transform across line AB.', 'reflect ${1:A} ${2:B}'),
  builtin('shift', 'shift vector', 'Asymptote translation transform.', 'shift (${1:0}, ${2:1})'),
  builtin('scale', 'scale factor', 'Asymptote scale transform.', 'scale ${1:2}'),
  // ldgeo.asy olympiad helpers (auto-imported when a theme is active)
  builtin('otherPt', 'otherPt circle A B', '[ldgeo] Second intersection of line AB with circle, excluding known point A (auto-extends line).', 'otherPt ${1:w} ${2:A} ${3:B}'),
  builtin('other', 'other circle line X', '[ldgeo] Intersection of two paths farthest from known point X.', 'other ${1:w} ${2:l} ${3:X}'),
  builtin('perpPt', 'perpPt P A B', '[ldgeo] Helper point on the line through P perpendicular to AB.', 'perpPt ${1:P} ${2:A} ${3:B}'),
  builtin('paraPt', 'paraPt P A B', '[ldgeo] Helper point on the line through P parallel to AB.', 'paraPt ${1:P} ${2:A} ${3:B}'),
  builtin('bisectorPt', 'bisectorPt A B C', '[ldgeo] Point on the internal angle bisector of angle ABC.', 'bisectorPt ${1:A} ${2:B} ${3:C}'),
  builtin('extBisectorPt', 'extBisectorPt A B C', '[ldgeo] Point on the external angle bisector of angle ABC.', 'extBisectorPt ${1:A} ${2:B} ${3:C}'),
  builtin('tangentPt', 'tangentPt P O A n', '[ldgeo] Tangent point (n=1 or 2) from P to circle centered at O through A.', 'tangentPt ${1:P} ${2:O} ${3:A} ${4:1}'),
  builtin('tangentPtR', 'tangentPtR P O r n', '[ldgeo] Tangent point (n=1 or 2) from P to circle(O, r).', 'tangentPtR ${1:P} ${2:O} ${3:1} ${4:1}'),
  builtin('rightanglemark', 'rightanglemark A B C', '[ldgeo] Right-angle marker path at vertex B (draw with / mark).', 'rightanglemark ${1:A} ${2:B} ${3:C} / mark'),
  builtin('anglemark', 'anglemark A B C', '[ldgeo] Angle arc marker path at vertex B (draw with / mark).', 'anglemark ${1:A} ${2:B} ${3:C} / mark'),
  builtin('pathtick', 'pathtick A B n', '[ldgeo] n equal-length tick marks on segment AB (draw with / mark).', 'pathtick ${1:A} ${2:B} ${3:1} / mark'),
  builtin('radicalAxis', 'radicalAxis O1 r1 O2 r2 halfLen', '[ldgeo] Radical axis segment path of circles (O1, r1) and (O2, r2).', 'radicalAxis ${1:O_1} ${2:r1} ${3:O_2} ${4:r2} ${5:1.6}'),
  // ldgeo.asy invariant assertions (used with leading `!`)
  builtin('check_perp', '!check_perp(A, B, C, D, "msg");', '[ldgeo] Assert AB is perpendicular to CD (fails compilation if violated).', '!check_perp(${1:A}, ${2:B}, ${3:C}, ${4:D}, "${5:AB perp CD}");'),
  builtin('check_parallel', '!check_parallel(A, B, C, D, "msg");', '[ldgeo] Assert AB is parallel to CD.', '!check_parallel(${1:A}, ${2:B}, ${3:C}, ${4:D}, "${5:AB para CD}");'),
  builtin('check_collinear', '!check_collinear(A, B, C, "msg");', '[ldgeo] Assert points A, B, C are collinear.', '!check_collinear(${1:A}, ${2:B}, ${3:C}, "${4:A-B-C collinear}");'),
  builtin('check_cyclic', '!check_cyclic(A, B, C, D, "msg");', '[ldgeo] Assert points A, B, C, D are concyclic.', '!check_cyclic(${1:A}, ${2:B}, ${3:C}, ${4:D}, "${5:ABCD cyclic}");'),
  builtin('check_on_circle', '!check_on_circle(P, O, A, "msg");', '[ldgeo] Assert P lies on circle centered at O through A.', '!check_on_circle(${1:P}, ${2:O}, ${3:A}, "${4:P on circle}");'),
  builtin('check_equal_dist', '!check_equal_dist(A, B, C, D, "msg");', '[ldgeo] Assert |AB| = |CD|.', '!check_equal_dist(${1:A}, ${2:B}, ${3:C}, ${4:D}, "${5:AB = CD}");'),
] as const;

export const TSQX_SEMANTIC_TOKENS: readonly TsqxSemanticToken[] = [
  { name: 'given', role: 'Known skeleton', description: 'Primary triangle / given polygon outline (theme-aware).' },
  { name: 'aux', role: 'Primary auxiliary (dashed)', description: 'Altitudes, medians, angle bisectors, and extensions.' },
  { name: 'aux2', role: 'Secondary auxiliary (dotted)', description: 'Radii to tangent points, foot connectors, and midlines.' },
  { name: 'key', role: 'Primary focus (bold)', description: 'Target conclusion line, Euler line, radical axis, or polar.' },
  { name: 'accent', role: 'Secondary focus', description: 'Tangents, orthic triangle, or second highlighted locus.' },
  { name: 'circ', role: 'Primary circle', description: 'Circumcircle or primary given circle.' },
  { name: 'circ2', role: 'Secondary circle', description: 'Incircle, nine-point circle, or auxiliary circle.' },
  { name: 'mark', role: 'Geometric mark', description: 'Thin pen for rightanglemark, anglemark, and pathtick.' },
  { name: 'fill1', role: 'Base fill', description: 'Subtle fill for the reference triangle or primary circle.' },
  { name: 'fill2', role: 'Secondary fill', description: 'Subtle fill for the incircle, orthic triangle, or second circle.' },
  { name: 'fillkey', role: 'Highlight fill', description: 'Subtle emphasis fill for a target region.' },
] as const;

export const TSQX_COLORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'cyan', 'magenta',
  'black', 'white', 'gray', 'lightblue', 'lightcyan', 'lightgreen',
  'lightyellow', 'lightgray', 'lightred', 'darkblue', 'darkgreen', 'darkred',
  'darkcyan', 'darkgray', 'brown', 'pink', 'olive', 'defaultpen', 'dashed', 'dotted',
] as const;

const PEN_STYLE_WORDS = new Set<string>([
  ...TSQX_COLORS,
  ...TSQX_SEMANTIC_TOKENS.map(token => token.name),
  'grey', 'deepblue', 'deepgreen', 'deepred', 'heavyblue', 'heavygreen', 'heavyred',
]);

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

/**
 * Detect common TSQX parser lexical traps directly on source lines before or alongside compilation.
 */
export function lintTsqxSource(text: string): TsqxSourceWarning[] {
  const warnings: TsqxSourceWarning[] = [];
  const lines = text.split(/\r?\n/);

  for (let line = 0; line < lines.length; line += 1) {
    const raw = stripComment(lines[line]);
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('~')) {
      continue;
    }

    const eqIdx = raw.indexOf('=');
    const slashIdx = raw.indexOf('/');

    // 1. Parenthesized pen call after `/` (e.g., `A--B / gray(0.5)`, `A--B / linewidth(1.5)`)
    if (eqIdx < 0 && slashIdx >= 0) {
      const afterSlash = raw.slice(slashIdx + 1);
      const parenMatch = afterSlash.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)/);
      if (parenMatch && parenMatch.index !== undefined) {
        const start = slashIdx + 1 + parenMatch.index;
        warnings.push({
          line,
          start,
          end: start + parenMatch[0].length,
          message: `TSQX splits parentheses after '/' into invalid '+' tokens (${parenMatch[0]}). Use an unparenthesized semantic pen (e.g. aux, key, circ) or raw '!draw(...);'.`,
        });
      }
    }

    // 2. Drawing statement with trailing style token(s) but missing `/` (e.g. `A--B dashed blue`)
    if (eqIdx < 0 && slashIdx < 0) {
      const pathStyleMatch = raw.match(/^\s*([A-Za-z0-9_'&()+.*-]+(?:--|\.\.)[A-Za-z0-9_'&()+.*-]+)\s+([A-Za-z_][A-Za-z0-9_]*(?:\s+[A-Za-z_][A-Za-z0-9_]*)*)\s*$/);
      if (pathStyleMatch) {
        const trailingWords = pathStyleMatch[2].split(/\s+/);
        if (trailingWords.every(w => PEN_STYLE_WORDS.has(w))) {
          const styleStart = raw.indexOf(pathStyleMatch[2]);
          warnings.push({
            line,
            start: styleStart,
            end: styleStart + pathStyleMatch[2].length,
            message: `Missing '/' before pen style "${pathStyleMatch[2]}". Write "${pathStyleMatch[1]} / ${pathStyleMatch[2]}" so TSQX emits valid Asymptote.`,
          });
        }
      }
    }

    // 3. Infix minus with leading space in assignment (e.g. `P = 2*A - B` -> `2*A(-B)`)
    if (eqIdx >= 0) {
      const rhs = raw.slice(eqIdx + 1);
      const spacedMinus = rhs.match(/\S\s+-\s+\S/);
      if (spacedMinus && spacedMinus.index !== undefined) {
        const start = eqIdx + 1 + spacedMinus.index;
        warnings.push({
          line,
          start,
          end: start + spacedMinus[0].length,
          message: `Spaced minus "${spacedMinus[0]}" can be misparsed as a function call by TSQX. Remove spaces around '-' (e.g. 2*A-B) or use 'minus'.`,
        });
      }
    }

    // 4. Two parenthesized expressions directly joined by `--` (e.g. `(foot A B C)--(foot B C A)`)
    const parenJoin = raw.match(/\)\s*--\s*\(/);
    if (parenJoin && parenJoin.index !== undefined) {
      warnings.push({
        line,
        start: parenJoin.index,
        end: parenJoin.index + parenJoin[0].length,
        message: 'Joining two parenthesized expressions directly with "--" triggers a TSQX parser bug. Assign each endpoint to a named point first.',
      });
    }
  }

  return warnings;
}

export function findBuiltin(name: string): TsqxBuiltin | undefined {
  return TSQX_BUILTINS.find(item => item.name === name);
}

export function findSemanticToken(name: string): TsqxSemanticToken | undefined {
  return TSQX_SEMANTIC_TOKENS.find(item => item.name === name);
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
