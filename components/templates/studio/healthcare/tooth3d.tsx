"use client";

import { useEffect, useRef } from "react";
import { motionOff } from "../motion";

/**
 * A 3D molar for the Enamel template, drawn in code with three.js (no model
 * file): a rounded crown with four cusps and a central fissure, two roots, a
 * soft shadow and a few sparkles in the accent colour. It turns slowly, can be
 * dragged round, and its enamel takes the whitening shade chosen below it.
 * three.js loads only when the template is shown; with reduced motion or in
 * still captures it draws one frame.
 */

/** VITA classical shades, darkest to whitest, with approximate screen colours. */
export const SHADES: Array<[name: string, colour: string]> = [
  ["A4", "#cdb07c"],
  ["A3.5", "#d6bc8b"],
  ["A3", "#dfc9a0"],
  ["B3", "#e2cfa6"],
  ["A2", "#e9dabb"],
  ["B2", "#efe3c8"],
  ["A1", "#f4ecd9"],
  ["B1", "#faf6ec"],
];

export function Tooth3D({
  shade,
  accent,
  className = "",
}: {
  /** Index into SHADES. */
  shade: number;
  accent: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  // The scene reads the latest shade without being rebuilt.
  const shadeRef = useRef(shade);
  const redrawRef = useRef<() => void>(() => {});
  useEffect(() => {
    shadeRef.current = shade;
    redrawRef.current();
  }, [shade]);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import("three"), import("three/addons/environments/RoomEnvironment.js")]).then(
      ([THREE, { RoomEnvironment }]) => {
        if (disposed) return;
        const still = motionOff();
        let renderer: import("three").WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          return; // No WebGL: the template's soft background stays on its own.
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setClearColor(0x000000, 0);
        node.appendChild(renderer.domElement);
        renderer.domElement.style.cssText =
          "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";

        const scene = new THREE.Scene();
        const environment = new THREE.PMREMGenerator(renderer);
        scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0.7, 8.4);
        camera.lookAt(0, -0.5, 0);

        // Crown: a rounded block with four cusps and a fissure across the biting surface.
        const smooth = THREE.MathUtils.smoothstep;
        const crown = new THREE.SphereGeometry(1, 128, 96);
        const position = crown.attributes.position!;
        const point = new THREE.Vector3();
        for (let i = 0; i < position.count; i++) {
          point.fromBufferAttribute(position, i);
          const n = 3.4;
          const k = Math.pow(Math.abs(point.x) ** n + Math.abs(point.y) ** n + Math.abs(point.z) ** n, 1 / n);
          point.divideScalar(k);
          let x = point.x;
          let y = point.y * 0.74;
          let z = point.z * 0.9;
          const neck = smooth(-y, 0, 0.74);
          x *= 1 - 0.24 * neck;
          z *= 1 - 0.2 * neck;
          x *= 1 + 0.05 * Math.sin(y * 2.2 + 0.6);
          if (y > 0) {
            const top = smooth(y, 0.4, 0.74);
            let cusps = 0;
            for (const [cx, cz] of [
              [0.44, 0.38],
              [-0.44, 0.38],
              [0.44, -0.38],
              [-0.44, -0.38],
            ] as const)
              cusps += Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.075);
            const fissure = Math.exp(-(x * x) / 0.01) * 0.9 + Math.exp(-(z * z) / 0.012) * 0.6;
            y += top * (cusps * 0.15 - 0.06 - fissure * 0.07);
          }
          position.setXYZ(i, x, y, z);
        }
        crown.computeVertexNormals();

        /** A tapering root, turned on a lathe. */
        const root = (length: number, radius: number) => {
          const points = [];
          for (let i = 0; i <= 40; i++) {
            const t = 1 - i / 40;
            const r = radius * (1 - t ** 1.5 * 0.7) * Math.sqrt(Math.max(0, 1 - t ** 6));
            points.push(new THREE.Vector2(Math.max(r, 0.002), -t * length));
          }
          return new THREE.LatheGeometry(points, 48);
        };

        const enamel = new THREE.MeshPhysicalMaterial({
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          sheen: 0.5,
          sheenRoughness: 0.6,
          sheenColor: new THREE.Color("#ffffff"),
          ior: 1.62,
          envMapIntensity: 1.15,
        });
        const dentin = new THREE.MeshPhysicalMaterial({
          roughness: 0.48,
          clearcoat: 0.35,
          clearcoatRoughness: 0.3,
          envMapIntensity: 0.9,
        });
        const tooth = new THREE.Group();
        tooth.add(new THREE.Mesh(crown, enamel));
        for (const [x, tilt, length, radius] of [
          [0.33, 0.1, 1.35, 0.38],
          [-0.33, -0.1, 1.28, 0.37],
        ] as const) {
          const mesh = new THREE.Mesh(root(length, radius), dentin);
          mesh.position.set(x, -0.42, 0);
          mesh.rotation.z = tilt;
          tooth.add(mesh);
        }
        const holder = new THREE.Group();
        holder.add(tooth);
        scene.add(holder);

        // A soft shadow under the tooth, painted on a small canvas.
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = shadowCanvas.height = 128;
        const paint = shadowCanvas.getContext("2d")!;
        const gradient = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(11,34,54,.32)");
        gradient.addColorStop(1, "rgba(11,34,54,0)");
        paint.fillStyle = gradient;
        paint.fillRect(0, 0, 128, 128);
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(3.2, 3.2),
          new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(shadowCanvas),
            transparent: true,
            depthWrite: false,
          }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -2.25;
        scene.add(shadow);

        // Sparkles in the accent colour, at fixed places (no randomness, so captures match).
        const count = 40;
        const spots = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const angle = i * 2.399;
          const radius = 1.7 + ((i * 37) % 11) / 10;
          const height = (((i * 53) % 34) - 17) / 10;
          spots.set([Math.cos(angle) * radius, height, Math.sin(angle) * radius], i * 3);
        }
        const sparkGeometry = new THREE.BufferGeometry();
        sparkGeometry.setAttribute("position", new THREE.BufferAttribute(spots, 3));
        const sparkMaterial = new THREE.PointsMaterial({
          size: 0.07,
          color: new THREE.Color(accent),
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });
        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        scene.add(sparks);

        scene.add(new THREE.HemisphereLight("#ffffff", "#cfe8ec", 0.7));
        const key = new THREE.DirectionalLight("#ffffff", 1.6);
        key.position.set(3, 4, 5);
        scene.add(key);
        const rim = new THREE.DirectionalLight(new THREE.Color(accent), 1.4);
        rim.position.set(-4, 1.5, -3);
        scene.add(rim);

        const applyShade = () => {
          const colour = SHADES[shadeRef.current]?.[1] ?? SHADES[4]![1];
          enamel.color.set(colour);
          dentin.color.set(colour).lerp(new THREE.Color("#d8bf8f"), 0.45);
        };

        // Drag to turn.
        const turn = { yaw: 0, pitch: 0, dragging: false, x: 0, y: 0 };
        const down = (event: PointerEvent) => {
          turn.dragging = true;
          turn.x = event.clientX;
          turn.y = event.clientY;
          renderer.domElement.style.cursor = "grabbing";
        };
        const move = (event: PointerEvent) => {
          if (!turn.dragging) return;
          turn.yaw += (event.clientX - turn.x) * 0.01;
          turn.pitch = Math.max(-0.5, Math.min(0.5, turn.pitch + (event.clientY - turn.y) * 0.006));
          turn.x = event.clientX;
          turn.y = event.clientY;
          if (still) draw(performance.now());
        };
        const up = () => {
          turn.dragging = false;
          renderer.domElement.style.cursor = "grab";
        };
        renderer.domElement.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);

        const resize = () => {
          const width = node.clientWidth || 1;
          const height = node.clientHeight || 1;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const sized = new ResizeObserver(() => {
          resize();
          if (still) draw(performance.now());
        });
        sized.observe(node);
        resize();

        const start = performance.now();
        const draw = (now: number) => {
          const t = still ? 1.4 : (now - start) / 1000;
          applyShade();
          holder.rotation.y = t * 0.32 + turn.yaw;
          holder.rotation.x = 0.28 + turn.pitch * 0.7;
          tooth.position.y = 0.35 + (still ? 0 : Math.sin(t * 1.1) * 0.07);
          sparks.rotation.y = -t * 0.06;
          renderer.render(scene, camera);
        };

        // Animate only while on screen.
        let frame = 0;
        let visible = true;
        const loop = (now: number) => {
          draw(now);
          frame = visible ? requestAnimationFrame(loop) : 0;
        };
        const onScreen = new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (visible && !still && !frame) frame = requestAnimationFrame(loop);
        });
        onScreen.observe(node);
        if (still) draw(start);
        else frame = requestAnimationFrame(loop);
        redrawRef.current = () => draw(performance.now());

        cleanup = () => {
          cancelAnimationFrame(frame);
          sized.disconnect();
          onScreen.disconnect();
          renderer.domElement.removeEventListener("pointerdown", down);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          scene.traverse((object) => (object as import("three").Mesh).geometry?.dispose?.());
          enamel.dispose();
          dentin.dispose();
          sparkMaterial.dispose();
          environment.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          redrawRef.current = () => {};
        };
      },
    );

    return () => {
      disposed = true;
      cleanup();
    };
  }, [accent]);

  return <div ref={host} aria-hidden className={`relative size-full ${className}`} />;
}
