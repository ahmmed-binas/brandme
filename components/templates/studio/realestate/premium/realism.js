// Premium agent templates: realism kit (adapted from the standalone pages).
// Physical sky + image-based lighting, PBR glass facades with real window panes, and mirror water.
// Everything is generated in code except the two CC0 Poly Haven skies (public/samples/re/sky).
import { THREE, rng } from './stage.js';

export async function loadAddons() {
  const [{ Sky }, { Water }, BGU] = await Promise.all([
    import('three/addons/objects/Sky.js'),
    import('three/addons/objects/Water.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
  ]);
  return { Sky, Water, mergeGeometries: BGU.mergeGeometries };
}

/* ---------- Sky and image-based lighting ---------- */
// One physical sky drawn in the scene, and a PMREM copy of it set as scene.environment
// so glass, steel and water reflect the same sky the viewer sees.
export function physicalSky(stage, Sky, opts = {}) {
  const { renderer, scene } = stage;
  const sky = new Sky();
  sky.scale.setScalar(20000);
  scene.add(sky);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(20000);
  envScene.add(envSky);
  const extra = opts.envExtras || [];
  extra.forEach((o) => envScene.add(o));
  const pmrem = new THREE.PMREMGenerator(renderer);
  stage.onDestroy.push(() => { pmrem.dispose(); rt?.dispose(); });
  let rt = null;
  const sun = new THREE.Vector3();
  const set = ({ elevation, azimuth, turbidity = 6, rayleigh = 2, mie = 0.005, mieG = 0.8 }) => {
    const phi = THREE.MathUtils.degToRad(90 - elevation), theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    for (const s of [sky, envSky]) {
      const u = s.material.uniforms;
      u.turbidity.value = turbidity; u.rayleigh.value = rayleigh;
      u.mieCoefficient.value = mie; u.mieDirectionalG.value = mieG;
      u.sunPosition.value.copy(sun);
    }
  };
  const bake = () => {
    if (rt) rt.dispose();
    rt = pmrem.fromScene(envScene, 0, 0.1, 30000);
    scene.environment = rt.texture;
  };
  set(opts); bake();
  return { sky, sun, set, bake, envScene };
}

// Night environment: a dark gradient dome plus glowing panels standing in for the lit city,
// so reflective glass picks up warm streaks instead of black.
export function nightEnvironment(stage, { zenith = '#04070d', horizon = '#1a1a2a', glow = '#ff9a50', glows = 40, seed = 7 } = {}) {
  const { renderer, scene } = stage;
  const env = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { z: { value: new THREE.Color(zenith) }, h: { value: new THREE.Color(horizon) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 z; uniform vec3 h; varying vec3 vD; void main(){ gl_FragColor = vec4(mix(h, z, smoothstep(-.05, .45, vD.y)) * (vD.y < 0. ? .3 : 1.), 1.); }',
  }));
  env.add(dome);
  const R = rng(seed);
  const m = new THREE.MeshBasicMaterial({ color: glow });
  for (let i = 0; i < glows; i++) {
    const a = R() * Math.PI * 2, h = 4 + R() * 60, w = 6 + R() * 18;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m.clone());
    p.material.color.multiplyScalar(0.4 + R() * 1.6);
    p.position.set(Math.cos(a) * 300, h / 2 - 5, Math.sin(a) * 300);
    p.lookAt(0, h / 2, 0);
    env.add(p);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.02);
  stage.onDestroy.push(() => { pmrem.dispose(); rt.dispose(); });
  scene.environment = rt.texture;
  return rt.texture;
}

/* ---------- Facade texture ---------- */
// A sheet of window cells. RGB is the light inside each pane (black when the room is dark),
// alpha is the pane mask (1 = glass, 0 = mullion / slab / spandrel).
export function windowSheet({ cells = 32, px = 16, lit = 0.3, seed = 1, style = 'office', warm = 0.75 } = {}) {
  const size = cells * px;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const R = rng(seed);
  g.clearRect(0, 0, size, size);
  const shapes = {
    office:      { x: .08, w: .84, y: .16, h: .7 },   // ribbon glazing, thin mullions
    residential: { x: .2,  w: .6,  y: .22, h: .56 },  // punched windows in a solid wall
    burj:        { x: .14, w: .56, y: .1,  h: .82 },  // tall panes between deep vertical fins
  }[style];
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    const x0 = i * px, y0 = j * px;
    const on = R() < lit;
    const tone = R();
    // Lit rooms: warm tungsten mostly, some cool LED offices, a few dim TVs.
    let col = '#000';
    if (on) {
      const k = R() < warm ? [255, 178 + tone * 40 | 0, 100 + tone * 50 | 0] : [200 + tone * 40 | 0, 220, 255];
      const dim = 0.45 + R() * 0.55;
      col = `rgba(${k[0] * dim | 0},${k[1] * dim | 0},${k[2] * dim | 0},1)`;
    } else {
      // Unlit glass still needs alpha 1 so it reads as glass.
      col = `rgba(${4 + tone * 8 | 0},${6 + tone * 8 | 0},${10 + tone * 10 | 0},1)`;
    }
    g.fillStyle = col;
    // Curtains: some lit panes are only partly bright.
    const s = shapes;
    g.fillRect(x0 + s.x * px, y0 + s.y * px, s.w * px, s.h * px);
    if (on && R() < 0.3) { g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(x0 + s.x * px, y0 + s.y * px, s.w * px * (0.3 + R() * 0.4), s.h * px); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return { tex, cells };
}

// Patch a MeshStandardMaterial so its facade uses the window sheet in world space:
// glass panes are dark, glossy and reflective; mullions and slabs take the frame finish;
// lit rooms glow through the glass. Works with InstancedMesh (per-instance aSeed shifts the pattern).
export function facade(material, { sheet, cellW = 1.6, cellH = 1.2, glass = '#0d141c', frame = '#9aa2ab',
  glassRough = 0.06, frameRough = 0.45, glassMetal = 0.9, frameMetal = 0.6, glow = 1.4, roof = '#2a2d31' } = {}) {
  const u = {
    uWin: { value: sheet.tex }, uCells: { value: sheet.cells }, uCell: { value: new THREE.Vector2(cellW, cellH) },
    uGlass: { value: new THREE.Color(glass) }, uFrame: { value: new THREE.Color(frame) }, uRoof: { value: new THREE.Color(roof) },
    uGR: { value: glassRough }, uFR: { value: frameRough }, uGM: { value: glassMetal }, uFM: { value: frameMetal }, uGlow: { value: glow },
  };
  material.userData.facade = u;
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSeed;\nvarying vec3 vFW; varying vec3 vFN; varying float vFS;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 fw = vec4(transformed, 1.);
        mat3 fnm = mat3(modelMatrix);
        #ifdef USE_INSTANCING
          fw = instanceMatrix * fw; fnm = mat3(modelMatrix) * mat3(instanceMatrix);
        #endif
        fw = modelMatrix * fw; vFW = fw.xyz; vFN = normalize(fnm * objectNormal); vFS = aSeed;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uWin; uniform float uCells; uniform vec2 uCell; uniform vec3 uGlass; uniform vec3 uFrame; uniform vec3 uRoof;
        uniform float uGR; uniform float uFR; uniform float uGM; uniform float uFM; uniform float uGlow;
        varying vec3 vFW; varying vec3 vFN; varying float vFS;
        float fPane; vec3 fLight; float fWall;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 n = normalize(vFN);
          fWall = 1. - smoothstep(.55, .75, abs(n.y));
          // Horizontal coordinate along the wall, whatever direction the wall faces.
          vec2 tng = normalize(vec2(-n.z, n.x) + 1e-5);
          float along = dot(vFW.xz, tng);
          vec2 uv = vec2(along / uCell.x, vFW.y / uCell.y) / uCells;
          uv += vec2(floor(vFS * 97.), floor(fract(vFS * 13.7) * 61.)) / uCells;
          vec4 w = texture2D(uWin, uv);
          fPane = w.a * fWall;
          fLight = w.rgb * fWall;
          diffuseColor.rgb = mix(mix(uRoof, uFrame, fWall), uGlass, fPane);
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(uFR, uGR, fPane);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(uFM, uGM, fPane);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        #if defined( USE_INSTANCING_COLOR )
          fLight *= vColor;
        #endif
        totalEmissiveRadiance += fLight * fLight * uGlow * 2.2;`);
  };
  material.customProgramCacheKey = () => 'facade-' + material.uuid;
  return material;
}

/* ---------- Water ---------- */
// Tileable normal map from summed integer-frequency waves (so it wraps cleanly).
export function waterNormals(size = 256, seed = 3) {
  const R = rng(seed);
  const waves = Array.from({ length: 14 }, () => ({ fx: Math.round((R() - .5) * 18), fy: Math.round((R() - .5) * 18), a: .2 + R(), p: R() * 6.283 }));
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const w of waves) v += w.a * Math.sin(6.2831 * (w.fx * x + w.fy * y) / size + w.p) / Math.max(1, Math.hypot(w.fx, w.fy) * .35);
    h[y * size + x] = v;
  }
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const l = h[y * size + (x - 1 + size) % size], r = h[y * size + (x + 1) % size];
    const d = h[((y - 1 + size) % size) * size + x], u = h[((y + 1) % size) * size + x];
    const nx = (l - r) * 1.4, ny = (d - u) * 1.4, nz = 1;
    const len = Math.hypot(nx, ny, nz), i = (y * size + x) * 4;
    img.data[i] = (nx / len * .5 + .5) * 255; img.data[i + 1] = (ny / len * .5 + .5) * 255; img.data[i + 2] = (nz / len * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function mirrorWater(stage, Water, { geometry, sun, sunColor = '#ffffff', waterColor = '#001e26', distortion = 2.5, size = 1, res = 1024, alpha = 1 } = {}) {
  const narrow = stage.width < 700;
  const water = new Water(geometry, {
    textureWidth: narrow ? 512 : res, textureHeight: narrow ? 512 : res,
    waterNormals: waterNormals(),
    sunDirection: sun.clone().normalize(), sunColor: new THREE.Color(sunColor), waterColor: new THREE.Color(waterColor),
    distortionScale: distortion, fog: stage.scene.fog !== null && stage.scene.fog !== undefined, alpha,
  });
  water.material.uniforms.size.value = size;
  water.rotation.x = -Math.PI / 2;
  return water;
}

/* ---------- Photographic sky (HDRI) ---------- */
// Loads a CC0 Poly Haven HDRI (a plain .hdr file),
// uses it as the visible sky and as image-based light, rotates it so its sun sits at `sunAzimuth`
// (degrees, same convention as physicalSky), and reports the sun direction and horizon colour.
export async function hdriSky(stage, url, { sunAzimuth = 240, intensity = 1, envIntensity = 1, blur = 0, background = true } = {}) {
  const { scene, renderer } = stage;
  const [{ HDRLoader }, text] = await Promise.all([
    import('three/addons/loaders/HDRLoader.js'),
    fetch(url).then((r) => { if (!r.ok) throw new Error('sky ' + r.status); return r.arrayBuffer(); }),
  ]);
  if (stage.destroyed) return null;
  const loader = new HDRLoader().setDataType(THREE.FloatType);
  const d = loader.parse(text);
  const { width: w, height: h, data } = d;

  // Brightest pixel = the sun. Rows run top to bottom; with flipY the first row is the top of the sky.
  let best = -1, bi = 0;
  for (let i = 0; i < w * h; i++) {
    const l = data[i * 4] * .2126 + data[i * 4 + 1] * .7152 + data[i * 4 + 2] * .0722;
    if (l > best) { best = l; bi = i; }
  }
  const col = bi % w, row = Math.floor(bi / w);
  const u = (col + .5) / w, v = 1 - (row + .5) / h;
  const lon = (u - .5) * Math.PI * 2, lat = (v - .5) * Math.PI;
  const hdriSun = new THREE.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), Math.sin(lon) * Math.cos(lat));

  // Rotate so the sun lands at the requested azimuth.
  const want = THREE.MathUtils.degToRad(sunAzimuth);
  const wantVec = new THREE.Vector3(Math.sin(want), 0, Math.cos(want));
  const theta = Math.atan2(hdriSun.z, hdriSun.x) - Math.atan2(wantVec.z, wantVec.x);
  const sun = hdriSun.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), theta).normalize();

  // Average colour along the horizon band (for fog that blends into the photo).
  const horizon = new THREE.Color(0, 0, 0);
  let n = 0;
  const r0 = Math.floor(h * .5) - Math.max(2, Math.floor(h * .01)), r1 = Math.floor(h * .5);
  for (let r = r0; r < r1; r++) for (let c = 0; c < w; c += 4) {
    const i = (r * w + c) * 4;
    horizon.r += data[i]; horizon.g += data[i + 1]; horizon.b += data[i + 2]; n++;
  }
  horizon.multiplyScalar(intensity / n);

  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; tex.flipY = true;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  stage.onDestroy.push(() => { tex.dispose(); env.dispose(); });
  if (background) scene.background = tex;
  scene.environment = env;
  scene.backgroundRotation.set(0, theta, 0);
  scene.environmentRotation.set(0, theta, 0);
  scene.backgroundIntensity = intensity;
  scene.environmentIntensity = envIntensity;
  scene.backgroundBlurriness = blur;
  return { sun, horizon, sunStrength: best };
}
