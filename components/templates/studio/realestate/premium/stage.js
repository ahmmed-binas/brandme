// Premium agent templates (Monolith, Tide, Blueprint, Dune, Atlas): the shared 3D stage.
// Adapted from the standalone pages so it can live inside React: everything it adds
// (listeners, observers, the render loop, GPU memory) is undone by stage.destroy().
import * as THREE from "three";

export { THREE };

const AED = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
export const fmtAED = (n) => "AED " + AED.format(Math.round(n));
export const fmtNum = (n) => AED.format(Math.round(n));

/** Reduced motion, or a static capture (thumbnails set data-static on <html>). */
export const isStill = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.static !== undefined);

/**
 * One renderer per hero. Caps the pixel ratio, pauses when off screen or the tab is
 * hidden, renders a few still frames when motion is off, and returns null without WebGL.
 * Options: dpr, fov, near, far, alpha, toneMapping, exposure, bloom {strength, radius, threshold}.
 */
export function createStage(canvas, opts = {}) {
  const {
    dpr = 1.75,
    fov = 38,
    near = 0.1,
    far = 4000,
    alpha = false,
    toneMapping = THREE.ACESFilmicToneMapping,
    exposure = 1,
  } = opts;
  const still = isStill();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  const cleanups = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };

  const stage = {
    THREE,
    renderer,
    scene,
    camera,
    still,
    time: 0,
    frame: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    scroll: 0, // 0..1 progress of the canvas leaving the viewport
    onFrame: [],
    onResize: [],
    onDestroy: [],
    width: 1,
    height: 1,
    destroyed: false,
  };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    stage.width = w;
    stage.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.onResize.forEach((f) => f(w, h));
    stage.invalidate();
  }

  // Drag to orbit: horizontal drags turn the view, vertical drags tilt it; touch keeps page scrolling.
  const orbit = (stage.orbit = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, active: false, touched: false });
  canvas.style.touchAction = "pan-y";
  canvas.style.cursor = "grab";
  let drag = null;
  on(canvas, "pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
    orbit.active = true;
    if (!orbit.touched) {
      orbit.touched = true;
      opts.onFirstDrag?.();
    }
    stage.invalidate();
  });
  on(canvas, "pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    orbit.tyaw += (e.clientX - drag.x) * 0.006;
    orbit.tpitch = Math.max(-0.45, Math.min(0.6, orbit.tpitch + (e.clientY - drag.y) * 0.004));
    drag.x = e.clientX;
    drag.y = e.clientY;
    stage.invalidate();
  });
  const endDrag = () => {
    drag = null;
    orbit.active = false;
    canvas.style.cursor = "grab";
  };
  on(canvas, "pointerup", endDrag);
  on(canvas, "pointercancel", endDrag);
  on(canvas, "keydown", (e) => {
    const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
    if (!k) return;
    e.preventDefault();
    orbit.tyaw += k[0];
    orbit.tpitch = Math.max(-0.45, Math.min(0.6, orbit.tpitch + k[1]));
    stage.invalidate();
  });
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", opts.label || "3D view. Drag, or use the arrow keys, to look around.");

  // Optional bloom, loaded on demand so pages without it stay light.
  if (opts.bloom) {
    Promise.all([
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
    ])
      .then(([{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }]) => {
        if (stage.destroyed) return;
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const { strength = 0.7, radius = 0.6, threshold = 0.82 } = opts.bloom;
        const bloom = new UnrealBloomPass(new THREE.Vector2(stage.width, stage.height), strength, radius, threshold);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(stage.width, stage.height);
        stage.composer = composer;
        stage.bloom = bloom;
        stage.onResize.push((w, h) => composer.setSize(w, h));
        stage.onDestroy.push(() => composer.dispose());
        stage.invalidate();
      })
      .catch(() => {
        // Bloom is decorative; render without it.
      });
  }

  let visible = true;
  let running = false;
  let last = 0;
  let quiet = 0;
  let frameId = 0;
  function loop(now) {
    if (stage.destroyed || !visible || document.hidden) {
      running = false;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const p = stage.pointer;
    p.x += (p.tx - p.x) * 0.045;
    p.y += (p.ty - p.y) * 0.045;
    orbit.yaw += (orbit.tyaw - orbit.yaw) * (still ? 1 : 0.09);
    orbit.pitch += (orbit.tpitch - orbit.pitch) * (still ? 1 : 0.09);
    const r = canvas.getBoundingClientRect();
    stage.scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    if (!still) stage.time += dt;
    stage.onFrame.forEach((f) => f(stage.time, dt));
    if (stage.composer) stage.composer.render();
    else renderer.render(scene, camera);
    stage.frame++;
    // Motion off: a few frames so lazy textures and the environment settle, then stop.
    if (still && ++quiet > 3) {
      running = false;
      return;
    }
    frameId = requestAnimationFrame(loop);
  }
  stage.invalidate = () => {
    quiet = 0;
    if (stage.destroyed || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    frameId = requestAnimationFrame(loop);
  };

  const resizer = new ResizeObserver(resize);
  resizer.observe(canvas);
  const viewer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      stage.invalidate();
    },
    { rootMargin: "100px" },
  );
  viewer.observe(canvas);
  on(document, "visibilitychange", stage.invalidate);
  if (!still) {
    // The pointer, relative to the canvas, gives the camera a gentle parallax.
    on(
      window,
      "pointermove",
      (e) => {
        const box = canvas.getBoundingClientRect();
        stage.pointer.tx = ((e.clientX - box.left) / Math.max(1, box.width)) * 2 - 1;
        stage.pointer.ty = ((e.clientY - box.top) / Math.max(1, box.height)) * 2 - 1;
      },
      { passive: true },
    );
  }

  stage.destroy = () => {
    stage.destroyed = true;
    cancelAnimationFrame(frameId);
    resizer.disconnect();
    viewer.disconnect();
    cleanups.forEach((f) => f());
    stage.onDestroy.forEach((f) => f());
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      for (const material of list) {
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose();
      }
    });
    scene.environment?.dispose?.();
    renderer.dispose();
  };

  resize();
  return stage;
}

// GLSL helpers shared by the template shaders.
export const GLSL_NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + 17.1; a *= .5; } return s; }
`;

/** Seeded random numbers, so scenes look the same on every load. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
