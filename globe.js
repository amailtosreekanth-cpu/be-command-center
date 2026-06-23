/* ═══════════════════════════════════════════
   BROKEN ENGLISH — THREE.JS GLOBE
   Real shader globe with India topology hotspots
   ═══════════════════════════════════════════ */

window.BEGlobe = (function() {

  let renderer, scene, camera, globeMesh, atmMesh;
  let hotspotDots = [];
  let orbitRing;
  let animId;
  let time = 0;

  const HOTSPOTS = [
    { lat: 10.0,  lon: 76.2,  color: '#FF005D', size: 0.030, pulse: true,  label: 'Kochi HQ' },
    { lat: 10.85, lon: 76.55, color: '#00FF88', size: 0.022, pulse: true,  label: 'Edappal' },
    { lat: 12.97, lon: 77.59, color: '#00B8FF', size: 0.017, pulse: false, label: 'Bangalore' },
    { lat: 20.0,  lon: 78.0,  color: '#FFC400', size: 0.014, pulse: false, label: 'India' },
    { lat: 28.6,  lon: 77.2,  color: '#B95CFF', size: 0.012, pulse: false, label: 'Delhi' },
  ];

  function latLonToVec3(lat, lon, radius) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
       radius * Math.cos(phi),
       radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  const VERT_SHADER = `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vNormal   = normalize(normalMatrix * normal);
      vUv       = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const FRAG_SHADER = `
    uniform float uTime;
    uniform vec3  uColor1;
    uniform vec3  uColor2;
    varying vec3  vNormal;
    varying vec2  vUv;
    varying vec3  vPosition;

    #define PI 3.14159265358979

    float gridLine(float coord, float freq, float thickness) {
      float f = fract(coord * freq);
      return smoothstep(thickness, 0.0, f) + smoothstep(1.0 - thickness, 1.0, f);
    }

    void main() {
      /* latitude & longitude grid */
      float lat  = vUv.y;
      float lon  = vUv.x;

      float latLine = gridLine(lat, 12.0, 0.022);  /* 12 latitude bands */
      float lonLine = gridLine(lon, 24.0, 0.018);  /* 24 longitude bands */
      float grid    = max(latLine, lonLine);

      /* thicker equator & prime meridian */
      float equator = smoothstep(0.025, 0.0, abs(lat - 0.5)) * 0.6;
      float meridian = smoothstep(0.012, 0.0, min(lon, 1.0 - lon)) * 0.3;

      /* edge rim glow */
      float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5) * 0.45;

      /* animated shimmer */
      float shimmer = sin(uTime * 1.1 + lat * PI * 6.0) * 0.06 + 0.94;

      /* hemisphere gradient */
      vec3 col = mix(uColor1, uColor2, vUv.y * 0.7 + 0.15);

      float alpha = (grid * 0.7 + equator + meridian + rim) * shimmer;
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(col, alpha * 0.92);
    }
  `;

  const ATM_VERT = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const ATM_FRAG = `
    uniform vec3 uGlowColor;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.82 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.5);
      gl_FragColor = vec4(uGlowColor, intensity * 0.38);
    }
  `;

  function init(canvasId, width, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.THREE) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.z = 2.75;

    /* ── GLOBE ── */
    const geo  = new THREE.SphereGeometry(1, 72, 72);
    const mat  = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uColor1: { value: new THREE.Color('#FF005D') },
        uColor2: { value: new THREE.Color('#FF6A00') },
      },
      vertexShader:   VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    globeMesh = new THREE.Mesh(geo, mat);
    scene.add(globeMesh);

    /* ── ATMOSPHERE ── */
    const atmGeo = new THREE.SphereGeometry(1.065, 36, 36);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { uGlowColor: { value: new THREE.Color('#FF005D') } },
      vertexShader:   ATM_VERT,
      fragmentShader: ATM_FRAG,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    atmMesh = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmMesh);

    /* ── ORBIT RING ── */
    const orbitGeo = new THREE.TorusGeometry(1.18, 0.003, 8, 128);
    const orbitMat = new THREE.MeshBasicMaterial({ color: '#FF005D', transparent: true, opacity: 0.22 });
    orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    /* ── HOTSPOT DOTS ── */
    HOTSPOTS.forEach(h => {
      const pos = latLonToVec3(h.lat, h.lon, 1.025);

      /* core dot */
      const dotGeo = new THREE.SphereGeometry(h.size, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: h.color, transparent: true, opacity: 0.95 });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);

      /* pulse ring */
      const ringGeo = new THREE.RingGeometry(h.size * 1.6, h.size * 2.4, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: h.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring    = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);

      scene.add(dot);
      scene.add(ring);
      hotspotDots.push({ dot, ring, initSize: h.size, pulse: h.pulse });
    });

    /* ── AMBIENT + POINT LIGHTS ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const pt = new THREE.PointLight('#FF005D', 1.4, 6);
    pt.position.set(2.5, 2, 2.5);
    scene.add(pt);

    animate();
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    time += 0.004;

    globeMesh.rotation.y = time * 0.38;
    atmMesh.rotation.y   = time * 0.38;
    orbitRing.rotation.z = time * 0.14;

    globeMesh.material.uniforms.uTime.value = time;

    hotspotDots.forEach((h, i) => {
      h.dot.rotation.copy(globeMesh.rotation);
      h.ring.rotation.copy(globeMesh.rotation);

      if (h.pulse) {
        const phase = time * 2.2 + i * 0.9;
        const s = 1 + Math.abs(Math.sin(phase)) * 0.55;
        h.ring.scale.setScalar(s);
        h.ring.material.opacity = Math.max(0, 0.6 - Math.abs(Math.sin(phase)) * 0.55);
      }
    });

    renderer.render(scene, camera);
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, destroy };
})();
