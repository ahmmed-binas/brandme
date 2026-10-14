"use client";

import { useEffect, useRef } from "react";
import { motionOff } from "./motion";

/**
 * An interactive 3D vehicle for the instructor templates (Lane, Altitude):
 * a car, motorbike, bus or light aircraft, drawn in code with three.js so it
 * is ours to ship (no model files). Drag to turn it; the car's front wheels
 * steer and the plane banks towards the pointer; the propeller spins.
 * three.js is loaded only when this component mounts, so other templates
 * never download it. One still frame when motion is off.
 */

export type VehicleKind = "car" | "bike" | "bus" | "plane";

type Three = typeof import("three");

/** A tube between two points, for frames, struts and handlebars. */
function tube(
  THREE: Three,
  a: [number, number, number],
  b: [number, number, number],
  radius: number,
  material: import("three").Material,
) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const length = start.distanceTo(end);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  return mesh;
}

function materials(THREE: Three, accent: string) {
  return {
    paint: new THREE.MeshStandardMaterial({ color: accent, metalness: 0.35, roughness: 0.32 }),
    white: new THREE.MeshStandardMaterial({ color: "#f3f2ee", metalness: 0.2, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: "#16202b", metalness: 0.7, roughness: 0.12 }),
    tyre: new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9 }),
    rim: new THREE.MeshStandardMaterial({ color: "#c9ccd1", metalness: 0.8, roughness: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: "#2a2c30", metalness: 0.4, roughness: 0.5 }),
    light: new THREE.MeshStandardMaterial({ color: "#fff6d8", emissive: "#fff2c0", emissiveIntensity: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: "#ff3b3b", emissive: "#d01010", emissiveIntensity: 0.7 }),
  };
}

type Built = {
  group: import("three").Group;
  steer?: import("three").Object3D[];
  spin?: import("three").Object3D[];
};

function wheel(THREE: Three, m: ReturnType<typeof materials>, radius: number, width: number) {
  const group = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 28), m.tyre);
  tyre.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.02, 18),
    m.rim,
  );
  rim.rotation.x = Math.PI / 2;
  group.add(tyre, rim);
  group.traverse((child) => (child.castShadow = true));
  return group;
}

function buildCar(THREE: Three, m: ReturnType<typeof materials>): Built {
  const group = new THREE.Group();
  // Side profile, extruded across the width.
  const profile = new THREE.Shape();
  profile.moveTo(-2.1, 0.35);
  [
    [2.1, 0.35],
    [2.12, 0.74],
    [1.9, 0.86],
    [0.92, 0.96],
    [0.36, 1.38],
    [-1.02, 1.42],
    [-1.72, 0.98],
    [-2.12, 0.86],
  ].forEach(([x, y]) => profile.lineTo(x!, y!));
  profile.closePath();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(profile, {
      depth: 1.62,
      bevelEnabled: true,
      bevelSize: 0.09,
      bevelThickness: 0.09,
      bevelSegments: 4,
    }),
    m.paint,
  );
  body.geometry.translate(0, 0, -0.81);
  body.castShadow = true;
  group.add(body);
  // Glass: the cabin band, a little wider than the body so it shows on both sides.
  const glassShape = new THREE.Shape();
  glassShape.moveTo(0.86, 1.0);
  [
    [0.38, 1.32],
    [-0.98, 1.36],
    [-1.62, 1.0],
  ].forEach(([x, y]) => glassShape.lineTo(x!, y!));
  glassShape.closePath();
  const glass = new THREE.Mesh(
    new THREE.ExtrudeGeometry(glassShape, { depth: 1.84, bevelEnabled: false }),
    m.glass,
  );
  glass.geometry.translate(0, 0, -0.92);
  group.add(glass);
  // Lights.
  for (const z of [-0.58, 0.58]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.34), m.light);
    head.position.set(2.2, 0.66, z);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), m.red);
    tail.position.set(-2.2, 0.7, z);
    group.add(head, tail);
  }
  // Driving school roof sign.
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.34), m.white);
  sign.position.set(-0.3, 1.62, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.07, 0.36), m.paint);
  stripe.position.set(-0.3, 1.62, 0);
  group.add(sign, stripe);
  // Wheels; the front pair steers.
  const steer: import("three").Object3D[] = [];
  for (const [x, z] of [
    [1.32, 0.86],
    [1.32, -0.86],
    [-1.36, 0.86],
    [-1.36, -0.86],
  ] as const) {
    const w = wheel(THREE, m, 0.4, 0.3);
    w.position.set(x, 0.4, z);
    group.add(w);
    if (x > 0) steer.push(w);
  }
  return { group, steer };
}

function buildBike(THREE: Three, m: ReturnType<typeof materials>): Built {
  const group = new THREE.Group();
  for (const x of [0.78, -0.72]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.09, 14, 36), m.tyre);
    t.position.set(x, 0.45, 0);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), m.rim);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.45, 0);
    group.add(t, hub);
  }
  const tank = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m.paint);
  tank.scale.set(0.42, 0.2, 0.24);
  tank.position.set(0.12, 1.02, 0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.26), m.dark);
  seat.position.set(-0.36, 0.98, 0);
  const tailPiece = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.2), m.paint);
  tailPiece.position.set(-0.72, 1.0, 0);
  tailPiece.rotation.z = 0.25;
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.3), m.dark);
  engine.position.set(0.0, 0.62, 0);
  group.add(tank, seat, tailPiece, engine);
  group.add(tube(THREE, [0.78, 0.45, 0.06], [0.52, 1.12, 0.06], 0.035, m.rim));
  group.add(tube(THREE, [0.78, 0.45, -0.06], [0.52, 1.12, -0.06], 0.035, m.rim));
  group.add(tube(THREE, [0.48, 1.14, -0.34], [0.48, 1.14, 0.34], 0.03, m.dark));
  group.add(tube(THREE, [-0.72, 0.45, 0], [-0.1, 0.72, 0], 0.04, m.dark));
  group.add(tube(THREE, [0.48, 1.08, 0], [-0.4, 0.92, 0], 0.045, m.paint));
  group.add(tube(THREE, [-0.2, 0.5, 0.18], [-0.95, 0.62, 0.18], 0.05, m.rim));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), m.light);
  lamp.position.set(0.66, 1.0, 0);
  group.add(lamp);
  group.traverse((child) => (child.castShadow = true));
  return { group };
}

function buildBus(THREE: Three, m: ReturnType<typeof materials>): Built {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.7, 1.9), m.paint);
  body.position.y = 1.25;
  body.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 1.8), m.white);
  roof.position.y = 2.16;
  const ac = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.0), m.white);
  ac.position.set(-0.6, 2.3, 0);
  const band = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.62, 1.94), m.glass);
  band.position.set(-0.15, 1.58, 0);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.7), m.glass);
  screen.position.set(2.62, 1.55, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.24, 0.12, 1.94), m.white);
  stripe.position.y = 1.0;
  group.add(body, roof, ac, band, screen, stripe);
  for (const z of [-0.62, 0.62]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.32), m.light);
    head.position.set(2.62, 0.72, z);
    group.add(head);
  }
  const steer: import("three").Object3D[] = [];
  for (const [x, z] of [
    [1.7, 0.92],
    [1.7, -0.92],
    [-1.6, 0.92],
    [-1.6, -0.92],
  ] as const) {
    const w = wheel(THREE, m, 0.46, 0.32);
    w.position.set(x, 0.46, z);
    group.add(w);
    if (x > 0) steer.push(w);
  }
  group.position.x = -0.1;
  return { group, steer };
}

function buildPlane(THREE: Three, m: ReturnType<typeof materials>): Built {
  const group = new THREE.Group();
  // Fuselage: a lathe profile from nose (y=0) to tail (y=4.4), turned to lie along x.
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
  const fuselage = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), m.white);
  fuselage.geometry.rotateZ(Math.PI / 2);
  fuselage.geometry.translate(2.2, 0, 0);
  fuselage.castShadow = true;
  group.add(fuselage);
  // Stripe and cabin glass.
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.4, 2.2, 32, 1, true), m.paint);
  stripe.rotation.z = Math.PI / 2;
  stripe.position.set(-0.2, -0.08, 0);
  stripe.scale.set(1, 1, 1);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 1.02), m.glass);
  cabin.position.set(1.0, 0.22, 0);
  group.add(stripe, cabin);
  // High wing with coloured tips, and struts.
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 7.2), m.white);
  wing.position.set(0.95, 0.56, 0);
  wing.castShadow = true;
  group.add(wing);
  for (const z of [-3.45, 3.45]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.97, 0.11, 0.3), m.paint);
    tip.position.set(0.95, 0.56, z);
    group.add(tip);
  }
  group.add(tube(THREE, [0.95, -0.3, 0.45], [0.8, 0.52, 1.9], 0.03, m.dark));
  group.add(tube(THREE, [0.95, -0.3, -0.45], [0.8, 0.52, -1.9], 0.03, m.dark));
  // Tail: stabiliser and fin.
  const stab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 2.4), m.white);
  stab.position.set(-1.95, 0.08, 0);
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
  group.add(stab, fin);
  // Propeller and spinner.
  const prop = new THREE.Group();
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 20), m.paint);
  spinner.rotation.z = -Math.PI / 2;
  spinner.position.x = 0.12;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.7, 0.14), m.dark);
  prop.add(spinner, blade);
  prop.position.set(2.24, 0, 0);
  group.add(prop);
  // Landing gear.
  for (const [x, z] of [
    [0.6, 0.75],
    [0.6, -0.75],
    [1.9, 0],
  ] as const) {
    group.add(tube(THREE, [x, -0.35, z * 0.4], [x, -0.72, z], 0.03, m.dark));
    const w = wheel(THREE, m, 0.16, 0.12);
    w.position.set(x, -0.78, z);
    group.add(w);
  }
  group.traverse((child) => (child.castShadow = true));
  group.position.y = 0.9;
  return { group, spin: [prop] };
}

export function Vehicle3D({
  kind,
  accent,
  className = "",
  road = true,
}: {
  kind: VehicleKind;
  accent: string;
  className?: string;
  /** A round piece of road with lane markings under ground vehicles. */
  road?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
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
      const camera = new THREE.PerspectiveCamera(kind === "plane" ? 30 : 32, 1, 0.1, 100);
      const view: Record<VehicleKind, [number, number, number]> = {
        car: [6.4, 3.4, 7.2],
        bike: [3.8, 2.2, 4.4],
        bus: [8.4, 4.4, 9.2],
        plane: [7.2, 3.2, 9.6],
      };
      camera.position.set(...view[kind]);
      camera.lookAt(0, kind === "bus" ? 1.0 : kind === "plane" ? 0.8 : 0.6, 0);

      scene.add(new THREE.HemisphereLight("#ffffff", "#c9b9a0", 1.25));
      const sun = new THREE.DirectionalLight("#ffffff", 2.1);
      sun.position.set(5, 9, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -6;
      sun.shadow.camera.right = 6;
      sun.shadow.camera.top = 6;
      sun.shadow.camera.bottom = -6;
      sun.shadow.radius = 6;
      scene.add(sun);
      const rim = new THREE.DirectionalLight(accent, 0.8);
      rim.position.set(-6, 3, -5);
      scene.add(rim);

      const m = materials(THREE, accent);
      const built =
        kind === "car"
          ? buildCar(THREE, m)
          : kind === "bike"
            ? buildBike(THREE, m)
            : kind === "bus"
              ? buildBus(THREE, m)
              : buildPlane(THREE, m);
      const turntable = new THREE.Group();
      turntable.add(built.group);
      scene.add(turntable);

      if (kind !== "plane") {
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(kind === "bus" ? 4.4 : 3.4, 64),
          new THREE.ShadowMaterial({ opacity: 0.22 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.receiveShadow = true;
        turntable.add(shadow);
        if (road) {
          const radius = kind === "bus" ? 4.3 : kind === "bike" ? 2.0 : 3.3;
          const asphalt = new THREE.Mesh(
            new THREE.CircleGeometry(radius, 64),
            new THREE.MeshStandardMaterial({
              color: "#2b2d31",
              roughness: 0.95,
              transparent: true,
              opacity: 0.92,
            }),
          );
          asphalt.rotation.x = -Math.PI / 2;
          asphalt.position.y = -0.005;
          asphalt.receiveShadow = true;
          turntable.add(asphalt);
          const dash = new THREE.MeshStandardMaterial({ color: "#f5f1e6", roughness: 0.6 });
          for (let x = -radius + 0.4; x < radius - 0.4; x += 0.9) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.08), dash);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.002, kind === "bike" ? 0.55 : 1.35);
            turntable.add(line);
          }
        }
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

      // Drag to turn (with a little inertia); the pointer steers or banks.
      const state = {
        angle: kind === "plane" ? -0.6 : -0.5,
        velocity: 0,
        dragging: false,
        lastX: 0,
        pointerX: 0,
        pointerY: 0,
      };
      const still = motionOff();
      const down = (event: PointerEvent) => {
        state.dragging = true;
        state.lastX = event.clientX;
        renderer.domElement.style.cursor = "grabbing";
      };
      const move = (event: PointerEvent) => {
        const box = node.getBoundingClientRect();
        state.pointerX = ((event.clientX - box.left) / box.width) * 2 - 1;
        state.pointerY = ((event.clientY - box.top) / box.height) * 2 - 1;
        if (!state.dragging) return;
        state.velocity = (event.clientX - state.lastX) * 0.008;
        state.angle += state.velocity;
        state.lastX = event.clientX;
      };
      const up = () => {
        state.dragging = false;
        renderer.domElement.style.cursor = "grab";
      };
      renderer.domElement.addEventListener("pointerdown", down);
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);

      let frame = 0;
      const start = performance.now();
      const draw = (now: number) => {
        const t = (now - start) / 1000;
        if (!still && !state.dragging) {
          state.velocity *= 0.94;
          state.angle += state.velocity + 0.0025;
        }
        turntable.rotation.y = state.angle;
        for (const w of built.steer ?? []) w.rotation.y += (-state.pointerX * 0.45 - w.rotation.y) * 0.1;
        for (const p of built.spin ?? []) p.rotation.x = still ? 0.6 : t * 28;
        if (kind === "plane" && !still) {
          built.group.position.y = 0.9 + Math.sin(t * 1.3) * 0.12;
          built.group.rotation.x += (state.pointerX * 0.35 - built.group.rotation.x) * 0.05;
          built.group.rotation.z += (-state.pointerY * 0.18 - built.group.rotation.z) * 0.05;
        }
        renderer.render(scene, camera);
      };
      const loop = (now: number) => {
        draw(now);
        frame = requestAnimationFrame(loop);
      };
      if (still) draw(start);
      else frame = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", down);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        scene.traverse((object) => {
          const mesh = object as import("three").Mesh;
          mesh.geometry?.dispose?.();
        });
        Object.values(m).forEach((material) => material.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [kind, accent, road]);

  return <div ref={host} aria-hidden className={`relative size-full ${className}`} />;
}
