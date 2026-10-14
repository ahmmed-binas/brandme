"use client";

import { useEffect, useRef } from "react";
import { motionOff } from "./motion";

/**
 * Interactive 3D vehicles for the instructor templates (Lane, Throttle,
 * Route, Altitude), drawn in code with three.js so they are ours to ship (no
 * model files, no licences to track).
 *
 * Ground vehicles drive along an endless road: the road, lane markings and
 * roadside scroll past, the wheels turn and the body rides the bumps. Drag
 * anywhere on the road and the vehicle follows your finger across the lanes,
 * steering and signalling; let go and it settles into the nearest lane. A tap
 * parks it with the hazard lights on; another tap drives off again.
 *
 * The plane flies through drifting clouds; drag to fly it up, down, forwards
 * and back (it pitches and banks as it goes); a tap makes it roll.
 *
 * Reflections come from a soft studio environment, so paint, glass and chrome
 * look real. three.js loads only when this component mounts. One still frame
 * when motion is off.
 */

/** Fades the scene's edges into the page. */
const FADE = "radial-gradient(ellipse closest-side at 50% 50%, #000 62%, transparent 100%)";

export type VehicleKind = "car" | "bike" | "bus" | "plane";

type Three = typeof import("three");
type Object3D = import("three").Object3D;
type Material = import("three").Material;

/** A tube between two points, for frames, forks, struts and handlebars. */
function tube(
  THREE: Three,
  a: [number, number, number],
  b: [number, number, number],
  radius: number,
  material: Material,
) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 12),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return mesh;
}

function box(THREE: Three, size: [number, number, number], material: Material, at: [number, number, number]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  return mesh;
}

/** Text drawn on a canvas, for number plates, the roof sign and the bus display. */
function label(THREE: Three, text: string, background: string, ink: string, width = 512, height = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.fillStyle = ink;
  context.font = `700 ${Math.round(height * 0.62)}px system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2 + height * 0.04);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function materials(THREE: Three, accent: string) {
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: accent,
      metalness: 0.45,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    white: new THREE.MeshPhysicalMaterial({
      color: "#f4f4f1",
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#0d141c",
      metalness: 0.2,
      roughness: 0.04,
      clearcoat: 1,
      envMapIntensity: 1.6,
    }),
    chrome: new THREE.MeshStandardMaterial({ color: "#e6e8eb", metalness: 1, roughness: 0.12 }),
    rim: new THREE.MeshStandardMaterial({ color: "#b9bec6", metalness: 0.9, roughness: 0.22 }),
    tyre: new THREE.MeshStandardMaterial({ color: "#151517", roughness: 0.82 }),
    trim: new THREE.MeshStandardMaterial({ color: "#1d1f23", metalness: 0.3, roughness: 0.55 }),
    head: new THREE.MeshStandardMaterial({
      color: "#fffaf0",
      emissive: "#fff3cf",
      emissiveIntensity: 1.4,
      roughness: 0.1,
    }),
    tail: new THREE.MeshStandardMaterial({
      color: "#d4141c",
      emissive: "#c00a12",
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
    amber: new THREE.MeshStandardMaterial({
      color: "#ff9a1a",
      emissive: "#ff8a00",
      emissiveIntensity: 0,
      roughness: 0.3,
    }),
  };
}

type Materials = ReturnType<typeof materials>;

type Built = {
  group: import("three").Group;
  /** Front wheels or the bike's fork: turn left and right. */
  steer: Object3D[];
  /** Everything that rolls: spins with speed. */
  wheels: { object: Object3D; radius: number }[];
  /** Indicator lights: [left side, right side]. */
  indicators: [Object3D[], Object3D[]];
  /** The plane's propeller. */
  spin?: Object3D[];
  /** Length along the road, used to place the camera. */
  size: number;
};

/** A wheel: a tyre with a spoked rim. The returned group spins about z. */
function wheel(THREE: Three, m: Materials, radius: number, width: number, spokes = 5) {
  const spin = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.78, radius * 0.24, 16, 40), m.tyre);
  tyre.scale.z = width / (radius * 0.48);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width * 0.7, 32), m.rim);
  rim.rotation.x = Math.PI / 2;
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, width * 0.82, 16),
    m.chrome,
  );
  hub.rotation.x = Math.PI / 2;
  spin.add(tyre, rim, hub);
  for (let i = 0; i < spokes; i++) {
    const spoke = box(THREE, [radius * 0.1, radius * 0.52, width * 0.76], m.chrome, [0, radius * 0.3, 0]);
    const holder = new THREE.Group();
    holder.add(spoke);
    holder.rotation.z = (i / spokes) * Math.PI * 2;
    spin.add(holder);
  }
  spin.traverse((child) => (child.castShadow = true));
  return spin;
}

function buildCar(THREE: Three, m: Materials): Built {
  const group = new THREE.Group();
  // Side profile with soft curves, extruded across the width and rounded by the bevel.
  const shape = new THREE.Shape();
  shape.moveTo(-2.1, 0.3);
  shape.lineTo(2.0, 0.3);
  shape.quadraticCurveTo(2.2, 0.32, 2.2, 0.56);
  shape.lineTo(2.17, 0.74);
  shape.quadraticCurveTo(2.1, 0.88, 1.8, 0.92);
  shape.lineTo(0.88, 1.02);
  shape.lineTo(0.3, 1.42);
  shape.quadraticCurveTo(0.12, 1.5, -0.2, 1.5);
  shape.lineTo(-1.05, 1.48);
  shape.quadraticCurveTo(-1.3, 1.46, -1.5, 1.3);
  shape.lineTo(-1.8, 1.06);
  shape.lineTo(-2.1, 1.0);
  shape.quadraticCurveTo(-2.22, 0.96, -2.22, 0.74);
  shape.lineTo(-2.2, 0.45);
  shape.quadraticCurveTo(-2.18, 0.3, -2.1, 0.3);
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 1.66,
      bevelEnabled: true,
      bevelSize: 0.13,
      bevelThickness: 0.13,
      bevelSegments: 8,
      curveSegments: 16,
    }),
    m.white,
  );
  body.geometry.translate(0, 0, -0.83);
  group.add(body);
  // A stripe in the accent colour along each side, and dark sills.
  for (const side of [-1, 1]) {
    group.add(box(THREE, [3.6, 0.1, 0.02], m.paint, [0.05, 0.72, side * 0.97]));
    group.add(box(THREE, [3.0, 0.14, 0.04], m.trim, [-0.05, 0.36, side * 0.95]));
  }
  // Side windows: a glass band just proud of the body, split by a pillar.
  const windows = new THREE.Shape();
  windows.moveTo(0.82, 1.05);
  windows.lineTo(0.32, 1.38);
  windows.quadraticCurveTo(0.15, 1.44, -0.15, 1.44);
  windows.lineTo(-1.0, 1.42);
  windows.quadraticCurveTo(-1.22, 1.4, -1.4, 1.27);
  windows.lineTo(-1.66, 1.07);
  windows.closePath();
  const sideGlass = new THREE.Mesh(
    new THREE.ExtrudeGeometry(windows, { depth: 1.95, bevelEnabled: false, curveSegments: 12 }),
    m.glass,
  );
  sideGlass.geometry.translate(0, 0, -0.975);
  group.add(sideGlass);
  group.add(box(THREE, [0.1, 0.42, 1.97], m.white, [-0.42, 1.22, 0]));
  // Windscreen and rear window follow the roof's slopes.
  const screen = box(THREE, [0.7, 0.02, 1.6], m.glass, [0.6, 1.23, 0]);
  screen.rotation.z = Math.atan2(1.42 - 1.02, 0.3 - 0.88) + Math.PI;
  group.add(screen);
  const rear = box(THREE, [0.42, 0.02, 1.55], m.glass, [-1.64, 1.2, 0]);
  rear.rotation.z = Math.atan2(1.3 - 1.06, -1.5 + 1.8);
  group.add(rear);
  // Wheel arches (dark wells), lights, grille, mirrors and handles.
  for (const x of [1.32, -1.36]) {
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.47, 1.97, 32, 1, false, -Math.PI / 2, Math.PI),
      m.trim,
    );
    arch.rotation.x = Math.PI / 2;
    arch.position.set(x, 0.38, 0);
    group.add(arch);
  }
  for (const z of [-0.62, 0.62]) {
    const head = box(THREE, [0.08, 0.13, 0.38], m.head, [2.27, 0.7, z]);
    head.rotation.y = z > 0 ? -0.18 : 0.18;
    group.add(head);
    group.add(box(THREE, [0.08, 0.12, 0.36], m.tail, [-2.3, 0.82, z]));
  }
  group.add(box(THREE, [0.06, 0.18, 0.9], m.trim, [2.3, 0.46, 0]));
  group.add(box(THREE, [0.04, 0.03, 0.9], m.chrome, [2.32, 0.57, 0]));
  for (const side of [-1, 1]) {
    const mirror = box(THREE, [0.22, 0.14, 0.12], m.paint, [0.72, 1.08, side * 1.06]);
    group.add(mirror);
    group.add(box(THREE, [0.02, 0.1, 0.1], m.glass, [0.6, 1.08, side * 1.06]));
    for (const x of [0.25, -0.75])
      group.add(box(THREE, [0.18, 0.04, 0.03], m.chrome, [x, 0.95, side * 0.985]));
  }
  // Learner plates front and back, and the driving school roof sign.
  const plate = new THREE.MeshStandardMaterial({
    map: label(THREE, "L", "#ffffff", "#e0141e", 128, 128),
    roughness: 0.5,
  });
  const front = box(THREE, [0.02, 0.3, 0.3], plate, [2.34, 0.5, 0.42]);
  const back = box(THREE, [0.02, 0.3, 0.3], plate, [-2.36, 0.62, -0.42]);
  group.add(front, back);
  const signTexture = label(THREE, "DRIVING SCHOOL", "#ffffff", "#15171b", 512, 96);
  const signFace = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.35 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.4), [
    m.white,
    m.white,
    m.paint,
    m.white,
    signFace,
    signFace,
  ]);
  sign.position.set(-0.5, 1.72, 0);
  sign.castShadow = true;
  group.add(sign);
  // Indicators at the four corners.
  const indicators: [Object3D[], Object3D[]] = [[], []];
  for (const [x, z] of [
    [2.24, 0.86],
    [2.24, -0.86],
    [-2.28, 0.84],
    [-2.28, -0.84],
  ] as const) {
    const light = box(THREE, [0.07, 0.07, 0.14], m.amber, [x, 0.72, z]);
    group.add(light);
    indicators[z > 0 ? 0 : 1].push(light);
  }
  // Wheels: steer groups (front) hold spinning wheels.
  const steer: Object3D[] = [];
  const wheels: Built["wheels"] = [];
  for (const [x, z] of [
    [1.32, 0.84],
    [1.32, -0.84],
    [-1.36, 0.84],
    [-1.36, -0.84],
  ] as const) {
    const pivot = new THREE.Group();
    const spinning = wheel(THREE, m, 0.38, 0.26);
    pivot.add(spinning);
    pivot.position.set(x, 0.38, z);
    group.add(pivot);
    wheels.push({ object: spinning, radius: 0.38 });
    if (x > 0) steer.push(pivot);
  }
  group.traverse((child) => (child.castShadow = true));
  return { group, steer, wheels, indicators, size: 4.6 };
}

async function buildBus(THREE: Three, m: Materials): Promise<Built> {
  const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
  const group = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(6.4, 2.45, 2.3, 5, 0.2), m.white);
  body.position.y = 1.62;
  group.add(body);
  group.add(box(THREE, [6.3, 0.34, 2.32], m.paint, [0, 0.62, 0]));
  group.add(box(THREE, [6.42, 0.08, 2.34], m.paint, [0, 1.12, 0]));
  // Window band with pillars, and the big windscreen.
  group.add(box(THREE, [5.2, 0.86, 2.34], m.glass, [-0.35, 2.02, 0]));
  for (let x = -2.7; x <= 2.0; x += 1.15) group.add(box(THREE, [0.1, 0.88, 2.36], m.white, [x, 2.02, 0]));
  const screen = box(THREE, [0.06, 1.25, 2.0], m.glass, [3.2, 1.98, 0]);
  screen.rotation.z = 0.06;
  group.add(screen);
  // Door on the near side.
  group.add(box(THREE, [0.9, 1.6, 0.04], m.glass, [2.35, 1.52, 1.16]));
  group.add(box(THREE, [0.04, 1.6, 0.05], m.chrome, [2.35, 1.52, 1.17]));
  // Destination display.
  const display = new THREE.MeshStandardMaterial({
    map: label(THREE, "DRIVING SCHOOL", "#111317", "#ffb21a", 512, 80),
    emissive: "#ffffff",
    emissiveMap: label(THREE, "DRIVING SCHOOL", "#111317", "#ffb21a", 512, 80),
    emissiveIntensity: 0.8,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.26), display);
  sign.rotation.y = Math.PI / 2;
  sign.position.set(3.22, 2.68, 0);
  group.add(sign);
  // Roof air conditioning, lights, mirrors on arms, learner plate.
  group.add(box(THREE, [1.8, 0.24, 1.3], m.white, [-0.8, 2.96, 0]));
  for (const z of [-0.78, 0.78]) {
    group.add(box(THREE, [0.06, 0.16, 0.42], m.head, [3.22, 0.84, z]));
    group.add(box(THREE, [0.06, 0.3, 0.2], m.tail, [-3.22, 1.0, z]));
  }
  for (const side of [-1, 1]) {
    group.add(tube(THREE, [3.0, 2.4, side * 1.1], [3.45, 2.4, side * 1.35], 0.025, m.trim));
    group.add(box(THREE, [0.08, 0.42, 0.2], m.trim, [3.48, 2.18, side * 1.36]));
  }
  const plate = new THREE.MeshStandardMaterial({ map: label(THREE, "L", "#ffffff", "#e0141e", 128, 128) });
  group.add(box(THREE, [0.02, 0.34, 0.34], plate, [3.23, 0.62, -0.6]));
  const indicators: [Object3D[], Object3D[]] = [[], []];
  for (const [x, z] of [
    [3.2, 1.08],
    [3.2, -1.08],
    [-3.2, 1.08],
    [-3.2, -1.08],
  ] as const) {
    const light = box(THREE, [0.07, 0.09, 0.14], m.amber, [x, 0.84, z]);
    group.add(light);
    indicators[z > 0 ? 0 : 1].push(light);
  }
  const steer: Object3D[] = [];
  const wheels: Built["wheels"] = [];
  for (const [x, z] of [
    [2.1, 0.98],
    [2.1, -0.98],
    [-1.9, 0.98],
    [-1.9, -0.98],
  ] as const) {
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 2.33, 32, 1, false, -Math.PI / 2, Math.PI),
      m.trim,
    );
    arch.rotation.x = Math.PI / 2;
    arch.position.set(x, 0.5, 0);
    group.add(arch);
    const pivot = new THREE.Group();
    const spinning = wheel(THREE, m, 0.5, 0.32, 8);
    pivot.add(spinning);
    pivot.position.set(x, 0.5, z);
    group.add(pivot);
    wheels.push({ object: spinning, radius: 0.5 });
    if (x > 0) steer.push(pivot);
  }
  group.traverse((child) => (child.castShadow = true));
  return { group, steer, wheels, indicators, size: 7 };
}

function buildBike(THREE: Three, m: Materials): Built {
  const group = new THREE.Group();
  const wheels: Built["wheels"] = [];
  // Rear wheel on the swingarm.
  const rear = wheel(THREE, m, 0.36, 0.16, 6);
  rear.position.set(-0.74, 0.36, 0);
  group.add(rear);
  wheels.push({ object: rear, radius: 0.36 });
  // The fork turns with the handlebars and holds the front wheel.
  const fork = new THREE.Group();
  fork.position.set(0.62, 0, 0);
  const front = wheel(THREE, m, 0.36, 0.14, 6);
  front.position.set(0.18, 0.36, 0);
  fork.add(front);
  wheels.push({ object: front, radius: 0.36 });
  for (const z of [-0.09, 0.09]) fork.add(tube(THREE, [0.18, 0.36, z], [-0.08, 1.12, z], 0.03, m.chrome));
  fork.add(tube(THREE, [-0.1, 1.16, -0.38], [-0.1, 1.16, 0.38], 0.025, m.trim));
  for (const z of [-0.38, 0.38]) fork.add(tube(THREE, [-0.1, 1.16, z], [-0.1, 1.16, z * 1.22], 0.04, m.trim));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), m.head);
  lamp.scale.set(0.6, 1, 1);
  lamp.position.set(0.06, 0.98, 0);
  fork.add(lamp);
  // A small fairing with a tinted screen.
  const fairing = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI), m.paint);
  fairing.rotation.y = -Math.PI / 2;
  fairing.scale.set(0.8, 0.9, 1.1);
  fairing.position.set(-0.02, 1.0, 0);
  fork.add(fairing);
  const screen = box(THREE, [0.02, 0.24, 0.3], m.glass, [-0.06, 1.24, 0]);
  screen.rotation.z = 0.35;
  fork.add(screen);
  group.add(fork);
  // Tank, seat, tail, engine, exhaust and frame.
  const tank = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), m.paint);
  tank.scale.set(0.42, 0.2, 0.25);
  tank.position.set(0.18, 1.0, 0);
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 16), m.trim);
  seat.rotation.z = Math.PI / 2 - 0.08;
  seat.scale.z = 1.3;
  seat.position.set(-0.38, 0.98, 0);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 20), m.paint);
  tail.rotation.z = Math.PI / 2 + 0.25;
  tail.position.set(-0.84, 1.02, 0);
  const engine = box(THREE, [0.48, 0.36, 0.3], m.trim, [0.02, 0.6, 0]);
  group.add(tank, seat, tail, engine);
  for (let i = 0; i < 4; i++) group.add(box(THREE, [0.5, 0.02, 0.32], m.rim, [0.02, 0.5 + i * 0.07, 0]));
  group.add(tube(THREE, [-0.2, 0.46, 0.18], [-0.98, 0.66, 0.2], 0.06, m.chrome));
  group.add(tube(THREE, [0.58, 1.1, 0], [-0.3, 0.9, 0], 0.045, m.paint));
  group.add(tube(THREE, [-0.74, 0.36, 0.12], [-0.06, 0.56, 0.12], 0.035, m.trim));
  group.add(tube(THREE, [-0.74, 0.36, -0.12], [-0.06, 0.56, -0.12], 0.035, m.trim));
  group.add(box(THREE, [0.04, 0.08, 0.14], m.tail, [-1.08, 1.04, 0]));
  const plate = new THREE.MeshStandardMaterial({ map: label(THREE, "L", "#ffffff", "#e0141e", 128, 128) });
  group.add(box(THREE, [0.02, 0.18, 0.18], plate, [-1.06, 0.86, 0]));
  const indicators: [Object3D[], Object3D[]] = [[], []];
  for (const [x, y, z] of [
    [0.6, 0.98, 0.16],
    [0.6, 0.98, -0.16],
    [-1.02, 0.98, 0.12],
    [-1.02, 0.98, -0.12],
  ] as const) {
    const light = box(THREE, [0.06, 0.05, 0.05], m.amber, [x, y, z]);
    group.add(light);
    indicators[z > 0 ? 0 : 1].push(light);
  }
  group.traverse((child) => (child.castShadow = true));
  return { group, steer: [fork], wheels, indicators, size: 2.2 };
}

function buildPlane(THREE: Three, m: Materials): Built {
  const group = new THREE.Group();
  const profile = [
    [0, 0],
    [0.3, 0.12],
    [0.44, 0.5],
    [0.5, 1.0],
    [0.5, 1.9],
    [0.38, 2.9],
    [0.2, 3.9],
    [0.1, 4.35],
    [0, 4.4],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const fuselage = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), m.white);
  fuselage.geometry.rotateZ(Math.PI / 2);
  fuselage.geometry.translate(2.2, 0, 0);
  group.add(fuselage);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.4, 2.2, 40, 1, true), m.paint);
  stripe.rotation.z = Math.PI / 2;
  stripe.position.set(-0.2, -0.08, 0);
  group.add(stripe);
  group.add(box(THREE, [1.1, 0.34, 1.02], m.glass, [1.0, 0.22, 0]));
  const wing = box(THREE, [0.95, 0.1, 7.2], m.white, [0.95, 0.56, 0]);
  group.add(wing);
  for (const z of [-3.45, 3.45]) group.add(box(THREE, [0.97, 0.11, 0.3], m.paint, [0.95, 0.56, z]));
  group.add(tube(THREE, [0.95, -0.3, 0.45], [0.8, 0.52, 1.9], 0.03, m.trim));
  group.add(tube(THREE, [0.95, -0.3, -0.45], [0.8, 0.52, -1.9], 0.03, m.trim));
  group.add(box(THREE, [0.6, 0.06, 2.4], m.white, [-1.95, 0.08, 0]));
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.75, 0);
  finShape.lineTo(-0.7, 0.85);
  finShape.lineTo(-0.35, 0.85);
  finShape.closePath();
  const fin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(finShape, { depth: 0.06, bevelEnabled: false }),
    m.paint,
  );
  fin.position.set(-1.55, 0.12, -0.03);
  group.add(fin);
  const prop = new THREE.Group();
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 24), m.paint);
  spinner.rotation.z = -Math.PI / 2;
  spinner.position.x = 0.12;
  prop.add(spinner, box(THREE, [0.05, 1.7, 0.14], m.trim, [0, 0, 0]));
  prop.position.set(2.24, 0, 0);
  group.add(prop);
  const wheels: Built["wheels"] = [];
  for (const [x, z] of [
    [0.6, 0.75],
    [0.6, -0.75],
    [1.9, 0],
  ] as const) {
    group.add(tube(THREE, [x, -0.35, z * 0.4], [x, -0.72, z], 0.03, m.trim));
    const w = wheel(THREE, m, 0.16, 0.12, 3);
    w.position.set(x, -0.78, z);
    group.add(w);
  }
  const indicators: [Object3D[], Object3D[]] = [[], []];
  // Navigation lights: red on the left wingtip, green on the right.
  const red = box(THREE, [0.1, 0.08, 0.06], m.tail, [0.95, 0.56, -3.62]);
  const green = new THREE.MeshStandardMaterial({
    color: "#19d46a",
    emissive: "#12c060",
    emissiveIntensity: 1,
  });
  group.add(red, box(THREE, [0.1, 0.08, 0.06], green, [0.95, 0.56, 3.62]));
  group.traverse((child) => (child.castShadow = true));
  return { group, steer: [], wheels, indicators, spin: [prop], size: 7.4 };
}

/** A simple roadside tree: trunk and two cones. */
function tree(THREE: Three, leaf: Material, bark: Material) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 8), bark);
  trunk.position.y = 0.4;
  const low = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.4, 10), leaf);
  low.position.y = 1.3;
  const high = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 10), leaf);
  high.position.y = 1.95;
  group.add(trunk, low, high);
  group.traverse((child) => (child.castShadow = true));
  return group;
}

/** A soft cloud of a few white spheres. */
function cloud(THREE: Three, material: Material, seed: number) {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.7 + ((seed + i) % 3) * 0.25, 14, 10), material);
    puff.position.set(i * 0.75 - 1.5, Math.sin(i * 1.7 + seed) * 0.25, Math.cos(i * 2.1 + seed) * 0.4);
    puff.scale.y = 0.7;
    group.add(puff);
  }
  return group;
}

export function Vehicle3D({
  kind,
  accent,
  background = "#15161b",
  className = "",
}: {
  kind: VehicleKind;
  accent: string;
  /** The page colour behind the scene: the road and clouds fade into it. */
  background?: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      node.appendChild(renderer.domElement);
      renderer.domElement.style.cssText =
        "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";

      const scene = new THREE.Scene();
      // Soft studio reflections make the paint, glass and chrome read as real.
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = environment;
      scene.fog = new THREE.Fog(background, kind === "plane" ? 16 : 14, kind === "plane" ? 40 : 34);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
      scene.add(new THREE.HemisphereLight("#ffffff", "#8c8070", 0.7));
      const sun = new THREE.DirectionalLight("#fff6e8", 2.2);
      sun.position.set(6, 10, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
      sun.shadow.radius = 5;
      scene.add(sun, sun.target);

      const m = materials(THREE, accent);
      const built =
        kind === "car"
          ? buildCar(THREE, m)
          : kind === "bike"
            ? buildBike(THREE, m)
            : kind === "bus"
              ? await buildBus(THREE, m)
              : buildPlane(THREE, m);
      if (disposed) return;
      // The rig moves across the road; the body inside it rides the bumps and leans.
      const rig = new THREE.Group();
      const body = new THREE.Group();
      body.add(built.group);
      rig.add(body);
      scene.add(rig);

      const extras: Material[] = [];
      const scenery: { object: Object3D; spacing: number; span: number }[] = [];
      const lanes = kind === "bike" ? [-1.4, 0, 1.4] : [-2.6, 0, 2.6];
      const scale = Math.max(0.62, built.size / 4.6);

      if (kind !== "plane") {
        const roadWidth = lanes[2]! - lanes[0]! + (kind === "bike" ? 2.4 : 3.6);
        const asphalt = new THREE.MeshStandardMaterial({ color: "#2b2e33", roughness: 0.92 });
        const paintLine = new THREE.MeshStandardMaterial({ color: "#f2efe6", roughness: 0.6 });
        const kerb = new THREE.MeshStandardMaterial({ color: "#c9c4b8", roughness: 0.8 });
        const verge = new THREE.MeshStandardMaterial({ color: "#5c7d4c", roughness: 1 });
        const leaf = new THREE.MeshStandardMaterial({ color: "#3e7a45", roughness: 0.9 });
        const bark = new THREE.MeshStandardMaterial({ color: "#5a4030", roughness: 1 });
        extras.push(asphalt, paintLine, kerb, verge, leaf, bark);
        const road = new THREE.Mesh(new THREE.PlaneGeometry(120, roadWidth), asphalt);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        scene.add(road);
        for (const side of [-1, 1]) {
          const edge = box(THREE, [120, 0.12, 0.3], kerb, [0, 0.06, side * (roadWidth / 2 + 0.15)]);
          edge.receiveShadow = true;
          const grass = new THREE.Mesh(new THREE.PlaneGeometry(120, 14), verge);
          grass.rotation.x = -Math.PI / 2;
          grass.position.set(0, -0.01, side * (roadWidth / 2 + 7.3));
          grass.receiveShadow = true;
          scene.add(edge, grass);
          const line = box(THREE, [120, 0.01, 0.1], paintLine, [0, 0.005, side * (roadWidth / 2 - 0.3)]);
          scene.add(line);
        }
        // Dashed lines between lanes, and trees along the verges, scroll past.
        const dashGap = 3 * Math.max(1, scale);
        for (let i = 0; i < 40; i++)
          for (const z of [(lanes[0]! + lanes[1]!) / 2, (lanes[1]! + lanes[2]!) / 2]) {
            const dash = box(THREE, [1.4 * Math.max(0.7, scale), 0.01, 0.1], paintLine, [0, 0.006, z]);
            dash.receiveShadow = true;
            scene.add(dash);
            scenery.push({ object: dash, spacing: i * dashGap, span: 40 * dashGap });
          }
        for (let i = 0; i < 14; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const t = tree(THREE, leaf, bark);
          t.scale.setScalar(Math.max(1, scale) * (0.8 + (i % 3) * 0.2));
          t.position.z = side * (roadWidth / 2 + (side > 0 ? 5 : 2.2) + (i % 4) * 0.8);
          scene.add(t);
          scenery.push({ object: t, spacing: i * 6, span: 84 });
        }
        rig.position.z = lanes[1]!;
        camera.position.set(7.2 * scale + 1.2, 3.4 * scale + 0.6, 8.2 * scale + 1.4);
        camera.lookAt(0.3, 0.7 * scale, 0);
        sun.target.position.set(0, 0, 0);
      } else {
        const white = new THREE.MeshStandardMaterial({
          color: "#ffffff",
          roughness: 1,
          transparent: true,
          opacity: 0.88,
          fog: false,
        });
        extras.push(white);
        for (let i = 0; i < 12; i++) {
          const c = cloud(THREE, white, i);
          c.position.set(0, ((i * 37) % 9) - 4.5, -4 - ((i * 13) % 14));
          c.scale.setScalar(0.8 + (i % 4) * 0.35);
          scene.add(c);
          scenery.push({ object: c, spacing: i * 6, span: 72 });
        }
        camera.position.set(6.4, 1.6, 10.5);
        camera.lookAt(0.2, 0.2, 0);
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

      // ——— Interaction ———
      const still = motionOff();
      const cruise = kind === "plane" ? 9 : kind === "bus" ? 7 : kind === "bike" ? 8 : 9;
      const state = {
        dragging: false,
        moved: 0,
        lastX: 0,
        lastY: 0,
        driving: true,
        speed: cruise,
        travel: 0,
        targetX: 0,
        targetY: 0,
        targetZ: lanes[1]!,
        roll: 0,
        rolling: -1,
      };
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const sky = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();
      /** Where the pointer touches the road (or, for the plane, the plane's own flight plane). */
      const aim = (event: PointerEvent) => {
        const box = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          -((event.clientY - box.top) / box.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        return raycaster.ray.intersectPlane(kind === "plane" ? sky : ground, hit);
      };
      const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
      const follow = (event: PointerEvent) => {
        if (!aim(event)) return;
        if (kind === "plane") {
          state.targetX = clamp(hit.x, -2.5, 2.5);
          state.targetY = clamp(hit.y, -1.6, 1.8);
        } else {
          state.targetZ = clamp(hit.z, lanes[0]! - 0.4, lanes[2]! + 0.4);
          state.targetX = clamp(hit.x, -1.6 * scale, 1.6 * scale);
        }
      };
      const down = (event: PointerEvent) => {
        state.dragging = true;
        state.moved = 0;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        renderer.domElement.style.cursor = "grabbing";
      };
      const move = (event: PointerEvent) => {
        if (!state.dragging) return;
        state.moved += Math.abs(event.clientX - state.lastX) + Math.abs(event.clientY - state.lastY);
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        if (state.moved > 6) follow(event);
      };
      const up = () => {
        if (!state.dragging) return;
        state.dragging = false;
        renderer.domElement.style.cursor = "grab";
        if (state.moved <= 6) {
          // A tap: park or drive off (ground), or roll (plane).
          if (kind === "plane") state.rolling = 0;
          else state.driving = !state.driving;
          if (still) draw(performance.now());
          return;
        }
        if (kind !== "plane") {
          // Settle into the nearest lane, and drift back to the middle of the view.
          state.targetZ = lanes.reduce(
            (best, lane) => (Math.abs(lane - state.targetZ) < Math.abs(best - state.targetZ) ? lane : best),
            lanes[1]!,
          );
          state.targetX = 0;
        }
        if (still) draw(performance.now());
      };
      renderer.domElement.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);

      let frame = 0;
      let last = performance.now();
      const start = last;
      const draw = (now: number) => {
        const t = still ? 1.4 : (now - start) / 1000;
        const dt = still ? 0 : Math.min(0.05, (now - last) / 1000);
        last = now;
        const goal = kind === "plane" || state.driving ? cruise * (state.dragging ? 1.25 : 1) : 0;
        state.speed += (goal - state.speed) * Math.min(1, dt * 1.6);
        state.travel += state.speed * dt;
        const pace = still ? 0.6 : state.speed / cruise;

        for (const item of scenery) {
          const along = (((item.spacing - state.travel) % item.span) + item.span) % item.span;
          item.object.position.x = along - item.span / 2;
        }
        for (const { object, radius } of built.wheels) object.rotation.z = -(state.travel || 2) / radius;
        for (const p of built.spin ?? []) p.rotation.x = still ? 0.6 : t * 30;

        if (kind === "plane") {
          const ease = still ? 1 : Math.min(1, dt * 2.2);
          const vy = (state.targetY - rig.position.y) * ease;
          rig.position.x += (state.targetX - rig.position.x) * ease;
          rig.position.y += vy;
          // Pitch with the climb, a gentle bank and bob, and the occasional full roll.
          body.rotation.z += (clamp(vy * 6, -0.4, 0.4) - body.rotation.z) * Math.min(1, dt * 4 || 1);
          if (state.rolling >= 0) {
            state.rolling += dt / 1.1;
            body.rotation.x = Math.sin(state.rolling * Math.PI * 0.5) ** 2 * Math.PI * 2;
            if (state.rolling >= 1) {
              state.rolling = -1;
              body.rotation.x = 0;
            }
          } else {
            body.rotation.x = Math.sin(t * 0.9) * 0.08;
          }
          body.position.y = Math.sin(t * 1.3) * 0.12;
          rig.rotation.y = still ? -0.35 : -0.35 + Math.sin(t * 0.3) * 0.05;
        } else {
          const ease = still ? 1 : Math.min(1, dt * 2.6);
          const vz = (state.targetZ - rig.position.z) * ease;
          rig.position.z += vz;
          rig.position.x += (state.targetX - rig.position.x) * ease;
          // Turn into the lane change, steer the wheels, lean (bike) or roll (car, bus).
          const turn = clamp(-vz * (dt ? 1 / dt : 0) * 0.06, -0.35, 0.35);
          rig.rotation.y += (turn - rig.rotation.y) * Math.min(1, dt * 6 || 1);
          for (const s of built.steer) s.rotation.y += (turn * 1.6 - s.rotation.y) * Math.min(1, dt * 8 || 1);
          body.rotation.x = kind === "bike" ? turn * 0.9 : turn * 0.12;
          body.position.y = Math.sin(t * 13) * 0.012 * pace + Math.sin(t * 5.3) * 0.008 * pace;
          // Indicators: blink towards a lane change, or all four when parked.
          const changing = Math.abs(state.targetZ - rig.position.z) > 0.25;
          const blink = Math.floor(t * 2.6) % 2 === 0 ? 1.6 : 0;
          const left = !state.driving || (changing && state.targetZ > rig.position.z);
          const right = !state.driving || (changing && state.targetZ < rig.position.z);
          for (const [index, side] of built.indicators.entries())
            for (const light of side) {
              const on = (index === 0 ? left : right) && blink > 0;
              (light as import("three").Mesh).material = on ? onAmber : m.amber;
            }
        }
        renderer.render(scene, camera);
      };
      const onAmber = m.amber.clone();
      onAmber.emissiveIntensity = 2.4;
      extras.push(onAmber);
      const loop = (now: number) => {
        draw(now);
        frame = requestAnimationFrame(loop);
      };
      // Pause while off screen.
      const visibility = new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(frame);
        if (entry?.isIntersecting && !still) {
          last = performance.now();
          frame = requestAnimationFrame(loop);
        }
      });
      if (still) draw(start);
      else visibility.observe(node);

      cleanup = () => {
        cancelAnimationFrame(frame);
        visibility.disconnect();
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", down);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        scene.traverse((object) => {
          const mesh = object as import("three").Mesh;
          mesh.geometry?.dispose?.();
          const list = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
          for (const material of list) {
            (material as import("three").MeshStandardMaterial).map?.dispose();
            material.dispose();
          }
        });
        [...Object.values(m), ...extras].forEach((material) => material.dispose());
        environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [kind, accent, background]);

  return (
    <div
      ref={host}
      aria-hidden
      className={`relative size-full ${className}`}
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    />
  );
}
