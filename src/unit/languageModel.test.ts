import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findBuiltin, findDefinition, findSemanticToken, lintTsqxSource, parseDefinitions } from '../languageModel';
import { FIGURE_TEMPLATES } from '../figureTemplates';

test('parses point definitions with directions and label flags', () => {
  const definitions = parseDefinitions(`
A = dir 110
I 45 = incenter A B C
P_1 ;= foot A B C
P_2 dl= midpoint A--B # comment
!pair X = (0,0);
`);
  assert.deepEqual(definitions.map(item => [item.name, item.expression]), [
    ['A', 'dir 110'],
    ['I', 'incenter A B C'],
    ['P_1', 'foot A B C'],
    ['P_2', 'midpoint A--B'],
  ]);
});

test('parses special triangle and regular polygon definitions', () => {
  const definitions = parseDefinitions('~triangle A B C\n~regular P Q R S');
  assert.deepEqual(definitions.map(item => item.name), ['A', 'B', 'C', 'P', 'Q', 'R', 'S']);
  assert.equal(definitions[0].generatedBy, 'triangle');
  assert.equal(definitions[3].generatedBy, 'regular');
});

test('provides documented TSQX and ldgeo builtins plus semantic tokens', () => {
  assert.equal(findBuiltin('foot')?.signature, 'foot P A B');
  assert.equal(findBuiltin('otherPt')?.signature, 'otherPt circle A B');
  assert.equal(findBuiltin('excenter')?.signature, 'excenter A B C');
  assert.equal(findBuiltin('unknown'), undefined);
  assert.equal(findSemanticToken('given')?.role, 'Known skeleton');
  assert.equal(findSemanticToken('nonexistent'), undefined);
});

test('finds the nearest preceding redefinition', () => {
  const definitions = parseDefinitions('P = dir 0\nA = dir 90\nP = midpoint P--A\nP--A');
  assert.equal(findDefinition(definitions, 'P', 1)?.line, 0);
  assert.equal(findDefinition(definitions, 'P', 3)?.line, 2);
});

test('lintTsqxSource flags all four common TSQX parser traps', () => {
  const warnings = lintTsqxSource([
    '~triangle A B C',
    'A--B / gray(0.5)',
    'A--B dashed blue',
    'P = 2*A - B',
    '(foot A B C)--(foot B C A)',
    'A--B / aux',
    '!draw(A--B, gray(0.5));',
  ].join('\n'));

  assert.deepEqual(warnings.map(w => w.line), [1, 2, 3, 4]);
  assert.match(warnings[0].message, /parentheses after '\/'/i);
  assert.match(warnings[1].message, /Missing '\/'/);
  assert.match(warnings[2].message, /Spaced minus/);
  assert.match(warnings[3].message, /parenthesized expressions/i);
});

test('all figure templates expose point definitions', () => {
  for (const template of FIGURE_TEMPLATES) {
    assert.ok(parseDefinitions(template.content).length > 0, template.label);
    assert.match(template.filename, /^[a-z0-9-]+\.tsqx$/);
  }
});
