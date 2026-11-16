import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FIGURE_TEMPLATES } from './lib/figureTemplates.cjs';

export const name = 'dsh-tsqx-compiler';
export const inject = ['tools'];

const catalog = Object.entries(JSON.parse(readFileSync(new URL('./snippets/tsqx.json', import.meta.url), 'utf8')));
const compileScript = fileURLToPath(new URL('./compile.mjs', import.meta.url));
const skill = {
	name: 'tsqx-compiler',
	description: 'Write TSQX geometry figures from snippets and templates, and compile them to Asymptote and PDF.',
	content: readFileSync(new URL('./SKILL.md', import.meta.url), 'utf8')
		+ '\n\nInstalled compiler script path: ' + JSON.stringify(compileScript),
};

export function apply(ctx) {
	ctx.inject(['skills'], child => {
		child.effect(() => child.skills.register({
			...skill,
			resourceBase: { kind: 'directory', path: fileURLToPath(new URL('.', import.meta.url)) },
			source: 'runtime',
		}));
	});

	ctx.effect(() => ctx.tools.register({
		name: 'tsqx_snippets',
		description: 'Find TSQX geometry snippets and complete figure templates. Search by name, category, or tsqx- prefix.',
		parameters: {
			type: 'object',
			additionalProperties: false,
			properties: {
				query: { type: 'string', description: 'Search text, such as incircle or tsqx-foot. Omit to list all entries.' },
			},
		},
		output: {
			schema: { type: 'string' },
			render: (_args, value) => [{ type: 'text', text: value }],
		},
		execute({ query = '' }) {
			const terms = query.trim().toLowerCase().split(/\s+/);
			const snippets = catalog.map(([name, { prefix, category, description, body }]) => ({
				title: `${name} (${prefix})`,
				detail: `${category} · ${description}`,
				source: (Array.isArray(body) ? body.join('\n') : body).replace(/\$\{\d+:([^}]*)\}/g, '$1'),
			}));
			const templates = FIGURE_TEMPLATES.map(template => ({
				title: `${template.label} (${template.filename})`,
				detail: `Figure template · ${template.description}`,
				source: template.content.trimEnd(),
			}));
			const matches = [...snippets, ...templates].filter(({ title, detail }) =>
				terms.every(term => `${title} ${detail}`.toLowerCase().includes(term)));
			return matches.map(({ title, detail, source }) => (
				`## ${title}\n${detail}\n\n\`\`\`tsqx\n${source}\n\`\`\``
			)).join('\n\n') || 'No matching TSQX snippets or templates.';
		},
	}));
}
