// Dune: a courtyard villa in the dunes with a sun clock (adapted from the standalone page).
// mountDune(canvas, { hour, onHour, onPlaying, onFirstDrag }) -> { destroy, setHour, setPlaying }
import { THREE, createStage, GLSL_NOISE, rng } from "../stage.js";

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ hour?: number, onHour?: (h: number) => void, onPlaying?: (on: boolean) => void, onFirstDrag?: () => void }} [options]
 */
export async function mountDune(canvas, { hour = 17.5, onHour, onPlaying, onFirstDrag } = {}) {
  const sun = { hour, playing: false };
  const stage = createStage(canvas, { fov:36, exposure:.85, bloom:{ strength:.4, radius:.55, threshold:.92 }, label:'3D villa in the dunes. Drag to walk around it.', onFirstDrag });
  if (!stage) return null;
  {
    const { scene, camera, renderer } = stage;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const R = rng(44706);
    const SUN = new THREE.Vector3();
    const U = { uSun:{ value:SUN }, uTime:{ value:0 }, uNight:{ value:0 } };

    // Sky that runs from day blue through amber dusk to an indigo night with stars.
    const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.ShaderMaterial({
      side:THREE.BackSide, depthWrite:false, uniforms:U,
      vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`${GLSL_NOISE}
        uniform vec3 uSun; uniform float uTime; varying vec3 vD;
        void main(){
          float e = uSun.y, h = vD.y;
          float day = smoothstep(-.05, .35, e), dusk = smoothstep(.42, .03, e) * smoothstep(-.2, .0, e);
          vec3 zen = mix(vec3(.02,.03,.09), vec3(.22,.42,.78), day);
          vec3 hor = mix(vec3(.08,.08,.18), vec3(.78,.82,.9), day);
          hor = mix(hor, vec3(1.,.55,.28), dusk);
          zen = mix(zen, vec3(.2,.22,.45), dusk*.6);
          vec3 c = mix(hor, zen, smoothstep(-.02, .5, h));
          float s = max(dot(vD, normalize(uSun)), 0.);
          c += vec3(1.,.6,.3) * pow(s, 6.) * (.4 + dusk*.8) * smoothstep(-.15,.0,e);
          c += vec3(1.,.95,.85) * smoothstep(.9993,.9996,s) * 4. * smoothstep(-.05,.02,e);
          float st = step(.997, hash12(floor(vec2(atan(vD.z,vD.x)*500., h*600.))));
          c += st * smoothstep(.0,-.12,e) * smoothstep(.05,.3,h) * (.6 + .4*sin(uTime*2. + h*90.));
          // The Milky Way as a faint band at night
          float band = exp(-pow((vD.x*.7 + vD.y - .55)*3.2, 2.)) * fbm(vD.xz*9.);
          c += vec3(.25,.25,.4) * band * smoothstep(-.02,-.15,e) * .5;
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
    scene.add(skyMesh);
    // Image-based lighting: the same sky, baked so glass, water and plaster reflect it.
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(skyMesh.geometry, skyMesh.material));
    const envGround = new THREE.Mesh(new THREE.CircleGeometry(1400, 32).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ color:'#a8784a' }));
    envGround.position.y = -2; envScene.add(envGround);
    const pmrem = new THREE.PMREMGenerator(renderer);
    let envRT = null, bakedHour = -99;
    const bakeEnv = (hour, night) => {
      if (Math.abs(hour - bakedHour) < .2) return;
      bakedHour = hour;
      envGround.material.color.set('#a8784a').multiplyScalar(1 - night*.9);
      if (envRT) envRT.dispose();
      envRT = pmrem.fromScene(envScene, .02, .1, 3000);
      scene.environment = envRT.texture;
    };

    // Dunes: sculpted on the CPU so shadows land on them, flattened around the plot.
    const noise = (() => { const p = new Uint8Array(512); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = Math.floor(R()*(i+1)); [p[i],p[j]] = [p[j],p[i]]; } for (let i = 0; i < 256; i++) p[i+256] = p[i];
      const f = (t) => t*t*(3-2*t), g = (h) => (h/255)*2-1;
      return (x, y) => { const X = Math.floor(x)&255, Y = Math.floor(y)&255, xf = x-Math.floor(x), yf = y-Math.floor(y);
        const a = g(p[p[X]+Y]), b = g(p[p[X+1]+Y]), c = g(p[p[X]+Y+1]), d = g(p[p[X+1]+Y+1]); const u = f(xf), v = f(yf);
        return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v; }; })();
    const tGeo = new THREE.PlaneGeometry(1400, 1400, 260, 260); tGeo.rotateX(-Math.PI/2);
    const tp = tGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i), d = Math.hypot(x, z);
      let h = 0, a = 1, f = .006;
      for (let o = 0; o < 4; o++) { h += Math.abs(noise(x*f + 11, z*f*1.6 + 3)) * a; a *= .5; f *= 2.1; }
      h = Math.pow(h, 1.6) * 22;
      const ridge = Math.pow(1 - Math.abs(noise(x*.004 + 40, z*.004)), 3) * 16;
      h = (h + ridge) * THREE.MathUtils.smoothstep(d, 70, 240) - .4;
      tp.setY(i, h);
    }
    tGeo.computeVertexNormals();
    const sandMat = new THREE.MeshStandardMaterial({ color:'#d9a66b', roughness:.95 });
    sandMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          float arg = vWP.x*1.1 + sin(vWP.z*.19)*3.2 + vWP.z*.35;
          vec3 pert = vec3(cos(arg)*.09, 0., cos(arg)*.035) * smoothstep(160., 40., length(vWP.xz - cameraPosition.xz));
          normal = normalize(normal + mat3(viewMatrix)*pert);`);
    };
    const terrain = new THREE.Mesh(tGeo, sandMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Lighting rig.
    const sunL = new THREE.DirectionalLight('#fff', 3);
    sunL.castShadow = true;
    sunL.shadow.mapSize.set(2048, 2048);
    Object.assign(sunL.shadow.camera, { left:-70, right:70, top:70, bottom:-70, near:10, far:400 });
    sunL.shadow.bias = -.0006; sunL.shadow.normalBias = .04;
    scene.add(sunL, sunL.target);
    const hemi = new THREE.HemisphereLight('#bcd1ff', '#c08a55', .45); scene.add(hemi);
    scene.fog = new THREE.Fog('#d9b892', 220, 1050);
    const fogDay = new THREE.Color('#cfc3b2'), fogDusk = new THREE.Color('#e3a372'), fogNight = new THREE.Color('#151b36');

    // Villa materials.
    const noiseTex = (size, scale, seed, lo = 150, hi = 255) => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'), img = g.createImageData(size, size), Rn = rng(seed);
      const grid = new Float32Array((scale+1)*(scale+1)).map(() => Rn());
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const gx = x/size*scale, gy = y/size*scale, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx-ix, fy = gy-iy;
        const at = (a, b) => grid[(b % scale)*(scale+1) + (a % scale)];
        const v = (at(ix,iy)*(1-fx) + at(ix+1,iy)*fx)*(1-fy) + (at(ix,iy+1)*(1-fx) + at(ix+1,iy+1)*fx)*fy;
        const n = lo + (hi-lo)*(v*.7 + Rn()*.3), i = (y*size+x)*4;
        img.data[i] = img.data[i+1] = img.data[i+2] = n; img.data[i+3] = 255;
      }
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    };
    const plasterTex = noiseTex(256, 24, 5, 200, 255); plasterTex.repeat.set(3, 3);
    const plaster = new THREE.MeshStandardMaterial({ color:'#ddd2c0', roughness:.88, roughnessMap:plasterTex, bumpMap:plasterTex, bumpScale:.6, envMapIntensity:.6 });
    const stoneTex = noiseTex(256, 40, 9, 140, 255); stoneTex.repeat.set(6, 6);
    const stone = new THREE.MeshStandardMaterial({ color:'#cdb38f', roughness:.9, map:stoneTex, bumpMap:stoneTex, bumpScale:.8, envMapIntensity:.5 });
    const timber = new THREE.MeshStandardMaterial({ color:'#6e4529', roughness:.62, envMapIntensity:.5 });
    const glass = new THREE.MeshStandardMaterial({ color:'#141a24', roughness:.03, metalness:.95, envMapIntensity:1.4, emissive:new THREE.Color('#ffb066'), emissiveIntensity:0 });
    const villa = new THREE.Group();
    const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; villa.add(m); return m; };
    add(new THREE.BoxGeometry(64, 1.2, 46), stone, 0, .6, 0);                 // plinth
    add(new THREE.BoxGeometry(30, 8, 16), plaster, -8, 5.2, -10);             // main wing
    add(new THREE.BoxGeometry(16, 8, 22), plaster, 15, 5.2, -4);              // side wing
    add(new THREE.BoxGeometry(22, 7, 13), plaster, -12, 12.7, -11.5);         // upper floor
    add(new THREE.BoxGeometry(36, .7, 20), plaster, -8, 9.55, -8);            // roof slab overhang
    add(new THREE.BoxGeometry(26, .6, 17), plaster, -12, 16.5, -11);          // upper roof
    add(new THREE.BoxGeometry(2.2, 12, 2.2), stone, 22, 7.2, -14);            // wind tower base
    add(new THREE.BoxGeometry(3.4, 4, 3.4), plaster, 22, 15, -14);            // wind tower (barjeel)
    // Glazing with warm interiors that light up at dusk.
    add(new THREE.BoxGeometry(24, 5.6, .3), glass, -8, 4.6, -1.9);
    add(new THREE.BoxGeometry(.3, 5.6, 14), glass, 7.1, 4.6, -4);
    add(new THREE.BoxGeometry(16, 4.8, .3), glass, -12, 12.4, -4.9);
    // Pergola slats over the terrace.
    for (let i = 0; i < 12; i++) add(new THREE.BoxGeometry(.5, .5, 12), timber, -22 + i*1.6, 9.2, 4);
    add(new THREE.BoxGeometry(.6, 8, .6), timber, -22.5, 4.6, 9.5); add(new THREE.BoxGeometry(.6, 8, .6), timber, -4, 4.6, 9.5);

    // Mashrabiya screen: an eight-point star lattice. Its alpha map also drives the shadow, so the pattern lands on the floor.
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0,0,512,512);
    cx.fillStyle = '#000';
    const cell = 64;
    for (let gx = 0; gx < 512; gx += cell) for (let gy = 0; gy < 512; gy += cell) {
      cx.save(); cx.translate(gx + cell/2, gy + cell/2);
      const r1 = cell*.36, r2 = cell*.2;
      cx.beginPath();
      for (let k = 0; k < 16; k++) { const a = k*Math.PI/8, r = k%2 ? r2 : r1; cx.lineTo(Math.cos(a)*r, Math.sin(a)*r); }
      cx.closePath(); cx.fill();
      cx.restore();
      cx.beginPath(); cx.arc(gx, gy, cell*.09, 0, Math.PI*2); cx.fill();
    }
    const lattice = new THREE.CanvasTexture(cv);
    lattice.wrapS = lattice.wrapT = THREE.RepeatWrapping; lattice.repeat.set(4, 2);
    const screenMat = new THREE.MeshStandardMaterial({ color:'#e9dcc6', roughness:.8, alphaMap:lattice, alphaTest:.5, side:THREE.DoubleSide });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.2), screenMat);
    screen.position.set(15, 5, 7.2); screen.castShadow = true; screen.receiveShadow = true;
    screen.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking:THREE.RGBADepthPacking, alphaMap:lattice, alphaTest:.5 });
    villa.add(screen);
    const screen2 = screen.clone(); screen2.rotation.y = Math.PI/2; screen2.position.set(23.2, 5, -2); screen2.customDepthMaterial = screen.customDepthMaterial; villa.add(screen2);

    // Infinity pool with caustics, glowing after sunset.
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(26, 8), new THREE.ShaderMaterial({
      uniforms:U,
      vertexShader:`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader:`${GLSL_NOISE}
        uniform float uTime; uniform float uNight; varying vec2 vUv; varying vec3 vW;
        void main(){
          vec2 p = vW.xz*.45;
          float c1 = vnoise(p*2. + uTime*.6), c2 = vnoise(p*2.3 - uTime*.5 + 4.);
          float caus = pow(1. - abs(c1 - c2), 8.);
          vec3 day = mix(vec3(.12,.55,.62), vec3(.5,.85,.88), caus*.8);
          vec3 night = mix(vec3(.02,.25,.35), vec3(.25,.9,1.), caus) * 1.4;
          vec3 col = mix(day, night, uNight);
          col *= .85 + .15*smoothstep(0.,.08,vUv.y)*smoothstep(1.,.92,vUv.y);
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
    pool.rotation.x = -Math.PI/2; pool.position.set(4, 1.25, 15);
    villa.add(pool);
    add(new THREE.BoxGeometry(27.5, .4, .8), stone, 4, 1.3, 19.4); add(new THREE.BoxGeometry(27.5, .4, .8), stone, 4, 1.3, 10.6);
    const poolLight = new THREE.PointLight('#5fe0ff', 0, 40, 1.6); poolLight.position.set(4, 3, 15); villa.add(poolLight);

    // Lanterns along the path.
    const lanternMat = new THREE.MeshStandardMaterial({ color:'#3a2a1c', emissive:new THREE.Color('#ffb35c'), emissiveIntensity:0 });
    const lanterns = [];
    for (let i = 0; i < 6; i++) { const l = add(new THREE.BoxGeometry(.9, 1.6, .9), lanternMat, -28 + i*4.5, 2.1, 21); l.castShadow = false; lanterns.push(l); }
    const terraceLight = new THREE.PointLight('#ffb066', 0, 60, 1.5); terraceLight.position.set(-12, 7, 4); villa.add(terraceLight);

    // Date palms.
    // Frond texture: a midrib with dozens of narrow leaflets angled forward, cut out with alpha.
    const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 256;
    const lx = lc.getContext('2d');
    lx.fillStyle = '#000'; lx.fillRect(0, 0, 1024, 256);
    const fcol = document.createElement('canvas'); fcol.width = 1024; fcol.height = 256;
    const fx = fcol.getContext('2d');
    const grad = fx.createLinearGradient(0, 0, 1024, 0); grad.addColorStop(0, '#5d6b3a'); grad.addColorStop(1, '#7e8a4a');
    fx.fillStyle = grad; fx.fillRect(0, 0, 1024, 256);
    lx.strokeStyle = '#fff'; lx.lineCap = 'round';
    lx.lineWidth = 10; lx.beginPath(); lx.moveTo(0, 128); lx.lineTo(1024, 128); lx.stroke();
    for (let x = 30; x < 1010; x += 13) {
      const len = 118 * Math.sin(Math.PI * (x / 1024)) ** .6 + 8;
      for (const sgn of [-1, 1]) {
        lx.lineWidth = 5 + Math.random()*2;
        lx.beginPath(); lx.moveTo(x, 128); lx.lineTo(x + len*.55, 128 + sgn*len*.9); lx.stroke();
        fx.strokeStyle = Math.random() < .5 ? 'rgba(40,52,24,.5)' : 'rgba(150,160,90,.35)'; fx.lineWidth = 3;
        fx.beginPath(); fx.moveTo(x, 128); fx.lineTo(x + len*.55, 128 + sgn*len*.9); fx.stroke();
      }
    }
    const leafAlpha = new THREE.CanvasTexture(lc), leafCol = new THREE.CanvasTexture(fcol);
    leafCol.colorSpace = THREE.SRGBColorSpace;
    const frondMat = new THREE.MeshStandardMaterial({ map:leafCol, alphaMap:leafAlpha, alphaTest:.45, side:THREE.DoubleSide, roughness:.7, envMapIntensity:.6 });
    const frondDepth = new THREE.MeshDepthMaterial({ depthPacking:THREE.RGBADepthPacking, alphaMap:leafAlpha, alphaTest:.45 });
    const frondGeo = new THREE.PlaneGeometry(10, 2.6, 16, 2);
    { const fp = frondGeo.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + 5, w = fp.getY(i); fp.setXYZ(i, x, -Math.pow(x/10, 2)*4.2 - Math.abs(w)*.35, w); } frondGeo.computeVertexNormals(); }
    // Bark: overlapping diamond leaf-bases.
    const bc = document.createElement('canvas'); bc.width = 256; bc.height = 512;
    const bx = bc.getContext('2d'); bx.fillStyle = '#6d5236'; bx.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 512; y += 32) for (let x = (y/32 % 2) * 32; x < 288; x += 64) {
      bx.fillStyle = `rgb(${110 + Math.random()*30|0},${84 + Math.random()*20|0},${58 + Math.random()*14|0})`;
      bx.beginPath(); bx.moveTo(x, y); bx.lineTo(x + 32, y + 22); bx.lineTo(x, y + 40); bx.lineTo(x - 32, y + 22); bx.closePath(); bx.fill();
      bx.strokeStyle = 'rgba(40,28,18,.7)'; bx.lineWidth = 3; bx.stroke();
    }
    const bark = new THREE.CanvasTexture(bc); bark.wrapS = bark.wrapT = THREE.RepeatWrapping; bark.colorSpace = THREE.SRGBColorSpace; bark.repeat.set(2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ map:bark, bumpMap:bark, bumpScale:2, roughness:.95 });
    const palm = (x, z, h, lean) => {
      const g = new THREE.Group();
      const tg = new THREE.CylinderGeometry(.55, .75, h, 14, 12, true);
      { const tp = tg.attributes.position; for (let i = 0; i < tp.count; i++) { const yy = tp.getY(i)/h + .5; tp.setX(i, tp.getX(i) + Math.sin(yy*2.2)*.6*yy); } tg.computeVertexNormals(); }
      const trunk = new THREE.Mesh(tg, trunkMat);
      trunk.position.y = h/2; trunk.castShadow = true; trunk.receiveShadow = true; g.add(trunk);
      const crown = new THREE.Group(); crown.position.set(Math.sin(2.2)*.6, h, 0);
      const N = 26;
      for (let k = 0; k < N; k++) {
        const f = new THREE.Mesh(frondGeo, frondMat);
        f.castShadow = true; f.customDepthMaterial = frondDepth;
        const tier = k % 3;
        f.rotation.order = 'YXZ';
        f.rotation.y = k/N*Math.PI*2 + R()*.3;
        f.rotation.z = (tier === 0 ? .55 : tier === 1 ? .05 : -.45) + (R()-.5)*.25;
        f.rotation.x = (R()-.5)*.6;
        f.scale.setScalar(.75 + R()*.4);
        crown.add(f);
      }
      // Date clusters under the crown.
      const dates = new THREE.Mesh(new THREE.SphereGeometry(.7, 10, 8), new THREE.MeshStandardMaterial({ color:'#a5612a', roughness:.6 }));
      dates.position.set(.6, -1, .3); dates.scale.set(1, 1.6, 1); crown.add(dates);
      g.add(crown); g.position.set(x, 1.2, z); g.rotation.z = lean; g.userData.crown = crown;
      villa.add(g); return g;
    };
    const palms = [palm(-27, 15, 15, .06), palm(-25, -22, 18, -.04), palm(28, 14, 13, -.08), palm(30, -20, 16, .05), palm(-4, 24, 12, .1)];

    villa.position.y = 0;
    scene.add(villa);

    // Drifting sand in the wind.
    const N = 900, sp = new Float32Array(N*3), so = new Float32Array(N);
    for (let i = 0; i < N; i++) { sp.set([(R()-.5)*260, R()*6, (R()-.5)*260], i*3); so[i] = R(); }
    const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sGeo.setAttribute('aO', new THREE.BufferAttribute(so, 1));
    const UD = { ...U, uPR:{ value: renderer.getPixelRatio() } };
    scene.add(new THREE.Points(sGeo, new THREE.ShaderMaterial({ uniforms:UD, transparent:true, depthWrite:false,
      vertexShader:`attribute float aO; uniform float uTime; uniform float uPR; varying float vA;
        void main(){ vec3 p = position; p.x = mod(p.x + uTime*(6. + aO*8.) + 130., 260.) - 130.; p.y += sin(uTime*2. + aO*30.)*.6 + 1.;
          vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv; gl_PointSize = uPR*(1. + aO*1.5)*(120./-mv.z); vA = .35*aO; }`,
      fragmentShader:`uniform float uNight; varying float vA; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(vec3(1.,.85,.6)*(1.-uNight*.7), smoothstep(.5,0.,d)*vA); }` })));

    const dayCol = new THREE.Color('#fff6e8'), duskCol = new THREE.Color('#ff9a4a'), moonCol = new THREE.Color('#8fa6ff');
    const hemiDay = new THREE.Color('#bcd1ff'), hemiNight = new THREE.Color('#2a3770');
    function applySun(hour) {
      const t = (hour - 6.2) / 11.9;
      const elev = Math.sin(Math.PI * THREE.MathUtils.clamp(t, -.15, 1.15)) * 1.15;
      const az = Math.PI * t;
      // Dubai sun path: rises in the east (+x), crosses the south (+z here is south), sets in the west (−x).
      SUN.set(Math.cos(az), Math.max(-.35, elev*.82), Math.sin(az)*.6).normalize();
      const e = SUN.y;
      const night = THREE.MathUtils.smoothstep(-e, -.02, .12);
      const lowSun = 1 - THREE.MathUtils.smoothstep(e, .05, .45);
      U.uNight.value = night;
      bakeEnv(hour, night);
      scene.environmentIntensity = .35 + (1 - night)*.75;
      if (e > -.03) {
        sunL.position.copy(SUN).multiplyScalar(220);
        sunL.color.copy(dayCol).lerp(duskCol, lowSun);
        sunL.intensity = 3.4 * THREE.MathUtils.smoothstep(e, -.03, .12);
      } else {
        sunL.position.set(-80, 160, -60); // moonlight
        sunL.color.copy(moonCol); sunL.intensity = .35;
      }
      hemi.color.copy(hemiDay).lerp(hemiNight, night);
      hemi.intensity = .5 - night*.3;
      renderer.toneMappingExposure = 1 - night*.15 + lowSun*.05;
      scene.fog.color.copy(fogDay).lerp(fogDusk, lowSun).lerp(fogNight, night);
      glass.emissiveIntensity = night*1.8 + lowSun*.25;
      lanternMat.emissiveIntensity = night*4;
      poolLight.intensity = night*90;
      terraceLight.intensity = night*140;
    }

    const look = new THREE.Vector3(), right = new THREE.Vector3(), UP = new THREE.Vector3(0,1,0);
    stage.onFrame.push((t, dt) => {
      U.uTime.value = t;
      if (sun.playing && !stage.still) {
        let h = sun.hour + dt*.9;
        if (h > 20.5) { h = 20.5; sun.playing = false; onPlaying?.(false); }
        sun.hour = h; onHour?.(h);
      }
      applySun(sun.hour);
      palms.forEach((p, i) => { p.userData.crown.rotation.z = Math.sin(t*1.3 + i)*.03; p.userData.crown.rotation.x = Math.cos(t*1.1 + i*2)*.02; });
      const p = stage.pointer, s = stage.scroll;
      const narrow = stage.width / stage.height < 1;
      const ang = 2.25 + Math.sin(t*.05)*.22 + p.x*.15 + stage.orbit.yaw;
      const rad = (narrow ? 190 : 158) - s*20;
      camera.position.set(Math.cos(ang)*rad, Math.max(6, 30 - p.y*6 + s*30 + stage.orbit.pitch*110), Math.sin(ang)*rad);
      look.set(0, narrow ? 14 : 5, 0);
      // Push the villa to the right of the headline on wide screens.
      right.subVectors(look, camera.position).cross(UP).normalize();
      if (!narrow) look.addScaledVector(right, -44);
      camera.lookAt(look);
    });
  }
  stage.invalidate();
  return {
    destroy: stage.destroy,
    setHour(h) {
      sun.hour = h;
      sun.playing = false;
      stage.invalidate();
    },
    setPlaying(on) {
      sun.playing = on;
      if (on && sun.hour > 20.3) sun.hour = 6;
      stage.invalidate();
    },
  };
}
