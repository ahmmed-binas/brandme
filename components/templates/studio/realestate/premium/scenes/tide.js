// Tide: a sail-shaped hotel on the Gulf under a photographed sky (adapted from the standalone page).
import { THREE, createStage, rng } from '../stage.js';
import { loadAddons, physicalSky, hdriSky, windowSheet, facade, mirrorWater } from '../realism.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onFirstDrag?: () => void }} [options]
 */
export async function mountTide(canvas, { onFirstDrag } = {}) {
  const stage = createStage(canvas, {
    fov:38, exposure:.42, toneMapping:THREE.ACESFilmicToneMapping,
    label:'3D view of the coast and a sail-shaped hotel. Drag to look along the coast.', onFirstDrag,
  });
  if (!stage) return null;
  await (async () => {
    const { scene, camera, renderer } = stage;
    const { Sky, Water, mergeGeometries } = await loadAddons();
    if (stage.destroyed) return;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.fog = new THREE.FogExp2('#d9a587', 0.00022);

    // Low sun off to the left, so the sail is side-lit in warm light rather than silhouetted.
    // Code-built sky first so the scene appears at once; the photographed sky replaces it when loaded.
    const SKY = physicalSky(stage, Sky, { elevation:5, azimuth:240, turbidity:8, rayleigh:1.5, mie:.006, mieG:.82 });
    const sunLight = new THREE.DirectionalLight('#ffc38f', 3.2);
    sunLight.position.copy(SKY.sun).multiplyScalar(600);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left:-120, right:120, top:160, bottom:-40, near:100, far:1400 });
    sunLight.shadow.bias = -.0004;
    scene.add(sunLight, sunLight.target);
    scene.add(new THREE.HemisphereLight('#c9a99a', '#3a2a22', .6));

    // Sea: mirror water with wind-blown normals, reflecting the sky and the hotel.
    const sea = mirrorWater(stage, Water, { geometry:new THREE.PlaneGeometry(12000, 12000), sun:SKY.sun, sunColor:'#ffd2a6', waterColor:'#0a3a42', distortion:3.2, size:1.6 });
    scene.add(sea);

    /* The sail hotel. H is the height of the occupied tower; the mast rises above it. */
    const H = 120, LEVELS = 44, BAND = H / LEVELS;
    const front = (v) => 50 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.02)), .78) * (1 - v * .18); // forward reach of the sail edge
    const half = (v) => 17 * (1 - Math.pow(v, 1.5)) + 2.2;                                                 // half-spread of the V
    const tip = (v, s) => new THREE.Vector3(s * half(v), v * H, front(v));
    const hotel = new THREE.Group();

    // Guest-room wings: two arms of the V, stacked as floor bands from the spine to the sail edge.
    const armParts = [];
    for (let i = 0; i < LEVELS; i++) {
      const v = (i + .5) / LEVELS;
      for (const s of [-1, 1]) {
        const a = new THREE.Vector3(0, 0, 0), b = tip(v, s); b.y = 0;
        const len = a.distanceTo(b) * .97;
        const g = new THREE.BoxGeometry(6.2, BAND * .999, len);
        g.translate(0, 0, len / 2);
        g.rotateY(Math.atan2(b.x, b.z));
        g.translate(s * 1.6, i * BAND + BAND / 2, -1);
        armParts.push(g);
      }
    }
    const armGeo = mergeGeometries(armParts.map((g) => g.toNonIndexed()));
    const arms = new THREE.Mesh(armGeo, facade(new THREE.MeshStandardMaterial({ envMapIntensity:.8 }), {
      sheet: windowSheet({ style:'residential', lit:.12, seed:404, warm:.95 }), cellW:2.1, cellH:BAND,
      glass:'#1d2b36', frame:'#f1ede6', roof:'#e8e2d8', glassRough:.08, frameRough:.6, glassMetal:.75, frameMetal:0, glow:1,
    }));
    arms.castShadow = arms.receiveShadow = true;
    hotel.add(arms);

    // The sail: a double-skinned PTFE membrane spanning the open front of the V, bowed forward.
    const NU = 40, NV = 60, sp = [], si = [], su = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const v = j / NV, u = i / NU * 2 - 1;
      const L = tip(v, -1), Rt = tip(v, 1);
      const bow = 7.5 * (1 - u*u) * (1 - v * .55) * Math.sin(Math.PI * Math.min(1, v * 1.02)) ** .5;
      sp.push(THREE.MathUtils.lerp(L.x, Rt.x, (u + 1) / 2), v * H, front(v) + bow - .6);
      su.push((u + 1) / 2, v);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const a = j*(NU+1)+i, b = a+1, c = a+NU+1, d = c+1;
      si.push(a, b, c, b, d, c);
    }
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sailGeo.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
    sailGeo.setIndex(si); sailGeo.computeVertexNormals();
    // Fabric panels: horizontal seams every few floors and faint vertical cable lines.
    const fc = document.createElement('canvas'); fc.width = 256; fc.height = 1024;
    const fx = fc.getContext('2d');
    fx.fillStyle = '#ffffff'; fx.fillRect(0, 0, 256, 1024);
    fx.fillStyle = '#d9d4cc'; for (let y = 0; y < 1024; y += 1024/24) fx.fillRect(0, y, 256, 3);
    fx.fillStyle = '#e6e1da'; for (let x = 0; x < 256; x += 256/12) fx.fillRect(x, 0, 1.5, 1024);
    const fabric = new THREE.CanvasTexture(fc); fabric.colorSpace = THREE.SRGBColorSpace; fabric.anisotropy = 8;
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({
      map:fabric, color:'#fbf8f3', roughness:.62, metalness:0, side:THREE.DoubleSide,
      emissive:new THREE.Color('#ffe7cf'), emissiveIntensity:.05, envMapIntensity:.6,
    }));
    sail.castShadow = sail.receiveShadow = true;
    hotel.add(sail);

    // White steel: the two curved front legs, the rear mast, and the X-braced trusses down each side.
    const steel = new THREE.MeshStandardMaterial({ color:'#f3f1ec', roughness:.38, metalness:.25, envMapIntensity:.9 });
    const legPts = (s) => Array.from({ length: 30 }, (_, k) => { const v = k / 29; const p = tip(v, s); p.x += s * .8; p.z += .4; return p; });
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(legPts(s)), 120, 1.5, 12), steel);
      leg.castShadow = true; hotel.add(leg);
      // Side truss: an outer chord following the arm's outer edge, braced to the front leg with X members.
      const outer = Array.from({ length: 30 }, (_, k) => { const v = k / 29; const p = tip(v, s).multiplyScalar(.5); p.y = v * H; p.x += s * 6.5; return p; });
      const chord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outer), 100, .9, 10), steel);
      chord.castShadow = true; hotel.add(chord);
      for (let k = 0; k < 10; k++) {
        const v0 = .05 + k * .085, v1 = v0 + .085;
        const A = tip(v0, s), B = tip(v1, s);
        const C = tip(v0, s).multiplyScalar(.5); C.y = v0 * H; C.x += s * 6.5;
        const D = tip(v1, s).multiplyScalar(.5); D.y = v1 * H; D.x += s * 6.5;
        for (const [p, q] of [[A, D], [C, B]]) {
          const brace = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, p.distanceTo(q), 8), steel);
          brace.position.copy(p).add(q).multiplyScalar(.5);
          brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
          brace.castShadow = true; hotel.add(brace);
        }
      }
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.9, 2.6, H + 34, 16), steel);
    mast.position.set(0, (H + 34) / 2, -2); mast.castShadow = true; hotel.add(mast);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(5, H, 5), steel); spine.position.set(0, H/2, -1.5); hotel.add(spine);

    // Helipad cantilevered off one side near the top, the sky bar off the other.
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, .9, 48), new THREE.MeshStandardMaterial({ color:'#d8d4ce', roughness:.6 }));
    pad.position.set(-19, H * .87, 6); pad.castShadow = true; hotel.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, .25, 6, 48), new THREE.MeshStandardMaterial({ color:'#f2c94c', roughness:.5 }));
    ring.rotation.x = Math.PI/2; ring.position.set(-19, H * .87 + .5, 6); hotel.add(ring);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 22, 8), steel); strut.position.set(-12, H * .82, 3); strut.rotation.z = 1.05; hotel.add(strut);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 11), facade(new THREE.MeshStandardMaterial(), {
      sheet: windowSheet({ style:'office', lit:.5, seed:9 }), cellW:1.6, cellH:3, glass:'#1a2a36', frame:'#f1ede6', glow:1.2,
    }));
    bar.position.set(16, H * .9, 2); bar.rotation.y = -.25; bar.castShadow = true; hotel.add(bar);

    // Island, podium and the curved causeway.
    const stone = new THREE.MeshStandardMaterial({ color:'#d9c8ae', roughness:.85 });
    const isle = new THREE.Mesh(new THREE.CylinderGeometry(52, 60, 6, 64), stone); isle.position.set(0, -2, 10); isle.receiveShadow = true; hotel.add(isle);
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(36, 38, 7, 48), new THREE.MeshStandardMaterial({ color:'#efe9e0', roughness:.7 }));
    podium.position.set(0, 3.5, 6); podium.castShadow = podium.receiveShadow = true; hotel.add(podium);
    const causeway = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-20, 2, 60), new THREE.Vector3(-40, 2, 140), new THREE.Vector3(-20, 2, 230), new THREE.Vector3(30, 2, 300)]), 80, 3, 6), stone);
    causeway.scale.y = .35; hotel.add(causeway);

    hotel.position.set(120, 0, -440);
    hotel.rotation.y = -.3;
    scene.add(hotel);
    sunLight.target.position.copy(hotel.position);
    sunLight.position.copy(hotel.position).addScaledVector(SKY.sun, 600);

    /* The Palm and the Marina skyline in the haze. */
    const sand = new THREE.MeshStandardMaterial({ color:'#d8b58c', roughness:1 });
    const green = new THREE.MeshStandardMaterial({ color:'#3c5a3a', roughness:1 });
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 220), sand); trunk.position.set(0, .4, 40); palm.add(trunk);
    for (let i = 0; i < 16; i++) {
      const side = i < 8 ? -1 : 1, idx = i % 8, len = 90 - Math.abs(idx - 3.5) * 8;
      const f = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 6), sand);
      f.position.set(side * (len/2 + 10), .3, -50 + idx * 15); f.rotation.y = side * (-.5 + idx*.06); palm.add(f);
      const gr = new THREE.Mesh(new THREE.BoxGeometry(len*.85, 3, 3), green); gr.position.copy(f.position); gr.position.y = 1.5; gr.rotation.copy(f.rotation); palm.add(gr);
    }
    const cres = new THREE.Mesh(new THREE.TorusGeometry(160, 4, 6, 72, Math.PI*1.25), sand);
    cres.rotation.x = -Math.PI/2; cres.rotation.z = Math.PI*.12; palm.add(cres);
    palm.position.set(-420, 0, -720); palm.rotation.y = -.4;
    scene.add(palm);

    const R = rng(51877);
    const towers = [];
    for (let i = 0; i < 70; i++) towers.push([-2600 + i*26 + R()*16, -2300 - R()*160, 12 + R()*12, 40 + Math.pow(R(), 1.5)*200, 12 + R()*10, R()]);
    const tGeo = new THREE.BoxGeometry(1,1,1); tGeo.translate(0,.5,0);
    const skyline = new THREE.InstancedMesh(tGeo, facade(new THREE.MeshStandardMaterial(), {
      sheet: windowSheet({ style:'office', lit:.08, seed:77 }), cellW:2, cellH:1.6, glass:'#33404d', frame:'#c2b4a6', glassRough:.1, glassMetal:.8, glow:.6,
    }), towers.length);
    { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), seeds = new Float32Array(towers.length);
      towers.forEach((b, i) => { m.compose(new THREE.Vector3(b[0], 0, b[1]), q, new THREE.Vector3(b[2], b[3], b[4])); skyline.setMatrixAt(i, m); seeds[i] = b[5]; });
      tGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); }
    // The photographed horizon already carries distant shoreline, so the block skyline stays out.

    // Yachts: white hulls with dark glazing, rocking in the swell.
    const white = new THREE.MeshStandardMaterial({ color:'#fbf8f3', roughness:.3, metalness:.05 });
    const dark = new THREE.MeshStandardMaterial({ color:'#16212a', roughness:.08, metalness:.8 });
    const hull = (() => { const s = new THREE.Shape(); s.moveTo(-8, 0); s.lineTo(6, 0); s.quadraticCurveTo(10, 0, 11, 1.4); s.lineTo(-8, 1.4); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth:4, bevelEnabled:true, bevelSize:.6, bevelThickness:.6, bevelSegments:3 }); g.translate(0, -.6, -2); return g; })();
    const boats = [[-60, -120, .4], [60, -200, 2.4], [-190, -70, 1.1], [120, -80, 2.9], [-20, -260, 1.8]].map(([x, z, r], i) => {
      const b = new THREE.Group();
      const h = new THREE.Mesh(hull, white); h.castShadow = true; b.add(h);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(9, 1.8, 3.6), white); deck.position.set(-1.5, 1.9, 0); b.add(deck);
      const glaze = new THREE.Mesh(new THREE.BoxGeometry(8.2, .9, 3.7), dark); glaze.position.set(-1.2, 2.1, 0); b.add(glaze);
      const fly = new THREE.Mesh(new THREE.BoxGeometry(5, .4, 3.2), white); fly.position.set(-2.5, 3.2, 0); b.add(fly);
      b.scale.setScalar(.9 + (i % 3) * .2);
      b.position.set(x, .2, z); b.rotation.y = r; b.userData = { x, z, r, ph: i * 1.7 };
      scene.add(b); return b;
    });

    // Photographic sky: Poly Haven "Umhlanga Sunrise" (CC0).
    hdriSky(stage, '/samples/re/sky/umhlanga_sunrise_1k.hdr', { sunAzimuth:240, intensity:1, envIntensity:1 }).then((h) => {
      scene.remove(SKY.sky);
      scene.fog.color.copy(h.horizon);
      renderer.toneMappingExposure = .9;
      sunLight.position.copy(hotel.position).addScaledVector(h.sun, 600);
      sea.material.uniforms.sunDirection.value.copy(h.sun);
      stage.invalidate();
    }).catch(() => {});

    const look = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
    stage.onFrame.push((t) => {
      sea.material.uniforms.time.value = t * .55;
      const p = stage.pointer, s = stage.scroll;
      const sway = Math.sin(t * .07) * .1;
      camera.position.set(Math.sin(sway) * 40 + p.x * 12, 10 + Math.sin(t * .6) * .4 - p.y * 3 + s * 40, 70 + s * -40);
      const narrow = stage.width / stage.height < 1;
      look.set((narrow ? 110 : -40) + p.x * 10 + sway * 60, (narrow ? 60 : 44) + s * 10, -330).sub(camera.position);
      look.applyAxisAngle(UPV, -stage.orbit.yaw);
      look.y += stage.orbit.pitch * -260;
      camera.lookAt(look.add(camera.position));
      boats.forEach((b) => {
        const ph = t * 1.1 + b.userData.ph;
        b.position.y = .2 + Math.sin(ph) * .35;
        b.rotation.set(Math.sin(ph * .9) * .03, b.userData.r, Math.cos(ph * .7) * .04);
      });
    });
    stage.invalidate();
  })();
  return stage.destroyed ? null : { destroy: stage.destroy };
}
