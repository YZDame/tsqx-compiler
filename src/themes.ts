import * as fs from 'node:fs';
import * as path from 'node:path';

export type TsqxThemePreset = 'none' | 'classic' | 'print' | 'flexoki' | 'colormath' | 'slides';
export type TsqxThemeSetting = 'auto' | TsqxThemePreset;
export type TsqxScaleSetting = 'default' | 'compact' | 'standard' | 'wide';

export const TSQX_THEME_PRESETS: readonly TsqxThemePreset[] = [
  'none',
  'classic',
  'print',
  'flexoki',
  'colormath',
  'slides',
] as const;

export const TSQX_SCALE_SIZES: Readonly<Record<Exclude<TsqxScaleSetting, 'default'>, string>> = {
  compact: '5.5cm',
  standard: '7.5cm',
  wide: '11.5cm',
};

export const DEFAULT_LDGEO_PATH = path.resolve(__dirname, '..', 'assets', 'ldgeo.asy');

const PROJECT_YAML_THEME_RE = /^\s*tsqx_theme\s*:\s*([A-Za-z0-9_-]+)\s*(?:#.*)?$/;

const LDGEO_FEATURE_RE = new RegExp(
  [
    String.raw`(?:\/\s*[^#\n]*\b(?:given|aux|aux2|key|accent|circ|circ2|mark|fill1|fill2|fillkey)\b)`,
    String.raw`\b(?:otherPt|other|perpPt|paraPt|bisectorPt|extBisectorPt|tangentPt|tangentPtR|rightanglemark|anglemark|pathtick|radicalAxis|check_perp|check_parallel|check_collinear|check_cyclic|check_on_circle|check_equal_dist)\b`,
  ].join('|')
);

export function isThemePreset(value: unknown): value is TsqxThemePreset {
  return typeof value === 'string' && (TSQX_THEME_PRESETS as readonly string[]).includes(value);
}

export function normalizeThemeSetting(value: unknown): TsqxThemeSetting {
  if (value === 'auto') {
    return 'auto';
  }
  return isThemePreset(value) ? value : 'auto';
}

export function normalizeScaleSetting(value: unknown): TsqxScaleSetting {
  if (value === 'compact' || value === 'standard' || value === 'wide') {
    return value;
  }
  return 'default';
}

export function usesLdgeoFeatures(source: string): boolean {
  return LDGEO_FEATURE_RE.test(source);
}

export function discoverProjectTheme(tsqxFilePath: string, stopAt?: string): TsqxThemePreset | undefined {
  let current = path.resolve(path.dirname(tsqxFilePath));
  const stopDir = stopAt ? path.resolve(stopAt) : undefined;

  while (true) {
    const rcPath = path.join(current, '.tsqxrc.json');
    if (fs.existsSync(rcPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(rcPath, 'utf8')) as { theme?: unknown };
        if (isThemePreset(parsed.theme)) {
          return parsed.theme;
        }
      } catch {
        // Ignore malformed .tsqxrc.json and keep walking upward.
      }
    }

    const cardPath = path.join(current, 'project.yaml');
    if (fs.existsSync(cardPath)) {
      try {
        const lines = fs.readFileSync(cardPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(PROJECT_YAML_THEME_RE);
          if (match && isThemePreset(match[1])) {
            return match[1];
          }
        }
      } catch {
        // Ignore unreadable project.yaml and keep walking upward.
      }
    }

    if (stopDir && current === stopDir) {
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return undefined;
}

export function resolveEffectiveTheme(
  configured: TsqxThemeSetting | undefined,
  source: string,
  tsqxFilePath: string,
  workspaceRoot?: string
): TsqxThemePreset {
  const setting = normalizeThemeSetting(configured);
  if (setting !== 'auto') {
    return setting;
  }
  const projectTheme = discoverProjectTheme(tsqxFilePath, workspaceRoot);
  if (projectTheme) {
    return projectTheme;
  }
  return usesLdgeoFeatures(source) ? 'classic' : 'none';
}

export function inlineLdgeoIntoAsy(asySource: string, ldgeoPath: string, theme: Exclude<TsqxThemePreset, 'none'>): string {
  const ldgeoCode = fs.readFileSync(ldgeoPath, 'utf8')
    .trim()
    .replace(/applytheme\(_ldgeo_init_theme\(\)\);/, `applytheme("${theme}");`);

  const block = [
    '',
    `// --- Begin inlined ldgeo.asy (theme: ${theme}) ---`,
    ldgeoCode,
    '// --- End inlined ldgeo.asy ---',
    '',
  ].join('\n');

  const sizeMatch = /^size\([^)]*\);\s*$/m.exec(asySource);
  if (sizeMatch && sizeMatch.index !== undefined) {
    const insertAt = sizeMatch.index + sizeMatch[0].length;
    return `${asySource.slice(0, insertAt)}${block}${asySource.slice(insertAt)}`;
  }
  return `${block}\n${asySource}`;
}
