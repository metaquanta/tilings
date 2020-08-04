// Reference: https://tilings.math.uni-bielefeld.de/substitution/pinwheel/

import { Tile, Prototile, reflect } from "../classes/Tile";
import { Triangle } from "../classes/Polygon";
import { V } from "../classes/V";
import { Rule } from "../classes/Rule";

/*const root = (l: V): Tile =>
  createTriangleTile(
    Triangle(l, V(0, 0), l.perp().scale(2)),
    parentFromC,
    children,
    "triangle"
  );*/

// A->B is S side, B->C is M side, C->A is L side.
const parent = (t: Triangle): Triangle => {
  const m = t.b.subtract(t.c);
  const s = t.b.subtract(t.a);
  return Triangle(t.a.add(m.scale(0.5)), t.b.add(s), t.a.subtract(m.scale(2)));
};

const children = (t: Triangle, create: (t: Triangle) => Tile): Tile[] => {
  const l = t.a.subtract(t.c);
  const m = t.b.subtract(t.c);

  const a = Triangle(t.c.add(m.scale(0.5)), t.c.add(l.scale(2 / 5)), t.c);

  //      A
  //   /  |
  // C----B
  const B = (a: Triangle) => Triangle(a.a, a.b, a.b.add(a.b.subtract(a.c)));

  // B----C
  // |  /
  // A
  const C = (b: Triangle) => Triangle(b.c, b.c.add(b.a.subtract(b.b)), b.a);

  // A
  // |  \
  // B----C
  const D = (c: Triangle) => Triangle(c.b.add(c.b.subtract(c.a)), c.b, c.c);

  //    C
  //   /|
  //  / |
  // A--B
  const E = (d: Triangle) => {
    const l = d.b.subtract(d.a);
    const eb = d.b.add(l);
    const ea = d.b.subtract(d.c).scale(0.5).add(d.b).add(d.b.subtract(d.a));
    return Triangle(ea, eb, d.a);
  };

  const b = B(a);
  const c = C(b);
  const d = D(c);
  return [
    create(c),
    reflect(create(a)),
    create(b),
    reflect(create(d)),
    reflect(create(E(d)))
  ];
};

const prototile: Prototile = Prototile<Triangle>(
  (t) => prototile.create(parent(t)),
  (t) => children(t, (p) => prototile.create(p)),
  1,
  false
);

export default Rule(
  (l: V, u: V): Tile =>
    prototile.create(Triangle(l, V(0, 0), l.perp().scale(2)).translate(u)),
  [prototile]
);
