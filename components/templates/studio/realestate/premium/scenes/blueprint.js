// Blueprint: a 48-storey twisting tower that draws and builds itself (adapted from the standalone page).
// The page drives the build slider and the Drawing / Render switch; the scene moves the floor callout.
import { THREE, createStage } from "../stage.js";

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ target?: number, callout?: HTMLElement | null, callLevel?: HTMLElement | null, callH?: HTMLElement | null, onFirstDrag?: () => void }} [options]
 */
export async function mountBlueprint(canvas, { target = 62, callout, callLevel, callH, onFirstDrag } = {}) {
  const FLOORS = 48, FH = 3.6, TWIST = Math.PI / 2;
  const state = { target, shown: 0 };
  const mode = { target: 0 };
  const stage = createStage(canvas, { fov:30, alpha:true, toneMapping:THREE.NoToneMapping, label:'Drawing of a 48-storey twisting tower. Drag to turn it.', onFirstDrag });
  if (!stage) return null;
  if (stage.still) state.shown = state.target;
  {
    const { scene, camera, renderer } = stage;
    renderer.setClearColor(0x000000, 0);

    // Floor plate: a rounded rectangle, sampled as a closed loop.
    const plate = (n = 40) => {
      const pts = [], W = 26, D = 16, r = 6;
      for (let i = 0; i < n; i++) {
        const t = i/n * Math.PI*2;
        const c = Math.cos(t), s = Math.sin(t);
        const px = Math.sign(c) * (W/2 - r) + r*c, pz = Math.sign(s) * (D/2 - r) + r*s;
        pts.push([px, pz]);
      }
      return pts;
    };
    const P = plate();
    const rot = (x, z, a) => [x*Math.cos(a) - z*Math.sin(a), x*Math.sin(a) + z*Math.cos(a)];
    const linePos = [], lineFloor = [], lineKind = [];
    const push = (a, b, f, k) => { linePos.push(...a, ...b); lineFloor.push(f, f); lineKind.push(k, k); };
    for (let f = 0; f <= FLOORS; f++) {
      const a = f/FLOORS*TWIST, y = f*FH;
      const ring = P.map(([x,z]) => { const [rx,rz] = rot(x,z,a); return [rx, y, rz]; });
      for (let i = 0; i < ring.length; i++) push(ring[i], ring[(i+1)%ring.length], f, f % 4 === 0 ? 1 : 0);
      if (f < FLOORS) {
        const a2 = (f+1)/FLOORS*TWIST;
        for (let i = 0; i < P.length; i += 4) {
          const [x,z] = P[i];
          const [r1x,r1z] = rot(x,z,a), [r2x,r2z] = rot(x,z,a2);
          push([r1x, y, r1z], [r2x, y+FH, r2z], f + .999, 2);
        }
      }
    }
    // Core and columns inside the plate
    for (let f = 0; f < FLOORS; f++) {
      const y = f*FH;
      [[-4.5,-3],[4.5,-3],[4.5,3],[-4.5,3]].forEach(([x,z], i, arr) => { const [nx,nz] = arr[(i+1)%4]; push([x,y,z],[nx,y,nz], f, 3); push([x,y,z],[x,y+FH,z], f+.999, 3); });
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aFloor', new THREE.Float32BufferAttribute(lineFloor, 1));
    lineGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(lineKind, 1));
    const U = { uBuild:{ value:0 }, uTime:{ value:0 }, uRender:{ value:0 } };
    // (mode is declared at the top so the page can switch it)
    const lines = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
      uniforms:U, transparent:true, depthWrite:false,
      vertexShader:`attribute float aFloor; attribute float aKind; varying float vF; varying float vK; varying float vY;
        void main(){ vF = aFloor; vK = aKind; vY = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`uniform float uBuild; uniform float uTime; uniform float uRender; varying float vF; varying float vK; varying float vY;
        void main(){
          vec3 graphite = vec3(.12,.137,.157), cobalt = vec3(.137,.25,.84), signal = vec3(1.,.353,.12);
          float built = step(vF, uBuild);
          float front = smoothstep(1.6, 0., abs(vF - uBuild));
          if (built < .5) {
            // Future floors: faint dashed construction lines.
            if (mod(gl_FragCoord.x + gl_FragCoord.y, 7.) > 3.) discard;
            gl_FragColor = vec4(cobalt, (vK > 2.5 ? .0 : .22) * (1. - uRender*.5));
            return;
          }
          vec3 c = vK > 2.5 ? graphite : mix(graphite, cobalt, vK > .5 ? .85 : .55);
          float a = vK > 2.5 ? .35 : (vK > .5 ? .95 : .55);
          c = mix(c, signal, front); a = max(a, front);
          a *= 1. - uRender*(vK > 1.5 ? .25 : .7);
          c = mix(c, vec3(.85,.88,.92), uRender*(1.-front));
          gl_FragColor = vec4(c, a);
        }`
    }));
    scene.add(lines);

    // Glazing: translucent facade bands for built floors.
    const gPos = [], gFloor = [];
    for (let f = 0; f < FLOORS; f++) {
      const a1 = f/FLOORS*TWIST, a2 = (f+1)/FLOORS*TWIST;
      for (let i = 0; i < P.length; i++) {
        const [x1,z1] = P[i], [x2,z2] = P[(i+1)%P.length];
        const A = rot(x1,z1,a1), B = rot(x2,z2,a1), C = rot(x1,z1,a2), D = rot(x2,z2,a2);
        const y = f*FH, y2 = y + FH;
        gPos.push(A[0],y,A[1], B[0],y,B[1], C[0],y2,C[1],  B[0],y,B[1], D[0],y2,D[1], C[0],y2,C[1]);
        for (let k = 0; k < 6; k++) gFloor.push(f);
      }
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPos, 3));
    gGeo.setAttribute('aFloor', new THREE.Float32BufferAttribute(gFloor, 1));
    gGeo.computeVertexNormals();
    const glass = new THREE.Mesh(gGeo, new THREE.ShaderMaterial({
      uniforms:U, transparent:true, depthWrite:false, side:THREE.DoubleSide,
      vertexShader:`attribute float aFloor; varying float vF; varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying float vY;
        void main(){ vF = aFloor; vY = position.y; vN = normalize(normalMatrix*normal); vWN = normalize(mat3(modelMatrix)*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader:`uniform float uBuild; uniform float uRender; varying float vF; varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying float vY;
        void main(){
          if (vF + 1. > uBuild + .001) discard;
          vec3 n = normalize(vN);
          float fres = pow(1. - abs(dot(n, vV)), 2.);
          vec4 draw = vec4(vec3(.137,.25,.84), .05 + fres*.22);
          // Render mode: reflective blue-silver glass catching a warm evening sky, with floor slabs and mullions.
          vec3 wn = normalize(vWN);
          float sky = wn.x*.5 + .5;
          vec3 refl = mix(vec3(.16,.24,.38), vec3(.95,.72,.52), smoothstep(.2,.95,sky));
          refl = mix(refl, vec3(.82,.88,.95), fres*.6);
          float slab = smoothstep(.08,.0,fract(vY/3.6)) + smoothstep(.92,1.,fract(vY/3.6));
          vec3 glassCol = mix(refl, vec3(.88,.9,.92), slab*.85);
          float lit = step(.82, fract(sin(dot(floor(vec2(vY/3.6, gl_FragCoord.x*.02)), vec2(12.9898,78.233)))*43758.5453));
          glassCol += vec3(1.,.8,.55) * lit * .25 * (1. - slab);
          vec4 render = vec4(glassCol, .94);
          gl_FragColor = mix(draw, render, uRender);
        }`
    }));
    scene.add(glass);

    // Tower crane rides the build front.
    const crane = new THREE.Group();
    const craneMat = new THREE.LineBasicMaterial({ color:0xff5a1f, transparent:true, opacity:.95 });
    const mastPts = [];
    for (let k = 0; k < 6; k++) { const y = k*2; mastPts.push(-.6,y,-.6, .6,y+2,.6, .6,y,-.6, -.6,y+2,.6, -.6,y,-.6,-.6,y+2,-.6, .6,y,.6,.6,y+2,.6); }
    const mastGeo = new THREE.BufferGeometry(); mastGeo.setAttribute('position', new THREE.Float32BufferAttribute(mastPts, 3));
    crane.add(new THREE.LineSegments(mastGeo, craneMat));
    const jib = new THREE.Group(); jib.position.y = 12;
    const jibPts = [-8,0,0, 22,0,0, -8,1.2,0, 22,0,0, 0,3.5,0, -8,1.2,0, 0,3.5,0, 22,0,0, 18,0,0, 18,-5,0];
    const jibGeo = new THREE.BufferGeometry(); jibGeo.setAttribute('position', new THREE.Float32BufferAttribute(jibPts, 3));
    jib.add(new THREE.LineSegments(jibGeo, craneMat));
    const load = new THREE.Mesh(new THREE.BoxGeometry(2.2,.8,1.4), new THREE.MeshBasicMaterial({ color:0xff5a1f }));
    load.position.set(18,-5.4,0); jib.add(load);
    crane.add(jib);
    crane.position.set(-16, 0, 10);
    scene.add(crane);

    // Site plan: plot boundary with dimension ticks and a north arrow.
    const site = [];
    const S = 40;
    const rect = [[-S,-S*.7],[S,-S*.7],[S,S*.7],[-S,S*.7]];
    rect.forEach((p,i) => { const q = rect[(i+1)%4]; site.push(p[0],0,p[1], q[0],0,q[1]); });
    for (let x = -S; x <= S; x += 4) site.push(x,0,S*.7+1.2, x,0,S*.7+(x%20===0?3:2));
    for (let z = -S*.7; z <= S*.7; z += 4) site.push(S+1.2,0,z, S+(Math.abs(z)<.1?3:2),0,z);
    site.push(S-4,0,-S*.7+4, S-4,0,-S*.7+10, S-4,0,-S*.7+10, S-5,0,-S*.7+8, S-4,0,-S*.7+10, S-3,0,-S*.7+8);
    const siteGeo = new THREE.BufferGeometry(); siteGeo.setAttribute('position', new THREE.Float32BufferAttribute(site, 3));
    scene.add(new THREE.LineSegments(siteGeo, new THREE.LineBasicMaterial({ color:0x1f2328, transparent:true, opacity:.55 })));
    const grid = new THREE.GridHelper(130, 52, 0x2340d6, 0x2340d6); grid.material.transparent = true; grid.material.opacity = .08; scene.add(grid);

    const center = new THREE.Vector3(0, FLOORS*FH*.46, 0), v = new THREE.Vector3();
    stage.onFrame.push((t, dt) => {
      U.uTime.value = t;
      // Build animates toward the slider value; on load it draws itself from the ground up.
      state.shown += (state.target - state.shown) * Math.min(1, dt*2.2);
      U.uRender.value += (mode.target - U.uRender.value) * (stage.still ? 1 : Math.min(1, dt*3));
      glass.material.depthWrite = U.uRender.value > .5;
      if (stage.still) state.shown = state.target;
      const floors = state.shown/100 * FLOORS;
      U.uBuild.value = floors;
      const topY = Math.max(0, floors*FH);
      crane.position.y = Math.max(0, topY - 6);
      crane.visible = state.shown < 99;
      jib.rotation.y = Math.sin(t*.35)*1.2;
      load.position.y = -5.4 + Math.sin(t*.9)*1.5;

      const p = stage.pointer;
      const ang = .75 + t*.06 + p.x*.25 + stage.orbit.yaw;
      const narrow = stage.width < 700;
      const R = narrow ? 470 : 315;
      camera.position.set(Math.cos(ang)*R, 120 - p.y*20 + stage.orbit.pitch*260, Math.sin(ang)*R);
      camera.lookAt(center);

      // HTML callout pinned to the build front.
      v.set(Math.cos(ang+Math.PI/2)*14, topY, Math.sin(ang+Math.PI/2)*8).project(camera);
      const x = (v.x*.5+.5)*stage.width + 70, y = (-v.y*.5+.5)*stage.height - 7;
      if (callout) callout.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      const lvl = Math.max(0, Math.round(floors));
      if (callLevel) callLevel.textContent = lvl >= FLOORS ? 'Roof · Level 48' : lvl === 0 ? 'Ground' : `Level ${lvl}`;
      if (callH) callH.textContent = `+${(topY).toFixed(1)} m`;
    });
    
  }
  stage.invalidate();
  return {
    destroy: stage.destroy,
    setTarget(pct) {
      state.target = pct;
      stage.invalidate();
    },
    setMode(value) {
      mode.target = value;
      stage.invalidate();
    },
  };
}
