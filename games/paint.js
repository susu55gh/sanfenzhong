const PaintGame = {
  container: null,
  onComplete: null,
  canvas: null,
  ctx: null,
  isDrawing: false,
  coverPixels: new Set(),
  lastPoint: null,
  coverPercent: 0,
  checkInterval: null,
  timeLimit: null,
  completed: false,
  radius: 30,
  circleCenter: { x: 140, y: 140 },
  circleRadius: 130,

  init(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.coverPixels = new Set();
    this.coverPercent = 0;
    this.completed = false;
    this.isDrawing = false;
    this.lastPoint = null;

    container.innerHTML = `
      <div class="paint-wrap">
        <canvas class="paint-canvas" id="paint-canvas" width="280" height="280"></canvas>
        <div class="paint-hint" id="paint-hint">用手指涂满这个圆</div>
        <div class="paint-progress"><div class="paint-progress-fill" id="paint-fill"></div></div>
      </div>
    `;

    this.canvas = document.getElementById("paint-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.drawBaseCircle();

    // Bind events
    this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    this.canvas.addEventListener("pointerup", () => this.onPointerUp());
    this.canvas.addEventListener("pointerleave", () => this.onPointerUp());

    // Coverage sampling
    this.checkInterval = setInterval(() => this.sampleCoverage(), 300);

    // Time limit: 3 min
    this.timeLimit = setTimeout(() => this.autoComplete(), 180000);
  },

  drawBaseCircle() {
    const ctx = this.ctx;
    const c = this.circleCenter;
    const r = this.circleRadius;

    ctx.clearRect(0, 0, 280, 280);
    // Fill entire canvas with bg
    ctx.fillStyle = "#F5F0EB";
    ctx.fillRect(0, 0, 280, 280);
    // Draw the target circle area in white
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFBF7";
    ctx.fill();
    // Subtle border
    ctx.strokeStyle = "#E8E2DA";
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  isInCircle(x, y) {
    const dx = x - this.circleCenter.x;
    const dy = y - this.circleCenter.y;
    return dx * dx + dy * dy <= this.circleRadius * this.circleRadius;
  },

  onPointerDown(e) {
    if (this.completed) return;
    e.preventDefault();
    const pos = this.getCanvasPos(e);
    this.isDrawing = true;
    this.lastPoint = pos;
    this.paint(pos.x, pos.y);
  },

  onPointerMove(e) {
    if (!this.isDrawing || this.completed) return;
    e.preventDefault();
    const pos = this.getCanvasPos(e);
    this.paint(pos.x, pos.y);
    this.lastPoint = pos;
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  },

  onPointerUp() {
    this.isDrawing = false;
    this.lastPoint = null;
  },

  paint(x, y) {
    if (!this.isInCircle(x, y)) return;

    const ctx = this.ctx;
    const r = this.radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    // Watercolor-like layered brush
    ctx.fillStyle = "rgba(124, 154, 139, 0.12)";
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();

    // Also paint along the line between last and current point
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 8));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = this.lastPoint.x + dx * t;
        const py = this.lastPoint.y + dy * t;
        if (this.isInCircle(px, py)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = "rgba(124, 154, 139, 0.08)";
          ctx.fillRect(px - r, py - r, r * 2, r * 2);
          ctx.restore();
        }
      }
    }
  },

  sampleCoverage() {
    if (this.completed) return;
    if (!this.canvas) return;

    const ctx = this.ctx;
    const c = this.circleCenter;
    const cr = this.circleRadius;
    let total = 0;
    let covered = 0;

    // Grid sampling: every 4px
    for (let x = c.x - cr; x <= c.x + cr; x += 4) {
      for (let y = c.y - cr; y <= c.y + cr; y += 4) {
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy > cr * cr) continue;
        total++;
        const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        // Check if pixel is not the white background (#FFFBF7 or similar)
        if (px[0] < 200 || px[1] < 210 || px[2] < 220) {
          covered++;
        }
      }
    }

    if (total === 0) return;
    this.coverPercent = (covered / total) * 100;

    const fill = document.getElementById("paint-fill");
    if (fill) fill.style.width = Math.min(this.coverPercent, 100) + "%";

    if (this.coverPercent >= 85) {
      this.complete();
    }
  },

  complete() {
    if (this.completed) return;
    this.completed = true;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.timeLimit) {
      clearTimeout(this.timeLimit);
      this.timeLimit = null;
    }

    // Glow effect
    const ctx = this.ctx;
    const c = this.circleCenter;
    const r = this.circleRadius;
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#A8C5B0";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#A8C5B0";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    document.getElementById("paint-hint").textContent = "完成了 ✦";

    setTimeout(() => {
      this.onComplete();
    }, 2000);
  },

  autoComplete() {
    if (this.completed) return;
    this.completed = true;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.timeLimit) {
      clearTimeout(this.timeLimit);
      this.timeLimit = null;
    }

    document.getElementById("paint-hint").textContent = "时间到了，这样也很好 ✦";

    setTimeout(() => {
      this.onComplete();
    }, 1500);
  },

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.timeLimit) {
      clearTimeout(this.timeLimit);
      this.timeLimit = null;
    }
    this.completed = true;
  },
};
