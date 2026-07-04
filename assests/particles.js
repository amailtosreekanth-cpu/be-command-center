/* ═══════════════════════════════════════════
   BROKEN ENGLISH — PARTICLE FIELD
   ═══════════════════════════════════════════ */

window.BEParticles = (function() {
  let animId;

  function init(canvasId) {
    const cv  = document.getElementById(canvasId);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    function resize() {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 65 }, () => ({
      x:  Math.random() * cv.width,
      y:  Math.random() * cv.height,
      r:  Math.random() * 0.9 + 0.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      a:  Math.random() * 0.55 + 0.1,
    }));

    function draw() {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, cv.width, cv.height);

      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = cv.width;  if (p.x > cv.width)  p.x = 0;
        if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,0,93,${p.a * 0.17})`;
        ctx.fill();
      });

      /* connection lines */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 115) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,0,93,${(1 - d / 115) * 0.05})`;
            ctx.lineWidth   = 0.5;
            ctx.stroke();
          }
        }
      }
    }
    draw();
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, destroy };
})();
