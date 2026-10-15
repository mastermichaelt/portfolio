import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
} from "three";

const COUNT = 14_000;
const ACCENT = new Color("#d9a441");
const INK = new Color("#bdb7ac");

/** Deterministic-ish layout for instanced singularity particles (prototype). */
export function createSingularityParticleGeometry(): BufferGeometry {
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i += 1) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.random() * Math.PI * 2;
    const radius = 0.35 + Math.random() * 1.4;
    const x = Math.cos(t) * (1.8 + Math.cos(p) * 0.55) * radius * 0.35;
    const y = Math.sin(p) * radius * 0.55;
    const z = Math.sin(t) * (1.8 + Math.cos(p) * 0.55) * radius * 0.35;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const mix = Math.random();
    const c = ACCENT.clone().lerp(INK, mix * 0.65);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    seeds[i] = Math.random();
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  geo.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  return geo;
}
