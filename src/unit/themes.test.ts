import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  DEFAULT_LDGEO_PATH,
  discoverProjectTheme,
  inlineLdgeoIntoAsy,
  resolveEffectiveTheme,
  usesLdgeoFeatures,
} from '../themes';

test('bundled ldgeo.asy exists at DEFAULT_LDGEO_PATH', () => {
  assert.ok(fs.existsSync(DEFAULT_LDGEO_PATH), `Expected ${DEFAULT_LDGEO_PATH}`);
});

test('usesLdgeoFeatures detects semantic tokens and ldgeo helpers', () => {
  assert.equal(usesLdgeoFeatures('~triangle A B C\nA--B--C--cycle / 0.1 lightcyan / blue\n'), false);
  assert.equal(usesLdgeoFeatures('~triangle A B C\nA--B--C--cycle / fill1 / given\n'), true);
  assert.equal(usesLdgeoFeatures('K = otherPt w A T\n'), true);
  assert.equal(usesLdgeoFeatures('!check_perp(A, D, B, C, "AD perp BC");\n'), true);
});

test('discoverProjectTheme respects .tsqxrc.json over parent project.yaml', async () => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tsqx-theme-'));
  try {
    await fs.promises.writeFile(path.join(dir, 'project.yaml'), 'title: Demo\ntsqx_theme: colormath\n');
    const sub = path.join(dir, 'figures');
    await fs.promises.mkdir(sub);
    const fig = path.join(sub, 'a.tsqx');
    await fs.promises.writeFile(fig, '~triangle A B C\n');

    assert.equal(discoverProjectTheme(fig, dir), 'colormath');
    assert.equal(resolveEffectiveTheme('auto', '~triangle A B C\n', fig, dir), 'colormath');
    assert.equal(resolveEffectiveTheme('print', '~triangle A B C\n', fig, dir), 'print');

    await fs.promises.writeFile(path.join(sub, '.tsqxrc.json'), JSON.stringify({ theme: 'flexoki' }));
    assert.equal(discoverProjectTheme(fig, dir), 'flexoki');
    assert.equal(resolveEffectiveTheme('auto', '~triangle A B C\n', fig, dir), 'flexoki');
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

test('inlineLdgeoIntoAsy embeds ldgeo.asy and activates the selected theme', () => {
  const asy = 'size(7.5cm);\npair A = dir(110);\n';
  const merged = inlineLdgeoIntoAsy(asy, DEFAULT_LDGEO_PATH, 'slides');
  assert.ok(merged.includes('Begin inlined ldgeo.asy (theme: slides)'));
  assert.ok(merged.includes('applytheme("slides");'));
  assert.ok(!merged.includes('applytheme(_ldgeo_init_theme());'));
});
