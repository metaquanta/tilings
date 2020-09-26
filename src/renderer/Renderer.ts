import Polygon, { Rect } from "../lib/math/2d/Polygon.js";
import { isCallable, isDone } from "../lib/util";
import Tile from "../tiles/Tile";
import Colorer from "./Colorer";
import run from "./runner";
import WebGlRenderer from "./webGlRenderer.js";

export type Renderer = { render(): Promise<HTMLCanvasElement | SVGSVGElement> };

export namespace Renderer {
  export type Builder = _Builder;

  export function builder(): Builder {
    return new _Builder();
  }
}

function create(
  draw: (p: Polygon, s: number, f: Colorer.Color) => void,
  stroke: number,
  fillColorer: Colorer,
  tiles: Iterator<Tile>,
  canvas: HTMLCanvasElement | SVGSVGElement
) {
  return {
    render(): Promise<HTMLCanvasElement | SVGSVGElement> {
      return run(() => {
        const result = tiles.next();
        if (isDone(result)) {
          console.debug(`Renderer.renderNext() - DONE!`);
          return false;
        }
        draw(result.value.polygon(), stroke, fillColorer(result.value));
        return true;
      }).then(() => canvas);
    }
  };
}

class _Builder {
  #canvas: HTMLCanvasElement | undefined;
  #svg: SVGSVGElement | undefined;
  #viewPort: Rect | undefined;
  #tiles: ((vp: Polygon) => Iterable<Tile>) | undefined;
  #fillColorer: Colorer | undefined;
  #stroke: number | undefined;

  tiles(tiles: ((vp: Polygon) => Iterable<Tile>) | Iterable<Tile>): this {
    if (!isCallable(tiles)) {
      this.#tiles = (_) => tiles;
    } else {
      this.#tiles = tiles;
    }
    return this;
  }

  fillColorer(c: Colorer): this {
    this.#fillColorer = c;
    return this;
  }

  stroke(a: number): this {
    this.#stroke = a;
    return this;
  }

  canvas(c: HTMLCanvasElement): this {
    this.#canvas = c;
    return this;
  }

  svg(svg: SVGSVGElement): this {
    this.#svg = svg;
    return this;
  }

  viewport(vp: Rect): this {
    this.#viewPort = vp;
    return this;
  }

  build(mode: "canvas" | "webgl" | "svg") {
    console.debug(`Renderer.build("${mode}")`);
    const vp =
      this.#viewPort ?? (this.#svg ? Rect.from(this.#svg.viewBox) : undefined);
    if (vp === undefined) throw new Error();
    const tileIterator = (this.#tiles as (vp: Polygon) => Iterable<Tile>)(vp);

    const fill = this.#fillColorer ?? Colorer.fixed(0, 0, 50, 1);

    if (this.#canvas) {
      if (mode === "webgl") {
        const gl = this.#canvas.getContext("webgl2");
        if (gl) {
          return WebGlRenderer(gl, fill, tileIterator);
        }
      }
      if (mode === "canvas") {
        const ctx = this.#canvas.getContext("2d");
        const scale = (this.#canvas as { pixelRatio?: number }).pixelRatio ?? 1;
        if (ctx) {
          const renderer = create(
            (p, s, f) => drawCanvas(p, s, f, ctx, scale),
            this.#stroke ?? 1,
            fill,
            tileIterator[Symbol.iterator](),
            this.#canvas
          );
          this.build = () => renderer;
          return renderer;
        }
      }
    }

    if (this.#svg !== undefined && mode === "svg") {
      return create(
        (p, s, f) => drawSvg(p, s, f, this.#svg as SVGSVGElement),
        this.#stroke ?? 1,
        fill,
        tileIterator[Symbol.iterator](),
        this.#svg
      );
    }

    throw new Error("No canvas or svg!");
  }
}

function drawCanvas(
  tile: Polygon,
  stroke: number,
  fillColor: Colorer.Color,
  ctx: CanvasRenderingContext2D,
  scale: number
): void {
  ctx.fillStyle = fillColor.toString();
  ctx.strokeStyle = Colorer.fixed(0, 0, 0, stroke).toString();
  ctx.lineJoin = "round";
  const p = Polygon.getCanvasPath(tile.scale(scale), new Path2D());
  ctx.stroke(p);
  ctx.fill(p);
}

const svgNs = "http://www.w3.org/2000/svg";
function drawSvg(
  tile: Polygon,
  stroke: number,
  fillColor: Colorer.Color,
  svg: SVGElement
): void {
  const p = document.createElementNS(svgNs, "polygon");
  // For some reason ns MUST be null below.
  p.setAttributeNS(null, "points", Polygon.getSvgPoints(tile));
  p.setAttributeNS(null, "fill", fillColor.toString());
  p.setAttributeNS(null, "stroke", `rgb(0, 0, 0)`);
  p.setAttributeNS(null, "stroke-width", `${stroke / 4}`);
  p.setAttributeNS(null, "stroke-linejoin", "round");
  //p.setAttributeNS(null, "stroke-opacity", `${stroke}`);
  svg.appendChild(p);
}

export default Renderer;
