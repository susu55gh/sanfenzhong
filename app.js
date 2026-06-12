const QUOTES = [
  "休息不是偷懒，是给下一段路蓄力",
  "你已经足够好了",
  "今天也辛苦你了",
  "照顾好自己，就是照顾好你在乎的一切",
  "允许自己停下来，也是一种能力",
];

const MOOD_ACKS = {
  ok: "嗯，知道了",
  tired: "辛苦了",
  anxious: "没事的，慢慢来",
  happy: "真好",
};

const MOOD_GAMES = {
  ok: "paint",
  tired: "breathing",
  anxious: "tear",
  happy: null, // random
};

const GREETINGS = ["早上好。", "下午好。", "晚上好。"];

// ===== App State =====
const App = {
  currentPage: "page-home",
  sessionCount: 0,
  lastGame: null,
  sessionDuration: 0,
  timerId: null,

  init() {
    this.loadState();
    this.renderGreeting();
    this.bindEvents();
    if (!this.checkRateLimit()) return;
    this.switchPage("page-home");
  },

  loadState() {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("m3_date");
    if (saved !== today) {
      localStorage.setItem("m3_date", today);
      localStorage.setItem("m3_sessions", "0");
      localStorage.setItem("m3_last_time", "0");
      localStorage.setItem("m3_last_game", "");
      localStorage.setItem("m3_quote_index", "0");
      this.sessionCount = 0;
    } else {
      this.sessionCount = parseInt(localStorage.getItem("m3_sessions") || "0");
      this.lastGame = localStorage.getItem("m3_last_game") || null;
    }
  },

  saveSession() {
    this.sessionCount++;
    localStorage.setItem("m3_sessions", String(this.sessionCount));
    localStorage.setItem("m3_last_time", String(Date.now()));
    localStorage.setItem("m3_last_game", this.lastGame || "");
  },

  renderGreeting() {
    const h = new Date().getHours();
    let idx = 0;
    if (h >= 12 && h < 18) idx = 1;
    else if (h >= 18) idx = 2;
    document.getElementById("greeting").textContent = GREETINGS[idx];
  },

  bindEvents() {
    document.querySelectorAll(".mood-card").forEach((card) => {
      card.addEventListener("click", () => this.selectMood(card.dataset.mood));
    });

    document.getElementById("page-completion").addEventListener("click", (e) => {
      if (e.target.closest(".comp-skip") || e.currentTarget === e.target) {
        this.goHome();
      }
    });

    document.getElementById("page-rate-limit").addEventListener("click", () => {
      if (!this.checkRateLimit()) return;
      this.switchPage("page-home");
    });
  },

  checkRateLimit() {
    // Demo 阶段：不设限制，方便反复测试
    return true;
  },

  async selectMood(mood) {
    if (!this.checkRateLimit()) return;

    // Ack phase
    const ackEl = document.getElementById("ack-emoji");
    const ackText = document.getElementById("ack-text");
    const cards = document.querySelectorAll(".mood-card");
    cards.forEach((c) => {
      if (c.dataset.mood === mood) c.classList.add("selected");
    });
    ackEl.innerHTML = document.querySelector(`[data-mood="${mood}"] .mood-emoji`).innerHTML;
    ackText.textContent = MOOD_ACKS[mood];
    this.switchPage("page-ack");
    await sleep(800);

    // Determine game
    let game = MOOD_GAMES[mood];
    if (!game) {
      const choices = ["breathing", "tear", "paint"].filter((g) => g !== this.lastGame);
      game = choices[Math.floor(Math.random() * choices.length)];
    }
    this.lastGame = game;
    localStorage.setItem("m3_last_game", game);

    // Launch game
    this.launchGame(game);
  },

  launchGame(game) {
    const container = document.getElementById("game-container");
    container.innerHTML = "";
    this.switchPage("page-game");

    switch (game) {
      case "breathing":
        BreathingGame.init(container, () => this.completeGame("2 分钟"));
        break;
      case "tear":
        TearGame.init(container, () => this.completeGame("2 分钟"));
        break;
      case "paint":
        PaintGame.init(container, () => this.completeGame("3 分钟"));
        break;
    }
  },

  completeGame(duration) {
    this.sessionDuration = duration;
    this.saveSession();
    const qi = parseInt(localStorage.getItem("m3_quote_index") || "0");
    const quote = QUOTES[qi % QUOTES.length];
    localStorage.setItem("m3_quote_index", String((qi + 1) % QUOTES.length));

    document.getElementById("comp-line1").textContent = "你做到了。";
    document.getElementById("comp-line2").textContent = "真的把自己放在了第一位。";
    document.getElementById("comp-duration").textContent = `今天照顾了自己 ${duration}`;
    document.getElementById("comp-quote").textContent = `"${quote}"`;

    this.switchPage("page-completion");
    this.startDotAnimation();
  },

  startDotAnimation() {
    const el = document.getElementById("comp-dots");
    let i = 0;
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      i++;
      if (i >= 4) {
        clearInterval(this.timerId);
        this.timerId = null;
        this.goHome();
        return;
      }
      el.textContent = "●".repeat(i) + "○".repeat(3 - i);
    }, 1200);
  },

  goHome() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    document.querySelectorAll(".mood-card").forEach((c) => c.classList.remove("selected"));
    this.loadState();
    if (this.checkRateLimit()) {
      this.switchPage("page-home");
    }
  },

  switchPage(pageId) {
    document.querySelectorAll(".page.active").forEach((p) => {
      p.classList.remove("active");
      p.classList.add("exit");
      setTimeout(() => p.classList.remove("exit"), 400);
    });
    document.getElementById(pageId).classList.add("active");
    this.currentPage = pageId;
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => App.init());
