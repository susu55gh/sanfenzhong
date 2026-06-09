const TearGame = {
  container: null,
  onComplete: null,
  userText: "",

  init(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.userText = "";
    this.showInput();
  },

  showInput() {
    this.container.innerHTML = `
      <div class="tear-wrap">
        <div class="tear-prompt">今天有什么让你不舒服的事？</div>
        <textarea class="tear-textarea" id="tear-input" placeholder="写下来，它就不会一直待在你脑海里了……" maxlength="200"></textarea>
        <div class="tear-char-count"><span id="tear-count">0</span>/200</div>
        <button class="tear-btn" id="tear-submit">写好了</button>
      </div>
    `;

    const input = document.getElementById("tear-input");
    const count = document.getElementById("tear-count");
    const submit = document.getElementById("tear-submit");

    input.addEventListener("input", () => {
      count.textContent = input.value.length;
    });

    submit.addEventListener("click", () => {
      if (!input.value.trim()) return;
      this.userText = input.value.trim();
      this.showConfirm();
    });
  },

  showConfirm() {
    this.container.innerHTML = `
      <div class="tear-wrap">
        <div class="tear-confirm-text">${this.escapeHtml(this.userText)}</div>
        <div class="tear-confirm-hint">这张纸会被撕掉。准备好了吗？</div>
        <button class="tear-btn" id="tear-confirm-btn">撕掉它</button>
      </div>
    `;

    document.getElementById("tear-confirm-btn").addEventListener("click", () => {
      this.doRip();
    });
  },

  doRip() {
    this.container.innerHTML = `
      <div class="tear-wrap">
        <div class="tear-paper" id="tear-paper">${this.escapeHtml(this.userText)}</div>
      </div>
    `;

    // Trigger animation after next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const paper = document.getElementById("tear-paper");
        if (paper) {
          paper.classList.add("ripped");
        }
      });
    });

    // Show vanish message
    setTimeout(() => {
      this.container.innerHTML = `
        <div class="tear-wrap">
          <div class="tear-vanish-text">它已经不在了。</div>
        </div>
      `;
    }, 700);

    // Complete
    setTimeout(() => {
      this.onComplete();
    }, 2500);
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  cleanup() {},
};
