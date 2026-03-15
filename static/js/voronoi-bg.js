(() => {
    const canvas = document.getElementById("voronoi-bg");
    if (!canvas) return;
  
    // If d3-delaunay failed to load, bail quietly.
    const getDelaunay = () => (window.d3 && window.d3.Delaunay) ? window.d3.Delaunay : null;
  
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1;
  
    // Tunables
    const GRID = 65;              // larger = fewer cells (try 70–120)
    const LINE_ALPHA = 0.3;      // wireframe intensity (0.06–0.14 is subtle)
    const LINE_WIDTH = 1;         // in CSS pixels
    const SPOT_RADIUS = 150;      // px
  
    let points = [];
    let needsRebuild = true;
  
    function resizeCanvas() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
  
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
  
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRebuild = true;
    }
  
    function randomPoints() {
        // Expected number of points given an average spacing ~ GRID
        const targetCount = Math.max(50, Math.round((w * h) / (GRID * GRID)));
        
        const pts = [];
        for (let i = 0; i < targetCount; i++) {
            pts.push([Math.random() * w, Math.random() * h]);
        }
        
        // Add a few extra points around the border to avoid big edge cells
        const pad = GRID;
        const edgeCount = Math.max(8, Math.round((w + h) / (2 * GRID)));
        for (let i = 0; i < edgeCount; i++) {
            const t = i / edgeCount;
            pts.push([t * w, -pad]);
            pts.push([t * w, h + pad]);
            pts.push([-pad, t * h]);
            pts.push([w + pad, t * h]);
        }
        
        return pts;
    }
  
    function drawVoronoiWireframe() {
      const Delaunay = getDelaunay();
      if (!Delaunay) return;
  
      ctx.clearRect(0, 0, w, h);
  
      points = randomPoints();
      const delaunay = Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, w, h]);
  
      ctx.save();
      ctx.globalAlpha = LINE_ALPHA;
      ctx.lineWidth = LINE_WIDTH;
      ctx.strokeStyle = "#777"; // light gray; mask makes it subtle anyway
      ctx.beginPath();
      voronoi.render(ctx);
      ctx.stroke();
      ctx.restore();
  
      needsRebuild = false;
    }
  
    // Spotlight mask only: cheap updates on mousemove
    function setSpot(x, y) {
      // Use CSS pixels
      document.documentElement.style.setProperty("--spot-x", `${x}px`);
      document.documentElement.style.setProperty("--spot-y", `${y}px`);
      document.documentElement.style.setProperty("--spot-radius", `${SPOT_RADIUS}px`);
    }
  
    // Throttle mousemove to animation frames
    let pending = false;
    let lastX = w / 2, lastY = h / 2;
  
    function onMove(e) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        setSpot(lastX, lastY);
        pending = false;
      });
    }
  
    function onTouch() {
      // Optional: disable on touch devices
      canvas.style.display = "none";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onTouch);
    }
  
    function init() {
      resizeCanvas();
      setSpot(w / 2, h / 2);
  
      // Build once d3 is available
      const waitForD3 = () => {
        if (getDelaunay()) {
          drawVoronoiWireframe();
        } else {
          setTimeout(waitForD3, 50);
        }
      };
      waitForD3();
  
      window.addEventListener("resize", () => {
        resizeCanvas();
        if (needsRebuild) drawVoronoiWireframe();
      });
  
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true, once: true });
    }
  
    init();
  })();