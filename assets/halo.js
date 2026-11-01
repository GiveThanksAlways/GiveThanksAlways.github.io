// Faint drifting constellation behind the name: points that link into shifting triangles.
// A nod to the old particleground background. Plain 2D canvas, no dependencies.
{
  const canvas = document.getElementById("halo");
  const ctx = canvas?.getContext("2d");
  if (ctx) {
    const N = 34, LINK = 130, pts = [];
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1;
    function resize() {
      dpr = Math.min(devicePixelRatio, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener("resize", resize);
    for (let i = 0; i < N; i++) {
      pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12 });
    }
    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.lineWidth = 1.2;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d > LINK) continue;
          ctx.strokeStyle = `rgba(217, 197, 90, ${0.6 * (1 - d / LINK)})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
      if (!still && !document.hidden) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !still) { last = performance.now(); requestAnimationFrame(frame); }
    });
  }
}
