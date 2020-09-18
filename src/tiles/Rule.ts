import { V } from "../lib/math/2d/V";
import { first } from "../lib/util";
import { RotationColorerOptions } from "../renderer/Colorer";
import { Prototile } from "./Prototile";
import { Tile } from "./Tile";
import { Tiling, TilingOptions } from "./Tiling";

const s = V(31, 17);
const t = V(97, 109);

export interface Rule {
  readonly protos: Prototile[];
  tile(): Tile;
  tileFromEdge(edge: V, pos?: V): Tile;
  tiling(tile: Tile, options: TilingOptions): Tiling;
  readonly colorOptions?: RotationColorerOptions;
}

export function Rule(
  prototiles: Prototile[],
  colorOptions?: RotationColorerOptions
): Rule {
  const seed = first(prototiles, (p) => p.tile !== undefined);
  if (seed === undefined)
    throw new Error("No Prototile has a seed tile method.");

  return {
    protos: prototiles,
    tile: () => (seed.tile as (v: V, p: V) => Tile)(s, t),
    tileFromEdge: (u: V, v: V = V(0, 0)) =>
      (seed.tile as (v: V, p: V) => Tile)(u, v),
    tiling: (tile, options) => Tiling(tile, options),
    colorOptions
  };
}
