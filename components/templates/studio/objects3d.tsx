"use client";

import { useEffect, useRef } from "react";
import { motionOff } from "./motion";

/**
 * A 3D stage of everyday objects for the 3D Pro templates (Control Room,
 * Studio Desk). Every project becomes one object: a bar chart, a parcel, a
 * camera, a rocket… chosen from the project's category, so the owner changes
 * an object by typing a different category (“Video”, “Logistics”, “Chart”).
 * Click an object to open its project; drag to turn the stage. The objects
 * are drawn in code with three.js (no model files), which loads only when a
 * 3D template is on screen. One still frame when motion is off.
 */

export const OBJECT_KINDS = [
  "chart",
  "pie",
  "monitor",
  "laptop",
  "phone",
  "camera",
  "mic",
  "megaphone",
  "book",
  "box",
  "truck",
  "gear",
  "globe",
  "trophy",
  "clipboard",
  "calendar",
  "rocket",
  "target",
  "coins",
  "clock",
  "bulb",
  "plant",
] as const;

export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** Words that pick each object. The object's own name always works too. */
const KEYWORDS: Array<[ObjectKind, RegExp]> = [
  ["truck", /truck|fleet|transport|delivery|last.?mile|freight/],
  ["box", /logistic|supply|warehouse|inventory|stock|shipping|fulfil|parcel|packag|procure/],
  ["gear", /process|automat|operation|system|efficien|lean|six sigma|workflow|maintenance/],
  ["clipboard", /audit|complian|checklist|quality|safety|iso|inspection|policy/],
  ["calendar", /plan|schedul|calendar|roadmap|rota|editorial|timeline/],
  ["coins", /cost|budget|saving|financ|revenue|profit|pricing|money/],
  ["clock", /time|turnaround|speed|sla|hours|deadline/],
  ["globe", /global|international|expan|market entry|region|world/],
  ["trophy", /award|win|record|best|prize/],
  ["target", /conversion|goal|okr|strategy|kpi|lead/],
  ["rocket", /launch|startup|scale|growth/],
  ["monitor", /dashboard|monitor|screen|control room|command/],
  ["chart", /seo|traffic|analytic|data|metric|report|insight/],
  ["pie", /share|split|segment|survey|research/],
  ["camera", /video|photo|shoot|youtube|film|reel/],
  ["mic", /podcast|audio|interview|webinar|talk|speak/],
  ["phone", /social|tiktok|instagram|linkedin|app|mobile|sms|whatsapp/],
  ["megaphone", /campaign|ad\b|ads|promo|pr\b|press|brand|announce/],
  ["book", /ebook|e-book|guide|blog|article|newsletter|writing|content|case stud|whitepaper|copy/],
  ["laptop", /website|web|platform|software|digital|email|crm|erp|it\b/],
  ["bulb", /idea|innovat|creative|concept|brainstorm/],
  ["plant", /sustain|green|wellbeing|culture|people|team|hiring/],
];

/** The object for a project: its category (or title) decides; otherwise a varied default. */
export function objectFor(
  text: string | undefined,
  index: number,
  fallback: readonly ObjectKind[],
): ObjectKind {
  const words = (text ?? "").toLowerCase();
  const exact = OBJECT_KINDS.find((kind) => new RegExp(`\\b${kind}`).test(words));
  if (exact) return exact;
  const match = KEYWORDS.find(([, pattern]) => pattern.test(words));
  return match ? match[0] : fallback[index % fallback.length]!;
}

type Three = typeof import("three");
type Object3D = import("three").Object3D;

function makeMaterials(THREE: Three, accent: string, ink: string) {
  const standard = (color: string, roughness = 0.45, metalness = 0.1) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    accent: standard(accent, 0.35, 0.25),
    white: standard("#f2f1ec", 0.5),
    ink: standard(ink, 0.55, 0.2),
    dark: standard("#22252b", 0.5, 0.35),
    metal: standard("#c8ccd3", 0.25, 0.85),
    gold: standard("#e8b64c", 0.28, 0.85),
    card: standard("#c79a62", 0.85),
    tape: standard("#e9d6a8", 0.6),
    leaf: standard("#3f9d62", 0.6),
    pot: standard("#d8cfc2", 0.7),
    red: standard("#e5484d", 0.45),
    blue: standard("#3e7bfa", 0.45),
    screen: new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.55,
      roughness: 0.3,
    }),
    glow: new THREE.MeshStandardMaterial({
      color: "#fff3c4",
      emissive: "#ffe28a",
      emissiveIntensity: 1.1,
    }),
  };
}

type Materials = ReturnType<typeof makeMaterials>;

/** An object plus the parts that move while it idles. */
type Built = { group: import("three").Group; tick?: (t: number) => void };

function box(
  THREE: Three,
  size: [number, number, number],
  material: import("three").Material,
  at: [number, number, number],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  return mesh;
}

function cylinder(
  THREE: Three,
  radius: number,
  height: number,
  material: import("three").Material,
  at: [number, number, number],
  top = radius,
  segments = 32,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, segments), material);
  mesh.position.set(...at);
  return mesh;
}

/** Builds one object, about one unit across, standing on y = 0. */
function build(THREE: Three, kind: ObjectKind, m: Materials): Built {
  const g = new THREE.Group();
  switch (kind) {
    case "chart": {
      g.add(box(THREE, [1.3, 0.08, 0.7], m.dark, [0, 0.04, 0]));
      const heights = [0.35, 0.6, 0.5, 0.95];
      const bars = heights.map((h, i) => {
        const bar = box(THREE, [0.22, 1, 0.38], i === 3 ? m.accent : m.white, [-0.45 + i * 0.3, 0, 0]);
        g.add(bar);
        return bar;
      });
      return {
        group: g,
        tick: (t) =>
          bars.forEach((bar, i) => {
            const h = heights[i]! * (0.9 + Math.sin(t * 1.6 + i) * 0.1);
            bar.scale.y = h;
            bar.position.y = 0.08 + h / 2;
          }),
      };
    }
    case "pie": {
      const slices: Array<[number, import("three").Material]> = [
        [0.45, m.accent],
        [0.3, m.white],
        [0.25, m.ink],
      ];
      let start = 0;
      const raised: Object3D[] = [];
      slices.forEach(([share, material], i) => {
        const length = share * Math.PI * 2;
        const slice = new THREE.Mesh(
          new THREE.CylinderGeometry(0.62, 0.62, 0.22, 48, 1, false, start, length),
          material,
        );
        slice.position.y = 0.11;
        if (i === 0) {
          const middle = start + length / 2;
          slice.position.x = Math.sin(middle) * 0.08;
          slice.position.z = Math.cos(middle) * 0.08;
          raised.push(slice);
        }
        start += length;
        g.add(slice);
      });
      return { group: g, tick: (t) => raised.forEach((s) => (s.position.y = 0.16 + Math.sin(t * 2) * 0.05)) };
    }
    case "monitor": {
      g.add(box(THREE, [0.5, 0.05, 0.32], m.dark, [0, 0.025, 0]));
      g.add(box(THREE, [0.08, 0.45, 0.08], m.dark, [0, 0.25, 0]));
      g.add(box(THREE, [1.3, 0.8, 0.06], m.dark, [0, 0.82, 0]));
      const panel = box(THREE, [1.2, 0.7, 0.01], m.ink, [0, 0.82, 0.035]);
      g.add(panel);
      const bars = [0.2, 0.35, 0.28, 0.5].map((h, i) => {
        const bar = box(THREE, [0.14, h, 0.012], m.screen, [-0.35 + i * 0.22, 0.55 + h / 2, 0.045]);
        g.add(bar);
        return bar;
      });
      const line = box(THREE, [0.9, 0.025, 0.012], m.glow, [0, 1.06, 0.045]);
      g.add(line);
      return {
        group: g,
        tick: (t) => bars.forEach((bar, i) => (bar.scale.y = 0.85 + Math.sin(t * 2 + i) * 0.15)),
      };
    }
    case "laptop": {
      g.add(box(THREE, [1.3, 0.06, 0.85], m.metal, [0, 0.03, 0]));
      g.add(box(THREE, [1.1, 0.01, 0.45], m.dark, [0, 0.065, -0.1]));
      const lid = new THREE.Group();
      lid.add(box(THREE, [1.3, 0.85, 0.04], m.metal, [0, 0.425, 0]));
      lid.add(box(THREE, [1.18, 0.72, 0.01], m.screen, [0, 0.43, 0.025]));
      lid.position.set(0, 0.06, -0.42);
      lid.rotation.x = -0.25;
      g.add(lid);
      return { group: g };
    }
    case "phone": {
      const body = box(THREE, [0.62, 1.2, 0.08], m.dark, [0, 0.62, 0]);
      body.rotation.x = -0.18;
      const screen = box(THREE, [0.54, 1.08, 0.01], m.screen, [0, 0.62, 0.05]);
      screen.rotation.x = -0.18;
      g.add(body, screen);
      g.add(box(THREE, [0.5, 0.04, 0.3], m.dark, [0, 0.02, 0.1]));
      const hearts = [0, 1, 2].map((i) => {
        const heart = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), m.red);
        heart.position.set(0.42, 0.6 + i * 0.25, 0.1);
        g.add(heart);
        return heart;
      });
      return {
        group: g,
        tick: (t) =>
          hearts.forEach((heart, i) => {
            const phase = (t * 0.5 + i / 3) % 1;
            heart.position.y = 0.5 + phase * 0.9;
            heart.scale.setScalar(Math.sin(phase * Math.PI) + 0.01);
          }),
      };
    }
    case "camera": {
      g.add(box(THREE, [1.1, 0.68, 0.5], m.dark, [0, 0.4, 0]));
      g.add(box(THREE, [0.36, 0.16, 0.36], m.dark, [-0.25, 0.8, 0]));
      const lens = cylinder(THREE, 0.27, 0.42, m.ink, [0.05, 0.4, 0.42]);
      lens.rotation.x = Math.PI / 2;
      const glass = cylinder(THREE, 0.19, 0.02, m.screen, [0.05, 0.4, 0.64]);
      glass.rotation.x = Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 10, 40), m.accent);
      ring.position.set(0.05, 0.4, 0.6);
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), m.red);
      light.position.set(0.42, 0.66, 0.26);
      g.add(lens, glass, ring, light);
      return { group: g, tick: (t) => light.scale.setScalar(Math.sin(t * 4) > 0 ? 1 : 0.2) };
    }
    case "mic": {
      g.add(cylinder(THREE, 0.32, 0.06, m.dark, [0, 0.03, 0]));
      g.add(cylinder(THREE, 0.035, 0.7, m.metal, [0, 0.4, 0]));
      const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 8, 20), m.metal);
      head.position.y = 1.0;
      const band = cylinder(THREE, 0.215, 0.06, m.accent, [0, 0.92, 0]);
      g.add(head, band);
      const waves = [0, 1].map((i) => {
        const wave = new THREE.Mesh(
          new THREE.TorusGeometry(0.35 + i * 0.14, 0.012, 6, 40, Math.PI * 0.6),
          m.accent,
        );
        wave.position.y = 1.0;
        wave.rotation.z = -Math.PI * 0.3;
        g.add(wave);
        return wave;
      });
      return {
        group: g,
        tick: (t) => waves.forEach((w, i) => w.scale.setScalar(1 + ((t * 0.8 + i * 0.5) % 1) * 0.35)),
      };
    }
    case "megaphone": {
      const horn = cylinder(THREE, 0.42, 0.9, m.accent, [0, 0, 0], 0.16, 36);
      horn.rotation.z = -Math.PI / 2;
      horn.position.set(0.15, 0.6, 0);
      const back = cylinder(THREE, 0.17, 0.3, m.white, [-0.42, 0.6, 0]);
      back.rotation.z = -Math.PI / 2;
      const handle = box(THREE, [0.1, 0.36, 0.12], m.dark, [-0.25, 0.32, 0]);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 40), m.white);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(0.6, 0.6, 0);
      g.add(horn, back, handle, rim);
      return { group: g, tick: (t) => (g.rotation.z = Math.sin(t * 6) * 0.015) };
    }
    case "book": {
      const colours = [m.accent, m.white, m.ink];
      colours.forEach((material, i) => {
        const book = box(THREE, [1.0 - i * 0.08, 0.16, 0.72], material, [i * 0.03, 0.08 + i * 0.17, 0]);
        book.rotation.y = (i - 1) * 0.12;
        g.add(book);
        const pages = box(THREE, [0.96 - i * 0.08, 0.12, 0.02], m.white, [i * 0.03, 0.08 + i * 0.17, 0.36]);
        pages.rotation.y = book.rotation.y;
        g.add(pages);
      });
      const open = new THREE.Group();
      open.add(
        box(THREE, [0.42, 0.02, 0.56], m.white, [-0.22, 0, 0]),
        box(THREE, [0.42, 0.02, 0.56], m.white, [0.22, 0, 0]),
      );
      open.position.set(0.03, 0.6, 0);
      open.children[0]!.rotation.z = 0.15;
      open.children[1]!.rotation.z = -0.15;
      g.add(open);
      return { group: g };
    }
    case "box": {
      const parcel = box(THREE, [0.85, 0.7, 0.85], m.card, [0, 0.35, 0]);
      const tape = box(THREE, [0.87, 0.02, 0.18], m.tape, [0, 0.71, 0]);
      const tapeSide = box(THREE, [0.87, 0.5, 0.01], m.tape, [0, 0.46, 0.43]);
      tapeSide.scale.x = 0.2;
      const label = box(THREE, [0.3, 0.2, 0.01], m.white, [0.22, 0.3, 0.43]);
      const small = box(THREE, [0.45, 0.35, 0.45], m.card, [0.55, 0.175, 0.45]);
      small.rotation.y = 0.4;
      g.add(parcel, tape, tapeSide, label, small);
      return { group: g };
    }
    case "truck": {
      g.add(box(THREE, [1.05, 0.62, 0.62], m.white, [-0.2, 0.48, 0]));
      g.add(box(THREE, [0.42, 0.48, 0.6], m.accent, [0.55, 0.41, 0]));
      g.add(box(THREE, [0.02, 0.2, 0.5], m.ink, [0.77, 0.52, 0]));
      g.add(box(THREE, [1.05, 0.1, 0.63], m.accent, [-0.2, 0.22, 0]));
      const wheels = [-0.5, 0.0, 0.55].flatMap((x) =>
        [-0.3, 0.3].map((z) => {
          const wheel = cylinder(THREE, 0.13, 0.08, m.dark, [x, 0.13, z], 0.13, 20);
          wheel.rotation.x = Math.PI / 2;
          g.add(wheel);
          return wheel;
        }),
      );
      return { group: g, tick: (t) => wheels.forEach((w) => (w.rotation.y = t * 3)) };
    }
    case "gear": {
      const teeth = 12;
      const shape = new THREE.Shape();
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i / (teeth * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? 0.5 : 0.4;
        const a1 = angle - 0.1;
        const a2 = angle + 0.1;
        if (i === 0) shape.moveTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
        else shape.lineTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
        shape.lineTo(Math.cos(a2) * radius, Math.sin(a2) * radius);
      }
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.14, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.16,
        bevelEnabled: true,
        bevelSize: 0.02,
        bevelThickness: 0.02,
      });
      const big = new THREE.Mesh(geometry, m.metal);
      big.position.set(-0.15, 0.62, 0);
      const small = new THREE.Mesh(geometry, m.accent);
      small.scale.setScalar(0.6);
      small.position.set(0.42, 0.34, 0.05);
      g.add(big, small);
      return {
        group: g,
        tick: (t) => {
          big.rotation.z = t * 0.6;
          small.rotation.z = -t * 1.0 + 0.13;
        },
      };
    }
    case "globe": {
      g.add(cylinder(THREE, 0.3, 0.06, m.dark, [0, 0.03, 0]));
      g.add(cylinder(THREE, 0.04, 0.22, m.metal, [0, 0.15, 0]));
      const sphere = new THREE.Group();
      sphere.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 40, 28), m.blue));
      for (let i = 0; i < 5; i++) {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 2) * 0.06, 16, 12), m.leaf);
        const a = i * 1.3;
        const b = (i - 2) * 0.35;
        blob.position.set(
          Math.cos(a) * Math.cos(b) * 0.36,
          Math.sin(b) * 0.36,
          Math.sin(a) * Math.cos(b) * 0.36,
        );
        blob.scale.set(1, 0.6, 1);
        sphere.add(blob);
      }
      sphere.position.y = 0.75;
      sphere.rotation.z = 0.4;
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 48, Math.PI * 1.2), m.metal);
      arc.position.y = 0.75;
      arc.rotation.z = 0.4 - Math.PI * 0.1;
      g.add(sphere, arc);
      return { group: g, tick: (t) => (sphere.rotation.y = t * 0.5) };
    }
    case "trophy": {
      g.add(box(THREE, [0.6, 0.18, 0.6], m.dark, [0, 0.09, 0]));
      g.add(cylinder(THREE, 0.06, 0.32, m.gold, [0, 0.34, 0]));
      const cup = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            [0.06, 0],
            [0.3, 0.12],
            [0.38, 0.4],
            [0.4, 0.62],
            [0.37, 0.62],
          ].map(([x, y]) => new THREE.Vector2(x, y)),
          40,
        ),
        m.gold,
      );
      cup.position.y = 0.5;
      g.add(cup);
      for (const side of [-1, 1]) {
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 20, Math.PI), m.gold);
        handle.position.set(side * 0.38, 0.85, 0);
        handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        g.add(handle);
      }
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), m.accent);
      star.position.set(0, 0.8, 0.39);
      g.add(star);
      return { group: g, tick: (t) => (star.rotation.y = t * 2) };
    }
    case "clipboard": {
      const board = box(THREE, [0.85, 1.15, 0.05], m.card, [0, 0.6, 0]);
      board.rotation.x = -0.25;
      g.add(board);
      const sheet = new THREE.Group();
      sheet.add(box(THREE, [0.72, 0.95, 0.01], m.white, [0, 0, 0]));
      [0.28, 0.08, -0.12, -0.32].forEach((y, i) => {
        sheet.add(box(THREE, [0.38, 0.04, 0.012], m.ink, [0.08, y, 0.006]));
        sheet.add(box(THREE, [0.09, 0.09, 0.012], i < 3 ? m.accent : m.white, [-0.22, y, 0.006]));
      });
      sheet.position.set(0, 0.56, 0.04);
      sheet.rotation.x = -0.25;
      g.add(sheet);
      const clip = box(THREE, [0.32, 0.12, 0.08], m.metal, [0, 1.14, -0.1]);
      clip.rotation.x = -0.25;
      g.add(clip);
      g.add(box(THREE, [0.5, 0.04, 0.4], m.dark, [0, 0.02, 0.05]));
      return { group: g };
    }
    case "calendar": {
      const block = box(THREE, [1.0, 0.9, 0.18], m.white, [0, 0.47, 0]);
      block.rotation.x = -0.12;
      const top = box(THREE, [1.0, 0.22, 0.2], m.accent, [0, 0.86, 0.05]);
      top.rotation.x = -0.12;
      g.add(block, top);
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 4; col++) {
          const day = box(THREE, [0.14, 0.12, 0.01], row === 1 && col === 2 ? m.accent : m.ink, [
            -0.3 + col * 0.2,
            0.62 - row * 0.18,
            0.1 + row * 0.02,
          ]);
          day.rotation.x = -0.12;
          g.add(day);
        }
      for (const x of [-0.3, 0.3]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 20), m.metal);
        ring.position.set(x, 0.98, 0.04);
        ring.rotation.y = Math.PI / 2;
        g.add(ring);
      }
      return { group: g };
    }
    case "rocket": {
      const body = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            [0, 0],
            [0.22, 0.05],
            [0.27, 0.4],
            [0.24, 0.8],
            [0.14, 1.05],
            [0, 1.2],
          ].map(([x, y]) => new THREE.Vector2(x, y)),
          36,
        ),
        m.white,
      );
      body.position.y = 0.2;
      const window = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 24), m.accent);
      window.position.set(0, 0.95, 0.24);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), m.screen);
      glass.position.set(0, 0.95, 0.245);
      const rocket = new THREE.Group();
      rocket.add(body, window, glass);
      for (let i = 0; i < 3; i++) {
        const fin = box(THREE, [0.04, 0.32, 0.26], m.accent, [0, 0.32, 0]);
        const holder = new THREE.Group();
        fin.position.z = 0.3;
        holder.add(fin);
        holder.rotation.y = (i / 3) * Math.PI * 2;
        rocket.add(holder);
      }
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 20), m.glow);
      flame.rotation.x = Math.PI;
      flame.position.y = 0.05;
      rocket.add(flame);
      g.add(rocket);
      return {
        group: g,
        tick: (t) => {
          rocket.position.y = 0.06 + Math.sin(t * 2) * 0.06;
          flame.scale.y = 0.8 + Math.sin(t * 20) * 0.2;
        },
      };
    }
    case "target": {
      const board = new THREE.Group();
      [
        [0.55, m.white],
        [0.44, m.accent],
        [0.33, m.white],
        [0.22, m.accent],
        [0.11, m.white],
      ].forEach(([radius, material], i) => {
        const ring = cylinder(THREE, radius as number, 0.06, material as import("three").Material, [
          0,
          0,
          i * 0.012,
        ]);
        ring.rotation.x = Math.PI / 2;
        board.add(ring);
      });
      board.position.y = 0.62;
      const arrow = new THREE.Group();
      arrow.add(cylinder(THREE, 0.018, 0.7, m.dark, [0, 0, 0]));
      arrow.add(box(THREE, [0.12, 0.14, 0.01], m.red, [0, -0.3, 0]));
      arrow.rotation.x = Math.PI / 2 - 0.2;
      arrow.position.set(0.05, 0.66, 0.38);
      g.add(board, arrow, box(THREE, [0.08, 0.6, 0.08], m.dark, [0, 0.3, -0.1]));
      return { group: g, tick: (t) => (arrow.position.z = 0.38 + Math.max(0, Math.sin(t * 1.5)) * 0.05) };
    }
    case "coins": {
      const stacks: Array<[number, number, number]> = [
        [-0.3, 0, 5],
        [0.1, 0.15, 8],
        [0.45, -0.1, 3],
      ];
      for (const [x, z, count] of stacks)
        for (let i = 0; i < count; i++) {
          const coin = cylinder(
            THREE,
            0.2,
            0.06,
            m.gold,
            [x + Math.sin(i) * 0.015, 0.035 + i * 0.065, z],
            0.2,
            28,
          );
          g.add(coin);
        }
      const flipping = cylinder(THREE, 0.2, 0.05, m.gold, [0.1, 0.9, 0.15], 0.2, 28);
      g.add(flipping);
      return {
        group: g,
        tick: (t) => {
          flipping.rotation.x = t * 3;
          flipping.position.y = 0.85 + Math.abs(Math.sin(t * 1.5)) * 0.25;
        },
      };
    }
    case "clock": {
      const face = cylinder(THREE, 0.55, 0.12, m.white, [0, 0.62, 0], 0.55, 48);
      face.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 12, 48), m.accent);
      rim.position.set(0, 0.62, 0);
      g.add(face, rim, box(THREE, [0.5, 0.06, 0.3], m.dark, [0, 0.03, 0]));
      for (let i = 0; i < 12; i++) {
        const mark = box(THREE, [0.03, i % 3 === 0 ? 0.1 : 0.05, 0.01], m.ink, [0, 0, 0]);
        const a = (i / 12) * Math.PI * 2;
        mark.position.set(Math.sin(a) * 0.45, 0.62 + Math.cos(a) * 0.45, 0.065);
        mark.rotation.z = -a;
        g.add(mark);
      }
      const hour = new THREE.Group();
      hour.add(box(THREE, [0.04, 0.26, 0.01], m.ink, [0, 0.11, 0]));
      const minute = new THREE.Group();
      minute.add(box(THREE, [0.03, 0.38, 0.01], m.accent, [0, 0.17, 0]));
      hour.position.set(0, 0.62, 0.07);
      minute.position.set(0, 0.62, 0.075);
      g.add(hour, minute);
      return {
        group: g,
        tick: (t) => {
          minute.rotation.z = -t * 1.2;
          hour.rotation.z = -t * 0.1 - 1;
        },
      };
    }
    case "bulb": {
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), m.glow);
      glass.position.y = 0.8;
      g.add(glass);
      g.add(cylinder(THREE, 0.15, 0.24, m.metal, [0, 0.42, 0], 0.17));
      g.add(cylinder(THREE, 0.08, 0.08, m.dark, [0, 0.27, 0], 0.12));
      g.add(cylinder(THREE, 0.28, 0.08, m.dark, [0, 0.04, 0]));
      const rays = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const ray = box(THREE, [0.03, 0.16, 0.03], m.accent, [0, 0, 0]);
        const a = (i / 8) * Math.PI * 2;
        ray.position.set(Math.sin(a) * 0.58, Math.cos(a) * 0.58, 0);
        ray.rotation.z = -a;
        rays.add(ray);
      }
      rays.position.y = 0.8;
      g.add(rays);
      return {
        group: g,
        tick: (t) => {
          rays.scale.setScalar(1 + Math.sin(t * 2.5) * 0.08);
          rays.rotation.z = t * 0.3;
        },
      };
    }
    case "plant": {
      g.add(cylinder(THREE, 0.24, 0.42, m.pot, [0, 0.21, 0], 0.3));
      g.add(cylinder(THREE, 0.27, 0.04, m.dark, [0, 0.41, 0]));
      const leaves = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), m.leaf);
        const a = (i / 7) * Math.PI * 2;
        leaf.scale.set(0.5, 1.4, 0.25);
        leaf.position.set(Math.sin(a) * 0.16, 0.7 + (i % 3) * 0.12, Math.cos(a) * 0.16);
        leaf.rotation.set(Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5);
        leaves.add(leaf);
      }
      g.add(leaves);
      return { group: g, tick: (t) => (leaves.rotation.z = Math.sin(t * 1.2) * 0.04) };
    }
  }
}

export type StageLayout = "carousel" | "desk";

export function ObjectStage({
  kinds,
  selected,
  onSelect,
  accent,
  ink,
  layout,
  className = "",
}: {
  kinds: ObjectKind[];
  selected: number;
  onSelect: (index: number) => void;
  accent: string;
  /** The page's text colour, used for dark parts so objects suit the palette. */
  ink: string;
  layout: StageLayout;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    selectedRef.current = selected;
    onSelectRef.current = onSelect;
  });
  const key = kinds.join(",");

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const list = key.split(",").filter(Boolean) as ObjectKind[];
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      node.appendChild(renderer.domElement);
      renderer.domElement.style.cssText =
        "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      scene.add(new THREE.HemisphereLight("#ffffff", "#a89a88", 1.2));
      const sun = new THREE.DirectionalLight("#ffffff", 2.0);
      sun.position.set(4, 9, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
      sun.shadow.radius = 5;
      scene.add(sun);
      const rim = new THREE.DirectionalLight(accent, 1.0);
      rim.position.set(-6, 4, -6);
      scene.add(rim);
      const spot = new THREE.PointLight(accent, 6, 6, 1.6);
      scene.add(spot);

      const m = makeMaterials(THREE, accent, ink);
      const stage = new THREE.Group();
      scene.add(stage);

      // Each object sits in a holder: the holder is placed, the object lifts and turns inside it.
      const holders = list.map((kind, index) => {
        const built = build(THREE, kind, m);
        built.group.traverse((child) => {
          child.castShadow = true;
          child.userData.index = index;
        });
        const holder = new THREE.Group();
        holder.add(built.group);
        stage.add(holder);
        return { holder, built, lift: 0 };
      });

      const count = Math.max(1, list.length);
      const radius = Math.max(2.4, count * 0.62);
      const columns = Math.min(count <= 6 ? 3 : 4, count);
      const rows = Math.ceil(count / columns);
      if (layout === "carousel") {
        holders.forEach(({ holder }, index) => {
          const angle = (index / count) * Math.PI * 2;
          holder.position.set(Math.sin(angle) * radius, 0.24, Math.cos(angle) * radius);
          holder.rotation.y = angle;
          const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.24, 6), m.dark);
          pedestal.position.set(holder.position.x, 0.12, holder.position.z);
          pedestal.receiveShadow = true;
          pedestal.castShadow = true;
          pedestal.userData.index = index;
          const glow = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.02, 6, 6), m.screen);
          glow.rotation.x = Math.PI / 2;
          glow.rotation.z = Math.PI / 6;
          glow.position.set(holder.position.x, 0.245, holder.position.z);
          stage.add(pedestal, glow);
        });
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(radius + 1.6, 72),
          new THREE.ShadowMaterial({ opacity: 0.25 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        stage.add(floor);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 1.2, 0.012, 6, 120), m.screen);
        ring.rotation.x = Math.PI / 2;
        stage.add(ring);
        camera.position.set(0, 2.4 + radius * 0.75, radius * 2.0 + 3.4);
        camera.lookAt(0, 0.4, radius * 0.25);
      } else {
        const gap = 2.3;
        holders.forEach(({ holder }, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          const x = (col - (columns - 1) / 2) * gap;
          const z = (row - (rows - 1) / 2) * gap * 1.1;
          holder.position.set(x, 0.12, z);
          holder.scale.setScalar(1.2);
          holder.rotation.y = -0.35 + col * 0.12;
        });
        const width = columns * gap + 1.2;
        const depth = rows * gap + 1.0;
        const desk = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), m.white);
        desk.position.y = 0.06;
        desk.receiveShadow = true;
        stage.add(desk);
        // A soft mat in a pale tint of the accent, so the objects sit on colour, not bare white.
        const matColour = new THREE.Color(accent).lerp(new THREE.Color("#ffffff"), 0.72);
        const matMaterial = new THREE.MeshStandardMaterial({ color: matColour, roughness: 0.9 });
        const mat = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.02, depth - 0.4), matMaterial);
        mat.position.y = 0.13;
        mat.receiveShadow = true;
        stage.add(mat);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.03, depth + 0.02), m.accent);
        edge.position.y = 0.0;
        stage.add(edge);
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(width + 3, depth + 3),
          new THREE.ShadowMaterial({ opacity: 0.18 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -0.02;
        shadow.receiveShadow = true;
        stage.add(shadow);
        const span = Math.max(width, depth * 1.4);
        camera.position.set(0, span * 0.95, span * 1.45);
        camera.lookAt(0, 0.3, 0.2);
      }

      const resize = () => {
        const width = node.clientWidth || 1;
        const height = node.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(node);

      // Pointer: hover lifts an object, a click (not a drag) opens it, a drag turns the stage.
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const state = { angle: 0, target: 0, dragging: false, moved: 0, lastX: 0, hover: -1, tilt: 0 };
      const still = motionOff();
      const pick = (event: PointerEvent) => {
        const box = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          -((event.clientY - box.top) / box.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster
          .intersectObjects(stage.children, true)
          .find((h) => h.object.userData.index !== undefined);
        return hit ? (hit.object.userData.index as number) : -1;
      };
      const frontAngle = (index: number) => -(index / count) * Math.PI * 2;
      const nearest = (angle: number) => {
        const step = (Math.PI * 2) / count;
        return (((Math.round(-angle / step) % count) + count) % count) as number;
      };
      const down = (event: PointerEvent) => {
        state.dragging = true;
        state.moved = 0;
        state.lastX = event.clientX;
        renderer.domElement.style.cursor = "grabbing";
      };
      const move = (event: PointerEvent) => {
        if (state.dragging) {
          const dx = event.clientX - state.lastX;
          state.moved += Math.abs(dx);
          state.lastX = event.clientX;
          if (layout === "carousel") state.target += dx * 0.006;
          else state.tilt = Math.max(-0.6, Math.min(0.6, state.tilt + dx * 0.004));
          return;
        }
        if (event.target !== renderer.domElement) return;
        state.hover = pick(event);
        renderer.domElement.style.cursor = state.hover >= 0 ? "pointer" : "grab";
      };
      const up = (event: PointerEvent) => {
        if (!state.dragging) return;
        state.dragging = false;
        renderer.domElement.style.cursor = "grab";
        if (state.moved < 6) {
          const index = pick(event);
          if (index >= 0) onSelectRef.current(index);
        } else if (layout === "carousel") {
          onSelectRef.current(nearest(state.target));
        }
      };
      const leave = () => (state.hover = -1);
      renderer.domElement.addEventListener("pointerdown", down);
      renderer.domElement.addEventListener("pointerleave", leave);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);

      let shownSelection = -1;
      let frame = 0;
      const start = performance.now();
      const draw = (now: number) => {
        const t = (now - start) / 1000;
        const chosen = selectedRef.current;
        if (layout === "carousel") {
          if (chosen !== shownSelection && !state.dragging) {
            // Turn the shortest way round to the chosen object.
            const goal = frontAngle(chosen);
            const turn = Math.atan2(Math.sin(goal - state.target), Math.cos(goal - state.target));
            state.target += turn;
            shownSelection = chosen;
          }
          state.angle += (state.target - state.angle) * (still ? 1 : 0.08);
          stage.rotation.y = state.angle;
          stage.position.z = 0;
        } else {
          state.tilt *= state.dragging ? 1 : 0.96;
          stage.rotation.y = state.tilt + (still ? 0 : Math.sin(t * 0.25) * 0.05);
        }
        holders.forEach(({ built }, index) => {
          const active = index === chosen;
          const goal = active ? 0.35 : index === state.hover ? 0.18 : 0;
          const entry = holders[index]!;
          entry.lift += (goal - entry.lift) * (still ? 1 : 0.12);
          built.group.position.y = entry.lift + (active && !still ? Math.sin(t * 2) * 0.04 : 0);
          const scale = active ? 1.18 : 1;
          built.group.scale.setScalar(
            built.group.scale.x + (scale - built.group.scale.x) * (still ? 1 : 0.1),
          );
          if (active && !still) built.group.rotation.y += 0.008;
          if (!still) built.tick?.(t + index);
          else built.tick?.(1.2 + index);
        });
        // The light follows the chosen object.
        const target = holders[chosen]?.holder;
        if (target) {
          const at = target.getWorldPosition(new THREE.Vector3());
          spot.position.set(at.x, at.y + 2.2, at.z + 0.8);
        }
        renderer.render(scene, camera);
      };
      const loop = (now: number) => {
        draw(now);
        frame = requestAnimationFrame(loop);
      };
      if (still) draw(start);
      else frame = requestAnimationFrame(loop);
      // A still frame must follow clicks too.
      const redraw = still ? window.setInterval(() => draw(performance.now()), 300) : 0;

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.clearInterval(redraw);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", down);
        renderer.domElement.removeEventListener("pointerleave", leave);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        scene.traverse((object) => (object as import("three").Mesh).geometry?.dispose?.());
        Object.values(m).forEach((material) => material.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [key, accent, ink, layout]);

  return <div ref={host} className={`relative size-full ${className}`} />;
}

/** Shown only in the editor: how to change an object. */
export function ObjectHint() {
  return (
    <p className="mx-auto max-w-[84rem] px-5 pb-8 text-[13px] opacity-70 @3xl:px-10">
      To change an object, edit the project’s <strong>category</strong>. Try: {OBJECT_KINDS.join(", ")}. Words
      like “Logistics”, “Video” or “Campaign” work too.
    </p>
  );
}
