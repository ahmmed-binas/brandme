// Atlas: Dubai as a night map with district clusters, a coastline, the Creek and a metro arc
// (adapted from the standalone page). The page owns the selection; pins are drawn into `pinsEl`.
import { THREE, createStage, GLSL_NOISE, rng } from "../stage.js";
import { nightEnvironment, windowSheet, facade } from "../realism.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ areas: Array<{ id: string, name: string, color: string, x: number, z: number, r: number, tall: number[], n: number }>, pinsEl?: HTMLElement | null, onSelect?: (id: string | null) => void, onFirstDrag?: () => void }} options
 */
export async function mountAtlas(canvas, { areas, pinsEl, onSelect, onFirstDrag }) {
  // A copy: the scene nudges the Palm's position to sit on its island.
  const AREAS = areas.map((a) => ({ ...a, tall: [...a.tall] }));
  const sel = { id: null, listeners: [] };
  // Pin clicks: move the camera here, then tell the page.
  let api = null;
  const select = (id) => {
    api?.select(id);
    onSelect?.(id);
  };
  const coastZ = (x) => -18 + Math.sin(x*.008)*14 + Math.sin(x*.021 + 1.3)*5;
  const creek = (x, z) => { // distance to the creek centreline
    const cx = 300 + Math.sin(z*.012)*30 - z*.15;
    return Math.abs(x - cx);
  };
  const stage = createStage(canvas, { fov:34, exposure:1, bloom:{ strength:.75, radius:.5, threshold:.82 }, label:'3D night map of Dubai. Drag to turn it.', onFirstDrag });
  if (!stage) return null;
  {
    const { scene, camera, renderer } = stage;
    scene.background = new THREE.Color('#05080c');
    nightEnvironment(stage, { zenith:'#03060b', horizon:'#1b1d2b', glow:'#ff9a50', glows:60, seed:5 });
    scene.environmentIntensity = .9;
    const moon = new THREE.DirectionalLight('#9fb4ff', .35); moon.position.set(-300, 400, -200); scene.add(moon);
    scene.add(new THREE.HemisphereLight('#2a3550', '#120d08', .25));
    const R = rng(57218);
    const U = { uTime:{ value:0 }, uFocus:{ value:new THREE.Vector3(0, 0, 0) }, uFocusOn:{ value:0 }, uFocusR:{ value:60 }, uSelCol:{ value:new THREE.Color('#5ee6d0') }, uCamPos:{ value:new THREE.Vector3() } };

    // Ground: land and sea from the same coast function, with a contour grid and a scanning ring.
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1400, 1, 1).rotateX(-Math.PI/2), new THREE.ShaderMaterial({
      uniforms:U,
      vertexShader:`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader:`${GLSL_NOISE}
        uniform float uTime; uniform vec3 uFocus; uniform float uFocusOn; uniform float uFocusR; uniform vec3 uSelCol; uniform vec3 uCamPos; varying vec3 vW;
        float coastZ(float x){ return -18. + sin(x*.008)*14. + sin(x*.021 + 1.3)*5.; }
        float creekD(float x, float z){ float cx = 300. + sin(z*.012)*30. - z*.15; return abs(x - cx); }
        float roads(vec2 p, float spacing, float width){ vec2 g = abs(fract(p/spacing) - .5)*spacing; return smoothstep(width, 0., min(g.x, g.y)); }
        void main(){
          float cz = coastZ(vW.x);
          float sea = smoothstep(cz + 1., cz - 1., vW.z);
          float ck = smoothstep(11., 8., creekD(vW.x, vW.z)) * step(cz - 5., vW.z);
          float water = max(sea, ck);
          // Land: a night-time desert city, lit by its street grid.
          float n = fbm(vW.xz*.02);
          vec3 land = mix(vec3(.028,.026,.03), vec3(.05,.045,.042), n);
          // The street grid runs roughly parallel to the coast.
          mat2 rot = mat2(.97,-.24,.24,.97);
          vec2 q = rot * vW.xz;
          float aa = clamp(1.6 - length(fwidth(q/14.))*4., 0., 1.);
          float minor = roads(q, 14., .35) * aa;
          float major = roads(q + 3., 70., .9);
          float lamps = step(.8, fract(q.x*.35)) + step(.8, fract(q.y*.35));
          land += vec3(.35,.22,.1) * minor * .12;
          land += vec3(1.,.62,.28) * major * (.12 + .28*lamps*aa);
          float inland = smoothstep(cz + 330., cz + 120., vW.z);
          land *= .45 + .55*inland;
          // Sheikh Zayed Road: twelve lanes of light.
          float szrZ = cz + 70. + sin(vW.x*.006)*8.;
          float szr = smoothstep(3.2, 0., abs(vW.z - szrZ)) * step(vW.x, 330.) * step(-420., vW.x);
          land += vec3(1.,.72,.38) * szr * .8;
          // Sea: deep and dark with a moon path and wind texture.
          float rip = fbm(vW.xz*.08 + vec2(uTime*.05, uTime*.03));
          vec3 seaCol = vec3(.006,.014,.024) + vec3(.02,.04,.06)*rip;
          vec2 moonDir = normalize(vec2(-.35, -1.));
          float path = pow(max(0., dot(normalize(vW.xz - uCamPos.xz), moonDir)), 40.);
          seaCol += vec3(.55,.62,.75) * path * step(.55, rip) * .9;
          seaCol += vec3(.9,.6,.3) * exp(-max(0., cz - vW.z)*.05) * .06 * rip;
          vec3 col = mix(land, seaCol, water);
          // Beach: a thin pale strip.
          float beach = smoothstep(4., 0., vW.z - cz) * step(cz - .5, vW.z);
          col = mix(col, vec3(.2,.17,.13), beach * (1. - ck));
          // Selection: a soft ring and wash in the district colour.
          float d = length(vW.xz - uFocus.xz);
          float ring = smoothstep(uFocusR + 3., uFocusR, d) * smoothstep(uFocusR - 4., uFocusR, d);
          col += uSelCol * (ring*.9 + smoothstep(uFocusR, 0., d)*.06) * uFocusOn;
          col *= smoothstep(950., 300., length(vW.xz - vec2(0., 60.)));
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
    scene.add(ground);

    // Buildings: one instanced mesh for the whole city, coloured per district.
    const box = new THREE.BoxGeometry(1,1,1); box.translate(0,.5,0);
    const B = [];
    const onLand = (x, z) => z > coastZ(x) + 6 && creek(x, z) > 16;
    AREAS.forEach((a, ai) => {
      for (let i = 0; i < a.n; i++) {
        const ang = R()*Math.PI*2, rr = Math.sqrt(R())*a.r;
        const x = a.x + Math.cos(ang)*rr, z = a.z + Math.sin(ang)*rr;
        if (!onLand(x, z)) continue;
        const t = Math.pow(R(), 2.2);
        const h = a.tall[0] + t*(a.tall[1]-a.tall[0]) * (1 - rr/a.r*.5);
        const w = 3 + R()*4;
        B.push([x, z, w, h, w*(.7+R()*.6), ai]);
      }
    });
    // Downtown supertall
    B.push([95, 85, 5, 230, 5, 4]); B.push([95, 85, 2, 290, 2, 4]);
    // Background city fabric
    for (let i = 0; i < 900; i++) {
      const x = -420 + R()*760, z = coastZ(x) + 8 + R()*240;
      if (!onLand(x, z) || AREAS.some((a) => Math.hypot(x-a.x, z-a.z) < a.r + 6)) continue;
      B.push([x, z, 2.5 + R()*4, 1.5 + Math.pow(R(),3)*14, 2.5 + R()*4, -1]);
    }
    const city = new THREE.InstancedMesh(box, null, B.length);
    const aArea = new Float32Array(B.length), aSeed = new Float32Array(B.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    B.forEach((b, i) => { m4.compose(new THREE.Vector3(b[0], 0, b[1]), q, new THREE.Vector3(b[2], b[3], b[4])); city.setMatrixAt(i, m4); aArea[i] = b[5]; aSeed[i] = R(); });
    box.setAttribute('aArea', new THREE.InstancedBufferAttribute(aArea, 1));
    box.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
    const tint = new THREE.Color();
    const mats = [
      facade(new THREE.MeshStandardMaterial({ envMapIntensity:1.1 }), {
        sheet: windowSheet({ style:'office', lit:.34, seed:57, warm:.6 }), cellW:.95, cellH:1.05,
        glass:'#0d1620', frame:'#4c5560', roof:'#1d2024', glassRough:.06, frameRough:.45, glassMetal:.9, frameMetal:.6, glow:1.6,
      }),
    ];
    city.material = mats[0];
    // Selection: tint the chosen district's facades and dim the rest, through per-instance colour.
    const applySelection = (sel) => {
      B.forEach((b, i) => {
        if (sel < 0) tint.setRGB(1, 1, 1);
        else if (b[5] === sel) tint.set(AREAS[sel].color).lerp(new THREE.Color(1, 1, 1), .55).multiplyScalar(1.15);
        else tint.setRGB(.32, .32, .34);
        city.setColorAt(i, tint);
      });
      city.instanceColor.needsUpdate = true;
    };
    applySelection(-1);
    city.frustumCulled = false;
    scene.add(city);

    // The Palm, drawn as glowing sand on the sea.
    const palmMat = new THREE.MeshBasicMaterial({ color:'#3a3128' });
    const palmG = new THREE.Group();
    const P0 = { x:-150, z:coastZ(-150) };
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(8, .6, 110), palmMat); trunk.position.set(0, .3, -55); palmG.add(trunk);
    for (let i = 0; i < 16; i++) {
      const side = i < 8 ? -1 : 1, k = i % 8;
      const len = 46 - Math.abs(k - 3.5)*3.5;
      const f = new THREE.Mesh(new THREE.BoxGeometry(len, .5, 2.4), palmMat);
      const zz = -40 - k*8.5;
      f.position.set(side*(len/2 + 4), .25, zz); f.rotation.y = side*.12;
      palmG.add(f);
    }
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(78, 1.8, 4, 80, Math.PI*1.3), palmMat);
    crescent.rotation.x = -Math.PI/2; crescent.rotation.z = Math.PI*1.35; crescent.position.set(0, .3, -88);
    palmG.add(crescent);
    // Villa lights along each frond, hotel lights on the crescent.
    const lp = [];
    palmG.children.forEach((m) => {
      if (m === trunk || m === crescent) return;
      const len = m.geometry.parameters.width;
      for (let k = 0; k < len; k += 2.2) { const off = k - len/2; lp.push(m.position.x + off*Math.cos(m.rotation.y), 1, m.position.z - off*Math.sin(m.rotation.y) + (R() > .5 ? 1.6 : -1.6)); }
    });
    for (let a = 0; a < Math.PI*1.3; a += .05) { const an = a + Math.PI*1.35; lp.push(Math.cos(an)*78, 1, -88 - Math.sin(an)*78); }
    for (let z = -5; z > -105; z -= 3) lp.push((R()-.5)*6, 1.5 + R()*6, z);
    const lGeo = new THREE.BufferGeometry(); lGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    palmG.add(new THREE.Points(lGeo, new THREE.PointsMaterial({ color:'#ffc27a', size:1.6, sizeAttenuation:true })));
    palmG.position.set(P0.x, 0, P0.z);
    scene.add(palmG);
    AREAS[1].z = P0.z - 80;

    // Traffic on Sheikh Zayed Road.
    const N = 700, tp = new Float32Array(N*3), to = new Float32Array(N);
    for (let i = 0; i < N; i++) { to[i] = R(); tp[i*3+1] = i % 2; }
    const tGeo = new THREE.BufferGeometry(); tGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tGeo.setAttribute('aO', new THREE.BufferAttribute(to, 1));
    const traffic = new THREE.Points(tGeo, new THREE.ShaderMaterial({
      uniforms:{ ...U, uPR:{ value:renderer.getPixelRatio() } }, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`attribute float aO; uniform float uTime; uniform float uPR; varying vec3 vC;
        float coastZ(float x){ return -18. + sin(x*.008)*14. + sin(x*.021 + 1.3)*5.; }
        void main(){
          float dir = position.y > .5 ? 1. : -1.;
          float x = -420. + mod(aO*750. + uTime*(28. + aO*14.)*dir, 750.);
          float z = coastZ(x) + 70. + sin(x*.006)*8. + dir*1.6;
          vec4 mv = viewMatrix * vec4(x, 1., z, 1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPR * 2.4 * (300. / -mv.z);
          vC = dir > 0. ? vec3(1.,.95,.85) : vec3(1.,.3,.25);
        }`,
      fragmentShader:`varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * smoothstep(.5, .0, d), 1.); }`
    }));
    traffic.frustumCulled = false;
    scene.add(traffic);

    // Metro line: a dashed arc floating above the city.
    const metroPts = [];
    for (let x = -330; x <= 300; x += 6) metroPts.push(new THREE.Vector3(x, 14, coastZ(x) + 82 + Math.sin(x*.006)*8));
    const metro = new THREE.Line(new THREE.BufferGeometry().setFromPoints(metroPts), new THREE.LineDashedMaterial({ color:'#c9d3dd', dashSize:3, gapSize:3, transparent:true, opacity:.35 }));
    metro.computeLineDistances(); scene.add(metro);

    // HTML pins that track their districts.
        if (pinsEl) pinsEl.innerHTML = AREAS.map((a) => `<button class="pin" type="button" data-area="${a.id}" style="--c:${a.color}" aria-label="${esc(a.name)}"><i></i><span>${esc(a.name)}</span></button>`).join('');
    pinsEl?.addEventListener('click', (e) => { const b = e.target.closest('[data-area]'); if (b) select(sel.id === b.dataset.area ? null : b.dataset.area); });
    const pins = pinsEl ? [...pinsEl.children] : [];
    const v = new THREE.Vector3();

    // Camera flies between the overview and the selected district.
    const cam = { tx:0, tz:60, dist:980, ttx:0, ttz:60, tdist:980 };
    sel.listeners.push((a) => {
      applySelection(a ? AREAS.indexOf(a) : -1);
      U.uFocusOn.value = a ? 1 : 0;
      if (a) { U.uFocus.value.set(a.x, 0, a.z); U.uFocusR.value = Math.max(40, a.r + 14); U.uSelCol.value.set(a.color); }
      cam.ttx = a ? a.x : 0; cam.ttz = a ? a.z : 60; cam.tdist = a ? 380 : 980;
      stage.invalidate();
    });
    const right = new THREE.Vector3(), UP = new THREE.Vector3(0,1,0), look = new THREE.Vector3();
    stage.onFrame.push((t, dt) => {
      U.uTime.value = t;
      const k = stage.still ? 1 : Math.min(1, dt*2.2);
      cam.tx += (cam.ttx - cam.tx)*k; cam.tz += (cam.ttz - cam.tz)*k; cam.dist += (cam.tdist - cam.dist)*k;
      const p = stage.pointer;
      const narrow = stage.width / stage.height < 1;
      const ang = -1.15 + Math.sin(t*.05)*.18 + p.x*.12 + stage.orbit.yaw;
      const elev = Math.min(1.35, Math.max(.35, .9 - p.y*.06 - stage.orbit.pitch));
      const d = cam.dist * (narrow ? 1.35 : 1);
      camera.position.set(cam.tx + Math.cos(ang)*Math.cos(elev)*d, Math.sin(elev)*d, cam.tz + Math.sin(ang)*Math.cos(elev)*d);
      look.set(cam.tx, 0, cam.tz);
      right.subVectors(look, camera.position).cross(UP).normalize();
      if (!narrow) look.addScaledVector(right, -cam.dist*(sel.id ? .17 : .13));
      else look.z += 0;
      camera.lookAt(look);
      U.uCamPos.value.copy(camera.position);
      pins.forEach((el, i) => {
        const a = AREAS[i];
        v.set(a.x, a.id === 'palm' ? 6 : a.tall[1]*.7 + 10, a.z).project(camera);
        const x = (v.x*.5 + .5)*stage.width, y = (-v.y*.5 + .5)*stage.height;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-12px, -50%)`;
        el.style.opacity = v.z > 1 ? 0 : 1;
      });
    });
  }
  stage.invalidate();
  api = {
    destroy: stage.destroy,
    select(id) {
      sel.id = id;
      const a = AREAS.find((x) => x.id === id) ?? null;
      sel.listeners.forEach((f) => f(a));
      pinsEl?.querySelectorAll(".pin").forEach((p) => p.classList.toggle("on", p.dataset.area === id));
    },
  };
  return api;
}
