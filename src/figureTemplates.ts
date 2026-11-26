export interface FigureTemplate {
  label: string;
  description: string;
  filename: string;
  content: string;
}

export const FIGURE_TEMPLATES: readonly FigureTemplate[] = [
  {
    label: 'Basic triangle',
    description: 'Three points and a filled triangle',
    filename: 'basic-triangle.tsqx',
    content: `# Basic triangle
~triangle A B C

A--B--C--cycle / 0.10 lightcyan / blue
`,
  },
  {
    label: 'Triangle with incenter',
    description: 'Incenter, incircle, and three radii',
    filename: 'triangle-incenter.tsqx',
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
    filename: 'orthocenter-feet.tsqx',
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
    filename: 'circle-construction.tsqx',
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
  {
    label: 'Themed Euler line (ldgeo)',
    description: 'Semantic theme tokens (classic/print/flexoki/colormath/slides) + invariant assertion',
    filename: 'euler-line-themed.tsqx',
    content: `# Themed Euler line (switch via tsqx.theme or .tsqxrc.json)
A = dir 105
B = dir 215
C = dir 330
O 15 = circumcenter A B C
H 165 = orthocenter A B C
G 290 = centroid A B C
D 270 = foot H B C
E 30 = foot H C A
F 150 = foot H A B
!check_perp(A, D, B, C, "AD perp BC");
!check_collinear(O, G, H, "Euler line O-G-H");

circumcircle A B C / circ
A--B--C--cycle / fill1 / given
D--E--F--cycle / fill2 / accent
A--D / aux
B--E / aux
C--F / aux
O--H / key
rightanglemark A D C / mark
`,
  },
  {
    label: 'Symmedian & tangents (otherPt)',
    description: 'Safe second circle-line intersection via otherPt + perpPt tangents',
    filename: 'symmedian-tangents.tsqx',
    content: `# Symmedian, tangents, and safe second intersection
A = dir 112
B = dir 210
C = dir 330
O 15 = circumcenter A B C
M 235 = midpoint B--C
!path w = circumcircle(A, B, C);
T 270 = extension B (perpPt B O B) C (perpPt C O C)
K 245 = otherPt w A T
D 300 = otherPt w A M
!check_perp(O, B, B, T, "OB perp BT");
!check_on_circle(K, O, A, "K on circumcircle");

w / circ
A--B--C--cycle / fill1 / given
O--B / aux2
O--C / aux2
B--T--C / accent
A--T / key
A--D / aux
rightanglemark O B T / mark
pathtick B M 1 / mark
pathtick M C 1 / mark
`,
  },
] as const;
