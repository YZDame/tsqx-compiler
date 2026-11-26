// ldgeo.asy — Shared semantic theme presets, geometry helpers, and invariant assertions for TSQX.
// Canonical SSOT: templates/tsqx/ldgeo.asy
// Usage via Asymptote CLI (zero boilerplate in .tsqx):
//   ASYMPTOTE_DIR=/path/to/templates/tsqx asy -autoimport ldgeo -u classic -f pdf fig.asy
// Supported themes: classic (default), print, flexoki, colormath, slides.

import settings;

// ---------------------------------------------------------------------------
// 1. Semantic pen tokens (valid unparenthesized TSQX pen identifiers)
// ---------------------------------------------------------------------------
pen given;
pen aux;
pen aux2;
pen key;
pen accent;
pen circ;
pen circ2;
pen mark;
pen fill1;
pen fill2;
pen fillkey;

string ldgeo_theme = "classic";

string _ldgeo_strip(string s) {
  int a = 0;
  int b = length(s);
  while (a < b) {
    string ch = substr(s, a, 1);
    if (ch == " " || ch == "\t" || ch == "\n" || ch == "\r" || ch == ";") ++a;
    else break;
  }
  while (b > a) {
    string ch = substr(s, b - 1, 1);
    if (ch == " " || ch == "\t" || ch == "\n" || ch == "\r" || ch == ";") --b;
    else break;
  }
  return substr(s, a, b - a);
}

void applytheme(string name = "classic") {
  string t = _ldgeo_strip(name);
  if (t == "") t = "classic";
  ldgeo_theme = t;

  if (t == "print") {
    defaultpen(fontsize(9.5pt) + linewidth(0.75) + black);
    dotfactor = 4.2;
    given   = black + linewidth(0.75);
    aux     = gray(0.35) + linetype(new real[]{4, 2.8}) + linewidth(0.52);
    aux2    = gray(0.40) + linetype(new real[]{1.2, 2.2}) + linewidth(0.55);
    key     = black + linewidth(1.45);
    accent  = gray(0.18) + linetype(new real[]{6, 2, 1.5, 2}) + linewidth(1.05);
    circ    = black + linewidth(0.65);
    circ2   = gray(0.30) + linetype(new real[]{5, 2.5}) + linewidth(0.65);
    mark    = gray(0.25) + linewidth(0.50);
    // Use solid light grays instead of alpha transparency for clean monochrome laser prints.
    fill1   = gray(0.94);
    fill2   = gray(0.86);
    fillkey = gray(0.78);
  } else if (t == "flexoki") {
    defaultpen(fontsize(9.5pt) + linewidth(0.75) + rgb("100F0F"));
    dotfactor = 4.2;
    given   = rgb("100F0F") + linewidth(0.75);
    aux     = rgb("878580") + dashed + linewidth(0.55);
    aux2    = rgb("9F9D96") + dotted + linewidth(0.55);
    key     = rgb("AF3029") + linewidth(1.05);
    accent  = rgb("BC5215") + linewidth(0.95);
    circ    = rgb("205EA6") + linewidth(0.70);
    circ2   = rgb("66800B") + linewidth(0.70);
    mark    = rgb("575653") + linewidth(0.50);
    fill1   = opacity(0.10) + rgb("D0A215");
    fill2   = opacity(0.11) + rgb("24837B");
    fillkey = opacity(0.12) + rgb("D14D41");
  } else if (t == "colormath") {
    // Aligned with templates/colormath/ColorMath.cls palette.
    defaultpen(fontsize(9.5pt) + linewidth(0.75) + rgb("1B2028"));
    dotfactor = 4.2;
    given   = rgb("1B2028") + linewidth(0.75);
    aux     = rgb("7A808A") + dashed + linewidth(0.55);
    aux2    = rgb("8D939C") + dotted + linewidth(0.55);
    key     = rgb("973F05") + linewidth(1.05);
    accent  = rgb("802487") + linewidth(0.95);
    circ    = rgb("08468B") + linewidth(0.70);
    circ2   = rgb("0B582B") + linewidth(0.70);
    mark    = rgb("4D5560") + linewidth(0.50);
    fill1   = opacity(0.08) + rgb("08468B");
    fill2   = opacity(0.09) + rgb("0B582B");
    fillkey = opacity(0.10) + rgb("802487");
  } else if (t == "slides") {
    // Aligned with templates/exercise-slides/exercise-slides.sty for classroom projection.
    defaultpen(fontsize(11pt) + linewidth(1.05) + rgb("14181F"));
    dotfactor = 5.0;
    given   = rgb("14181F") + linewidth(1.05);
    aux     = rgb("6B7280") + dashed + linewidth(0.80);
    aux2    = rgb("7D8590") + dotted + linewidth(0.80);
    key     = rgb("A34315") + linewidth(1.55);
    accent  = rgb("B91C1C") + linewidth(1.35);
    circ    = rgb("245DA8") + linewidth(1.05);
    circ2   = rgb("15803D") + linewidth(1.00);
    mark    = rgb("374151") + linewidth(0.75);
    fill1   = opacity(0.10) + rgb("245DA8");
    fill2   = opacity(0.11) + rgb("15803D");
    fillkey = opacity(0.13) + rgb("A34315");
  } else if (t == "classic") {
    defaultpen(fontsize(9.5pt) + linewidth(0.75) + rgb("1E242B"));
    dotfactor = 4.2;
    given   = rgb("1E242B") + linewidth(0.75);
    aux     = rgb("7A828C") + dashed + linewidth(0.55);
    aux2    = rgb("8B949E") + dotted + linewidth(0.55);
    key     = rgb("C81E3A") + linewidth(1.05);
    accent  = rgb("C86D14") + linewidth(0.95);
    circ    = rgb("1B4F9C") + linewidth(0.70);
    circ2   = rgb("1B7A4E") + linewidth(0.70);
    mark    = rgb("4A5568") + linewidth(0.50);
    fill1   = opacity(0.08) + rgb("6BA8E5");
    fill2   = opacity(0.11) + rgb("5AC28D");
    fillkey = opacity(0.12) + rgb("E85D75");
  } else {
    abort("ldgeo: unknown theme '" + t + "' (expected classic|print|flexoki|colormath|slides)");
  }
}

string _ldgeo_init_theme() {
  string raw = _ldgeo_strip(settings.user);
  if (raw == "") return "classic";
  if (substr(raw, 0, 6) == "theme=") return _ldgeo_strip(substr(raw, 6));
  return raw;
}

applytheme(_ldgeo_init_theme());

// ---------------------------------------------------------------------------
// 2. Olympiad geometry helpers missing from default `tsqx -p` preamble
// ---------------------------------------------------------------------------

// Return the intersection of paths `c` and `l` farthest from known point `X`.
pair other(path c, path l, pair X) {
  pair[] hits = intersectionpoints(c, l);
  assert(hits.length > 0, "ldgeo.other: paths do not intersect");
  int best = 0;
  real bestDist = abs(hits[0] - X);
  for (int i = 1; i < hits.length; ++i) {
    real d = abs(hits[i] - X);
    if (d > bestDist) {
      bestDist = d;
      best = i;
    }
  }
  assert(bestDist > 1e-7, "ldgeo.other: only found intersection coinciding with X");
  return hits[best];
}

// Return the second intersection of line AB with curve `c`, excluding known point A.
// Automatically extends segment AB well beyond the bounding box of `c`.
pair otherPt(path c, pair A, pair B) {
  assert(abs(B - A) > 1e-12, "ldgeo.otherPt: degenerate line A == B");
  pair lo = min(c);
  pair hi = max(c);
  real span = max(abs(hi - lo), abs(A - lo), abs(A - hi)) + abs(B - A) + 1.0;
  pair u = unit(B - A);
  path ray = (A - 4 * span * u)--(A + 4 * span * u);
  return other(c, ray, A);
}

// Helper point on the line through P perpendicular to AB.
pair perpPt(pair P, pair A, pair B) {
  assert(abs(B - A) > 1e-12, "ldgeo.perpPt: degenerate reference line");
  return P + rotate(90) * unit(B - A);
}

// Helper point on the line through P parallel to AB.
pair paraPt(pair P, pair A, pair B) {
  assert(abs(B - A) > 1e-12, "ldgeo.paraPt: degenerate reference line");
  return P + unit(B - A);
}

// Unit-distance point on the internal angle bisector of angle ABC.
pair bisectorPt(pair A, pair B, pair C) {
  pair u = unit(A - B);
  pair v = unit(C - B);
  pair s = u + v;
  assert(abs(s) > 1e-10, "ldgeo.bisectorPt: straight angle has ambiguous internal bisector");
  return B + unit(s);
}

// Unit-distance point on the external angle bisector of angle ABC.
pair extBisectorPt(pair A, pair B, pair C) {
  pair u = unit(A - B);
  pair v = unit(C - B);
  pair d = u - v;
  assert(abs(d) > 1e-10, "ldgeo.extBisectorPt: zero angle has ambiguous external bisector");
  return B + unit(d);
}

// Tangent point from external point P to circle(O, r); n=1 (CCW) or n=2 (CW).
pair tangentPtR(pair P, pair O, real r, int n = 1) {
  real d = abs(P - O);
  assert(r > 0, "ldgeo.tangentPtR: radius must be positive");
  assert(d >= r - 1e-9, "ldgeo.tangentPtR: point P lies inside circle");
  if (d <= r + 1e-9) return P;
  real ang = degrees(acos(min(1.0, r / d)));
  real base = degrees(P - O);
  real theta = (n == 1) ? (base + ang) : (base - ang);
  return O + r * dir(theta);
}

// Tangent point from external point P to circle centered at O passing through A.
pair tangentPt(pair P, pair O, pair A, int n = 1) {
  return tangentPtR(P, O, abs(A - O), n);
}

// Right-angle marker at vertex B of angle ABC (model-space size s, clamped to 45% of shorter leg).
path rightanglemark(pair A, pair B, pair C, real s = 0.14) {
  real d1 = abs(A - B);
  real d2 = abs(C - B);
  assert(d1 > 1e-12 && d2 > 1e-12, "ldgeo.rightanglemark: degenerate angle");
  real sz = min(s, 0.45 * min(d1, d2));
  pair u = sz * unit(A - B);
  pair v = sz * unit(C - B);
  return (B + u)--(B + u + v)--(B + v);
}

// Acute/obtuse (<= 180 deg) angle arc marker at vertex B of angle ABC.
path anglemark(pair A, pair B, pair C, real r = 0.18) {
  real d1 = abs(A - B);
  real d2 = abs(C - B);
  assert(d1 > 1e-12 && d2 > 1e-12, "ldgeo.anglemark: degenerate angle");
  real rad = min(r, 0.45 * min(d1, d2));
  real a1 = degrees(A - B);
  real a2 = degrees(C - B);
  real diff = (a2 - a1) % 360;
  if (diff < 0) diff += 360;
  if (diff <= 180) return arc(B, rad, a1, a1 + diff);
  return arc(B, rad, a2, a2 + (360 - diff));
}

// Segment tick marks (n ticks perpendicular to AB around midpoint).
path[] pathtick(pair A, pair B, int n = 1, real len = 0.07, real gap = 0.035) {
  assert(abs(B - A) > 1e-12, "ldgeo.pathtick: degenerate segment");
  pair mid = 0.5 * (A + B);
  pair u = unit(B - A);
  pair perp = rotate(90) * u;
  path[] ticks;
  for (int i = 0; i < n; ++i) {
    real offset = (i - 0.5 * (n - 1)) * gap;
    pair c = mid + offset * u;
    ticks.push((c - 0.5 * len * perp)--(c + 0.5 * len * perp));
  }
  return ticks;
}

// Radical axis segment of circles (O1, r1) and (O2, r2), extending `halfLen` on each side of the foot.
path radicalAxis(pair O1, real r1, pair O2, real r2, real halfLen = 1.6) {
  real d = abs(O2 - O1);
  assert(d > 1e-10, "ldgeo.radicalAxis: concentric circles have no finite radical axis");
  pair u = (O2 - O1) / d;
  real x = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  pair footPt = O1 + x * u;
  pair v = rotate(90) * u;
  return (footPt - halfLen * v)--(footPt + halfLen * v);
}

// ---------------------------------------------------------------------------
// 3. Geometric invariant assertions (fail compilation if a diagram is wrong)
// ---------------------------------------------------------------------------

void check_perp(pair A, pair B, pair C, pair D, string msg = "", real tol = 1e-6) {
  assert(abs(B - A) > 1e-12 && abs(D - C) > 1e-12, "check_perp degenerate: " + msg);
  real err = abs(dot(unit(B - A), unit(D - C)));
  assert(err < tol, "check_perp failed (" + string(err) + "): " + msg);
}

void check_parallel(pair A, pair B, pair C, pair D, string msg = "", real tol = 1e-6) {
  assert(abs(B - A) > 1e-12 && abs(D - C) > 1e-12, "check_parallel degenerate: " + msg);
  pair u = unit(B - A);
  pair v = unit(D - C);
  real err = abs(u.x * v.y - u.y * v.x);
  assert(err < tol, "check_parallel failed (" + string(err) + "): " + msg);
}

void check_collinear(pair A, pair B, pair C, string msg = "", real tol = 1e-6) {
  real scale = max(abs(B - A), abs(C - A), abs(C - B), 1.0);
  real area2 = abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x));
  real err = area2 / (scale * scale);
  assert(err < tol, "check_collinear failed (" + string(err) + "): " + msg);
}

void check_on_circle(pair P, pair O, pair A, string msg = "", real tol = 1e-6) {
  real r = abs(A - O);
  real scale = max(r, 1.0);
  real err = abs(abs(P - O) - r) / scale;
  assert(err < tol, "check_on_circle failed (" + string(err) + "): " + msg);
}

void check_cyclic(pair A, pair B, pair C, pair D, string msg = "", real tol = 1e-5) {
  // Check circumcenter of ABC is equidistant to D.
  pair u = B - A;
  pair v = C - A;
  real det = 2 * (u.x * v.y - u.y * v.x);
  assert(abs(det) > 1e-10, "check_cyclic: first three points are collinear: " + msg);
  real u2 = dot(u, u);
  real v2 = dot(v, v);
  pair O = A + ((v.y * u2 - u.y * v2) / det, (u.x * v2 - v.x * u2) / det);
  check_on_circle(D, O, A, "check_cyclic " + msg, tol);
}

void check_equal_dist(pair A, pair B, pair C, pair D, string msg = "", real tol = 1e-6) {
  real d1 = abs(B - A);
  real d2 = abs(D - C);
  real scale = max(d1, d2, 1.0);
  real err = abs(d1 - d2) / scale;
  assert(err < tol, "check_equal_dist failed (" + string(err) + "): " + msg);
}
