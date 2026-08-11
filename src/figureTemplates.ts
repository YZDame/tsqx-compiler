export interface FigureTemplate {
  label: string;
  description: string;
  content: string;
}

export const FIGURE_TEMPLATES: readonly FigureTemplate[] = [
  {
    label: 'Basic triangle',
    description: 'Three points and a filled triangle',
    content: `# Basic triangle
~triangle A B C

A--B--C--cycle / 0.10 lightcyan / blue
`,
  },
  {
    label: 'Triangle with incenter',
    description: 'Incenter, incircle, and three radii',
    content: `# Triangle with incenter and incircle
A = dir 110
B = dir 210
C = dir 330
I 45 = incenter A B C

A--B--C--cycle / 0.10 lightcyan / blue
incircle A B C / 0.15 lightgreen / darkgreen
A--I / red
B--I / red
C--I / red
`,
  },
  {
    label: 'Orthocenter and feet',
    description: 'Altitude feet and orthic triangle',
    content: `# Orthocenter and orthic triangle
A = dir 95
B = dir 215
C = dir 330
H = orthocenter A B C
D = foot H B C
E = foot H C A
F = foot H A B

A--B--C--cycle / 0.08 lightyellow / blue
D--E--F--cycle / 0.15 lightcyan / red
A--D / gray
B--E / gray
C--F / gray
`,
  },
  {
    label: 'Circle construction',
    description: 'Points on the unit circle and a center-point circle',
    content: `# Circle construction
O = (0, 0)
A = dir 20
B = dir 140
C = dir 260

unitcircle / blue
CP O A / dashed gray
A--B--C--cycle / red
`,
  },
] as const;
