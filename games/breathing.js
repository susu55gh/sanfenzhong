const BreathingGame = {
  container: null,
  onComplete: null,
  round: 0,
  maxRounds: 3,
  phaseTimer: null,
  retryCount: 0,

  init(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.round = 0;
    this.retryCount = 0;

    // Intro
    container.innerHTML = `
      <div class="breathing-intro" id="breathing-intro">
        跟着它呼吸<br>它会带着你
      </div>
    `;

    setTimeout(() => this.start(), 1800);
  },

  getTimings(round) {
    // retry runs use full timing from the start
    if (this.retryCount > 0) return { inhale: 4000, hold: 5000, exhale: 8000 };
    // First session: progressive
    if (round === 0) return { inhale: 3000, hold: 3000, exhale: 6000 };
    if (round === 1) return { inhale: 3500, hold: 4000, exhale: 7000 };
    return { inhale: 4000, hold: 5000, exhale: 8000 };
  },

  start() {
    this.container.innerHTML = `
      <div class="breathing-wrap">
        <div class="breathing-circle" id="breathing-circle"></div>
        <div class="breathing-text" id="breathing-text"></div>
        <div class="breathing-cycle" id="breathing-cycle"></div>
        <button class="breathing-leave" id="breathing-leave">离开</button>
      </div>
    `;

    const leaveBtn = document.getElementById("breathing-leave");
    leaveBtn.addEventListener("click", () => {
      if (confirm("确定要结束吗？")) {
        this.cleanup();
        this.onComplete();
      }
    });

    this.round = 0;

    // Force layout so initial scale(0.4) takes effect before transition starts
    void document.getElementById("breathing-circle").offsetHeight;

    this.doCycle();
  },

  doCycle() {
    if (this.round >= this.maxRounds) {
      this.showRetryPrompt();
      return;
    }

    const circle = document.getElementById("breathing-circle");
    const text = document.getElementById("breathing-text");
    const cycle = document.getElementById("breathing-cycle");

    if (!circle) return;

    const t = this.getTimings(this.round);
    cycle.textContent = `${this.round + 1} / ${this.maxRounds}`;

    // Phase 1: Inhale
    circle.style.transition = `transform ${t.inhale}ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${t.inhale}ms`;
    circle.style.transform = "scale(1)";
    circle.style.boxShadow = "0 0 40px rgba(124,154,139,0.3), 0 0 80px rgba(124,154,139,0.1)";
    text.textContent = "慢慢吸气……";

    this.phaseTimer = setTimeout(() => {
      // Phase 2: Hold
      circle.style.transition = `transform 300ms ease, box-shadow 300ms ease`;
      circle.style.transform = "scale(1)";
      circle.style.boxShadow = "0 0 30px rgba(124,154,139,0.25), 0 0 60px rgba(124,154,139,0.08)";
      text.textContent = "屏住呼吸";

      this.phaseTimer = setTimeout(() => {
        // Phase 3: Exhale
        circle.style.transition = `transform ${t.exhale}ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow ${t.exhale}ms`;
        circle.style.transform = "scale(0.4)";
        circle.style.boxShadow = "0 0 10px rgba(124,154,139,0.1)";
        text.textContent = "缓缓呼出……";

        this.phaseTimer = setTimeout(() => {
          this.round++;
          this.doCycle();
        }, t.exhale);
      }, t.hold);
    }, t.inhale);
  },

  showRetryPrompt() {
    const container = this.container;
    container.innerHTML = `
      <div class="tear-wrap" style="text-align:center;gap:16px;">
        <div style="font-size:18px;color:var(--text);margin-bottom:12px;">感觉怎么样？</div>
        <div style="display:flex;gap:12px;">
          <button class="tear-btn" id="breathing-retry" style="background:var(--card);color:var(--text);border:1px solid #E8E2DA;">再来一次</button>
          <button class="tear-btn" id="breathing-done">好了</button>
        </div>
      </div>
    `;

    document.getElementById("breathing-retry").addEventListener("click", () => {
      this.retryCount++;
      this.round = 0;
      this.start();
    });

    document.getElementById("breathing-done").addEventListener("click", () => {
      this.cleanup();
      this.onComplete();
    });
  },

  cleanup() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  },
};
