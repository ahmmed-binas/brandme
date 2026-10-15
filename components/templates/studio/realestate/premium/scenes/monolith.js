// Monolith: Downtown at blue hour, the tallest tower over a mirror lake (adapted from the standalone page).
import { THREE, createStage, rng } from '../stage.js';
import { loadAddons, physicalSky, hdriSky, windowSheet, facade, mirrorWater } from '../realism.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onFirstDrag?: () => void }} [options]
 */
export async function mountMonolith(canvas, { onFirstDrag } = {}) {
  const stage = createStage(canvas, {
    fov:46, exposure:.42, toneMapping:THREE.AgXToneMapping,
    bloom:{ strength:.6, radius:.5, threshold:.9 }, label:'3D view of a tall tower at blue hour. Drag to fly around it.', onFirstDrag,
  });
  if (!stage) return null;
  await (async () => {
    const { scene, camera, renderer } = stage;
    const { Sky, Water, mergeGeometries } = await loadAddons();
    if (stage.destroyed) return;
    scene.fog = new THREE.FogExp2('#232838', 0.00042);

    // Sun just below the western skyline: warm horizon, deep blue overhead.
    // Blue-hour sky drawn physically; reflections come from a real photographed city sunset
    // (Poly Haven "Joburg Central Sunset", CC0), so the glass mirrors real clouds and skyline.
    const SKY = physicalSky(stage, Sky, { elevation:.25, azimuth:255, turbidity:10, rayleigh:3.2, mie:.005, mieG:.9 });
    // Loaded in the background: the scene draws at once and the reflections sharpen when the photo arrives.
    hdriSky(stage, '/samples/re/sky/sunset_jhbcentral_1k.hdr', { sunAzimuth:255, envIntensity:.55, background:false }).then(stage.invalidate).catch(() => {});
    scene.environmentIntensity = .9;
    const sunLight = new THREE.DirectionalLight('#ffb98a', .55); sunLight.position.copy(SKY.sun).multiplyScalar(500); scene.add(sunLight);
    scene.add(new THREE.HemisphereLight('#7f8fc4', '#20160f', .25));

    /* The Burj: three wings with rounded ends around a hexagonal core.
       Each wing steps back on its own rhythm, so the setbacks spiral up the tower. */
    const wingShape = (L, w) => {
      const s = new THREE.Shape(), r = w/2;
      s.moveTo(0, -r); s.lineTo(L - r, -r); s.absarc(L - r, 0, r, -Math.PI/2, Math.PI/2, false); s.lineTo(0, r); s.closePath();
      return s;
    };
    const parts = [];
    const TIERS = 32, TH = 6.6;
    let y = 0;
    for (let i = 0; i < TIERS; i++) {
      const core = Math.max(2.4, 9.2 - i*.21);
      const c = new THREE.CylinderGeometry(core, core, TH, 6); c.translate(0, y + TH/2, 0); parts.push(c);
      for (let k = 0; k < 3; k++) {
        const step = Math.floor((i + k*1.1) / 3);
        const L = 28 - step*2.55;
        if (L < 4.2) continue;
        const w = Math.max(3.6, 8.8 - i*.12);
        const g = new THREE.ExtrudeGeometry(wingShape(L, w), { depth:TH, bevelEnabled:false, curveSegments:12 });
        g.rotateX(-Math.PI/2);
        g.rotateY(k * Math.PI*2/3 + Math.PI/2);
        g.translate(0, y, 0);
        parts.push(g);
      }
      y += TH;
    }
    [[2.7,18,6],[2.2,16,6],[1.7,16,6],[1.2,18,12],[.8,22,12],[.45,30,16],[.2,22,16]].forEach(([r,h,seg]) => {
      const g = new THREE.CylinderGeometry(r*.82, r, h, seg); g.translate(0, y + h/2, 0); parts.push(g); y += h;
    });
    const topY = y;
    const burjGeo = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
    const burjMat = facade(new THREE.MeshStandardMaterial({ envMapIntensity:1.25 }), {
      sheet: windowSheet({ style:'burj', lit:.11, seed:828, warm:.65 }),
      cellW:1.15, cellH:1.3, glass:'#16202b', frame:'#c3c9d0', roof:'#9aa1a8',
      glassRough:.04, frameRough:.24, glassMetal:.96, frameMetal:.95, glow:1.1,
    });
    const burj = new THREE.Mesh(burjGeo, burjMat);
    scene.add(burj);

    // Aviation beacon and the white spire lights.
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.6, 16, 8), new THREE.MeshBasicMaterial({ color:new THREE.Color(6, .5, .3), toneMapped:false }));
    beacon.position.set(0, topY + .3, 0); scene.add(beacon);
    const spireLights = new THREE.InstancedMesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshBasicMaterial({ color:new THREE.Color(3, 3.2, 3.6), toneMapped:false }), 18);
    { const m = new THREE.Matrix4(); for (let i = 0; i < 18; i++) { m.setPosition(Math.cos(i*2.1)*.9, topY - 70 + i*3.6, Math.sin(i*2.1)*.9); spireLights.setMatrixAt(i, m); } }
    scene.add(spireLights);

    /* Downtown around it: glass office towers and stone-clad residential blocks. */
    const R = rng(20160111);
    const SP = 11;
    const LAKE = { x:46, z:52, a:46, b:26, rot:-0.85 };
    const inLake = (x, z, pad) => {
      const dx = x - LAKE.x, dz = z - LAKE.z, c = Math.cos(LAKE.rot), s = Math.sin(LAKE.rot);
      const u = dx*c - dz*s, v = dx*s + dz*c;
      return (u*u)/((LAKE.a+pad)**2) + (v*v)/((LAKE.b+pad)**2) < 1;
    };
    const glassB = [], stoneB = [];
    for (let gx = -18; gx <= 18; gx++) for (let gz = -18; gz <= 18; gz++) {
      const cx = gx*SP, cz = gz*SP, dist = Math.hypot(cx, cz);
      if (dist < 42 || dist > 200 || inLake(cx, cz, 12)) continue;
      const per = 1 + Math.floor(R()*2.4);
      for (let k = 0; k < per; k++) {
        if (R() < .1) continue;
        const w = 3.4 + R()*4.6, d = 3.4 + R()*4.6;
        let h = 6 + Math.pow(R(), 2.2) * 70 * (.4 + Math.exp(-dist/80)) + (dist < 80 ? R()*30 : 0);
        const ang = Math.atan2(cz, cx);
        if (Math.abs(ang - .85) < .5 && dist < 210) h = Math.min(h, 4 + R()*5); // keep the view across the lake open
        const b = [cx + (R()-.5)*(SP-w-1.5), cz + (R()-.5)*(SP-d-1.5), w, h, d, R()];
        (R() < .58 && h > 18 ? glassB : stoneB).push(b);
      }
    }
    const box = () => { const g = new THREE.BoxGeometry(1,1,1); g.translate(0,.5,0); return g; };
    const buildCity = (list, mat) => {
      const geo = box();
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      const seeds = new Float32Array(list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      list.forEach((b, i) => { m4.compose(new THREE.Vector3(b[0], 0, b[1]), q, new THREE.Vector3(b[2], b[3], b[4])); mesh.setMatrixAt(i, m4); seeds[i] = b[5]; });
      geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      mesh.frustumCulled = false;
      scene.add(mesh);
      return mesh;
    };
    buildCity(glassB, facade(new THREE.MeshStandardMaterial({ envMapIntensity:1 }), {
      sheet: windowSheet({ style:'office', lit:.2, seed:11, warm:.55 }), cellW:1.5, cellH:1.2,
      glass:'#0f1a22', frame:'#59636e', roof:'#2c2f33', glassRough:.07, frameRough:.45, glassMetal:.88, frameMetal:.6, glow:1.25,
    }));
    buildCity(stoneB, facade(new THREE.MeshStandardMaterial({ envMapIntensity:.6 }), {
      sheet: windowSheet({ style:'residential', lit:.3, seed:21, warm:.95 }), cellW:1.35, cellH:1.1,
      glass:'#11161c', frame:'#b5a68f', roof:'#5b554c', glassRough:.1, frameRough:.85, glassMetal:.7, frameMetal:0, glow:1.45,
    }));

    /* Ground: dark paving with sodium streetlights along the block grid, and car lights on the roads. */
    const U = { uTime:{ value:0 } };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ color:'#121315', roughness:.9, metalness:0 }));
    ground.material.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vGW; uniform float uTime;
        float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec2 p = vGW.xz / ${SP.toFixed(1)} + .5;
          vec2 f = abs(fract(p) - .5);
          float aa = clamp(1.3 - length(fwidth(p))*2.5, 0., 1.);
          float roadX = smoothstep(.07, .0, abs(fract(p.y + .5) - .5)), roadZ = smoothstep(.07, .0, abs(fract(p.x + .5) - .5));
          float lamps = step(.93, fract(vGW.x*.12)) * roadX + step(.93, fract(vGW.z*.12)) * roadZ;
          float carsX = roadX * step(.9, fract(vGW.x*.06 + uTime*(h12(vec2(floor(p.y),3.))>.5?.6:-.5) + h12(vec2(floor(p.y),1.))*9.));
          float carsZ = roadZ * step(.9, fract(vGW.z*.06 + uTime*(h12(vec2(floor(p.x),5.))>.5?.55:-.45) + h12(vec2(floor(p.x),2.))*9.));
          float d = length(vGW.xz);
          float fade = smoothstep(260., 40., d);
          totalEmissiveRadiance += (vec3(1.,.55,.22)*(roadX+roadZ)*.05 + vec3(1.,.62,.3)*lamps*.9 + vec3(1.,.9,.8)*carsX*1.2 + vec3(1.,.15,.08)*carsZ*1.1) * aa * fade;
          diffuseColor.rgb *= 1. - (roadX + roadZ) * .35;
        }`);
    };
    scene.add(ground);

    /* Lake: real mirror water reflecting the tower, the sky and the city. */
    const lakeGroup = new THREE.Group();
    const water = mirrorWater(stage, Water, { geometry:new THREE.CircleGeometry(1, 96), sun:SKY.sun, sunColor:'#ffcf9e', waterColor:'#031419', distortion:.9, size:6 });
    water.scale.set(LAKE.a, LAKE.b, 1);
    water.position.y = .15;
    lakeGroup.add(water);
    const edge = new THREE.Mesh(new THREE.RingGeometry(1, 1.035, 96).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ color:'#cfc6b8', roughness:.7 }));
    edge.scale.set(LAKE.a, 1, LAKE.b); edge.position.y = .2; lakeGroup.add(edge);
    lakeGroup.position.set(LAKE.x, 0, LAKE.z);
    lakeGroup.rotation.y = LAKE.rot;
    scene.add(lakeGroup);

    /* Fountain: jets along an arc, choreographed as a wave travelling down the line. */
    const JETS = 64, PER = 120;
    const pos = new Float32Array(JETS*PER*3), aJet = new Float32Array(JETS*PER), aOff = new Float32Array(JETS*PER);
    const fc = Math.cos(LAKE.rot), fs = Math.sin(LAKE.rot);
    for (let j = 0; j < JETS; j++) {
      const th = -1.2 + 2.4 * j/(JETS-1);
      const u = Math.cos(th) * LAKE.a * .6 - LAKE.a*.1, v = Math.sin(th) * LAKE.b * .6;
      const x = LAKE.x + u*fc + v*fs, z = LAKE.z - u*fs + v*fc;
      for (let k = 0; k < PER; k++) { const i = j*PER + k; pos.set([x, .2, z], i*3); aJet[i] = j; aOff[i] = k/PER + R()*.01; }
    }
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    fGeo.setAttribute('aJet', new THREE.BufferAttribute(aJet, 1));
    fGeo.setAttribute('aOff', new THREE.BufferAttribute(aOff, 1));
    const fountain = new THREE.Points(fGeo, new THREE.ShaderMaterial({
      uniforms:{ uTime:U.uTime, uPR:{ value:renderer.getPixelRatio() } }, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`
        attribute float aJet; attribute float aOff; uniform float uTime; uniform float uPR; varying float vA;
        void main(){
          float show = smoothstep(-.2, .35, sin(uTime*.19));
          float amp = (.55 + .45*sin(uTime*1.5 - aJet*.3)) * (.65 + .35*sin(uTime*.43 + aJet*.11));
          float H = 1.5 + 34.*amp*show;
          float v0 = sqrt(19.6*H), T = 2.*v0/9.8;
          float tt = fract(uTime*.42 + aOff) * T;
          vec3 p = position;
          p.y += max(0., v0*tt - 4.9*tt*tt);
          float spread = tt/T;
          p.x += sin(aOff*97.)*.7*spread*2.; p.z += cos(aOff*61.)*.7*spread*2.;
          vec4 mv = viewMatrix * vec4(p,1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1. + 2.2*fract(aOff*13.)) * uPR * (240. / -mv.z);
          vA = (.2 + .8*show) * (1. - smoothstep(.7, 1., spread)) * (.35 + .65*fract(aOff*7.));
        }`,
      fragmentShader:`
        varying float vA;
        void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d) * vA; gl_FragColor = vec4(vec3(1., .96, .9) * a * 1.6, a); }`,
    }));
    fountain.frustumCulled = false;
    scene.add(fountain);

    /* Camera: across the lake, eye level from the promenade, looking up the tower. */
    const target = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0,1,0);
    stage.onFrame.push((t) => {
      U.uTime.value = t;
      water.material.uniforms.time.value = t * .35;
      const p = stage.pointer, s = stage.scroll;
      const ang = .85 + Math.sin(t*.03)*.16 + p.x*.08 + stage.orbit.yaw;
      const rad = 345 - s*60;
      const camY = Math.max(4, 42 - p.y*5 + s*120 + stage.orbit.pitch*220);
      camera.position.set(LAKE.x*.2 + Math.cos(ang)*rad, camY, LAKE.z*.2 + Math.sin(ang)*rad);
      target.set(0, 168 + s*50, 0);
      const wide = stage.width / stage.height;
      right.subVectors(target, camera.position).cross(up).normalize();
      target.addScaledVector(right, wide > 1.1 ? -Math.min(100, 56*wide) : 0);
      camera.lookAt(target);
      beacon.material.color.setRGB(6*(.15 + .85*Math.pow(Math.max(0, Math.sin(t*2.6)), 6)), .5, .3);
    });
    stage.invalidate();
  })();
  return stage.destroyed ? null : { destroy: stage.destroy };
}
