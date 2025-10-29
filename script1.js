// ========== TIMER VARIABLES ==========
let duration = 0;
let timeLeft = 0;
let timer = null;
let isRunning = false;
let focusSprints = 0;
let breakSessions = 0;
let tasks = [];
let mode = "focus";
let points = 0;
let lastFocusDuration = 0;
// EXP / LEVEL
let exp = 0;
let level = 1;

// ========== CIRCULAR TIMER PROGRESS ==========
const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  const offset = circumference - percent * circumference;
  circle.style.strokeDashoffset = offset;
}

// ========== TIMER FUNCTIONS ==========
function setMode(minutes, newMode = "focus") {
  resetTimer();
  duration = minutes * 60;
  timeLeft = duration;
  mode = newMode;

  if (newMode === "focus") lastFocusDuration = minutes;
  updateDisplay();
  setProgress(0);
}

function setTestMode() {
  resetTimer();
  duration = 5;
  timeLeft = duration;
  mode = "test";
  updateDisplay();
  setProgress(0);
  startTimer();
}

function startTimer() {
  if (isRunning || timeLeft <= 0) return;

  if (mode === "focus" && tasks.length === 0) {
    alert("⚠️ Please add at least one task before starting the timer.");
    return;
  }

  isRunning = true;
  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    setProgress((duration - timeLeft) / duration);

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;

      if (mode === "focus") {
        focusSprints++;
        points += 20;
        // award exp for completing a sprint
        try { addExp(5); } catch (e) { /* exp not present */ }
        updatePointsUI();
        alert("⏰ Focus complete! Take a break?");
        updateStatsUI();
        updateBreakRewardInfo();
      } else if (mode === "break") {
        breakSessions++;
        const reward = calculateBreakReward();
        points += reward;
        updatePointsUI();
        alert(`☕ Break’s over! You earned +${reward} points!`);
        updateStatsUI();
        updateBreakRewardInfo();
      } else if (mode === "test") {
        alert("✅ Test complete!");
      }
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timeLeft = duration;
  updateDisplay();
  setProgress(0);
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("time-display").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ========== TASK SYSTEM ==========
function addTask() {
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ text, status: "pending" });
  input.value = "";
  updateTaskList();
  updateStatsUI(); 
}

function toggleTask(index) {
  const prevStatus = tasks[index].status;
  tasks[index].status = prevStatus === "done" ? "pending" : "done";

  if (prevStatus === "pending" && tasks[index].status === "done") {
    points += 10;
    // award exp for completing a task
    try { addExp(10); } catch (e) { /* exp not present */ }
    updatePointsUI();
  }

  updateTaskList();
  updateStatsUI();
}

function updateTaskList() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" onchange="toggleTask(${index})" ${task.status === "done" ? "checked" : ""}>
      <span>${task.text}</span>
    `;
    list.appendChild(li);
  });
}

// ensure EXP UI updates when stats update
function _safeUpdateExpUI() {
  try { updateExpUI(); } catch (e) { /* ignore if not available */ }
}

// ========== STATS (Task Completion Section) ==========
function updateStatsUI() {
  const sprintCount = document.getElementById("sprint-count");
  const breakCount = document.getElementById("break-count");
  if (sprintCount) sprintCount.textContent = focusSprints;
  if (breakCount) breakCount.textContent = breakSessions;

  const grid = document.getElementById("task-grid");
  if (!grid) return; 
  grid.innerHTML = "";

  const isDark = document.body.classList.contains("dark");

  // Display ALL tasks — pending and done
  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No tasks yet.";
    empty.style.opacity = "0.7";
    grid.appendChild(empty);
    return;
  }

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.textContent = `${t.text} - ${t.status}`;
    div.style.background = t.status === "done" ? "#d4edda" : "#f8d7da";
    div.style.color = isDark
      ? (t.status === "done" ? "#155724" : "#721c24")
      : (t.status === "done" ? "#155724" : "#721c24");
    div.style.padding = "6px 10px";
    div.style.borderRadius = "6px";
    div.style.marginBottom = "5px";
    div.style.transition = "all 0.2s ease";
    grid.appendChild(div);
  });
  // update exp UI if available
  _safeUpdateExpUI();
}

// ========== POINTS, REWARDS, THEMES ==========
function updatePointsUI() {
  const pts = document.getElementById("points");
  if (pts) pts.textContent = points;
  updatePointsDisplay();
  renderThemes();
}

function calculateBreakReward() {
  let reward = 10;
  if (focusSprints % 2 === 0) reward = 15;
  if (lastFocusDuration >= 25) reward = 20;
  return reward;
}

function updateBreakRewardInfo() {
  const infoDiv = document.getElementById("break-reward-info");
  if (!infoDiv) return;
  const reward = calculateBreakReward();
  infoDiv.textContent = `💡 Taking a break now can earn you +${reward} points!`;
}

// ========== SETTINGS ==========
function startFocusTimer() {
  let minutes = parseInt(document.getElementById("focus-time").value) || 25;
  if (minutes < 1) minutes = 1;
  setMode(minutes, "focus");
  startTimer();
  updateBreakRewardInfo();
}

function startBreakTimer() {
  let minutes = parseInt(document.getElementById("break-time").value) || 5;
  if (minutes < 1) minutes = 1;
  setMode(minutes, "break");
  startTimer();
  updateBreakRewardInfo();
}

// ========== DISTRACTION ALERT ==========
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning && mode === "focus") {
    alert("🚨 Stay focused! Your session isn’t over yet.");
  }
});

// ========== REWARDS + THEMES ==========
let unlockedThemes = ['light'];
let selectedTheme = 'light';

const themes = [
  { id: 'light', name: 'Light', colors: { bg: '#f5f5f5', text: '#000', panel: '#fff', accent: '#007bff' } },
  { id: 'dark', name: 'Dark', colors: { bg: '#121212', text: '#e0e0e0', panel: '#1e1e1e', accent: '#bb86fc' } },
  { id: 'forest', name: 'Forest', colors: { bg: '#e8f5e9', text: '#1b5e20', panel: '#c8e6c9', accent: '#43a047' } },
  { id: 'ocean', name: 'Ocean', colors: { bg: '#e3f2fd', text: '#0d47a1', panel: '#bbdefb', accent: '#2196f3' } },
  { id: 'sakura', name: 'Sakura', colors: { bg: '#fff0f5', text: '#880e4f', panel: '#f8bbd0', accent: '#ec407a' } },
  { id: 'midnight', name: 'Midnight', colors: { bg: '#0b132b', text: '#f8f9fa', panel: '#1c2541', accent: '#5bc0be' } },
  { id: 'sunset', name: 'Sunset', colors: { bg: '#fff3e0', text: '#e65100', panel: '#ffe0b2', accent: '#ff9800' } },
  { id: 'mint', name: 'Mint', colors: { bg: '#e8fdf5', text: '#004d40', panel: '#b2fef7', accent: '#26a69a' } },
  { id: 'lavender', name: 'Lavender', colors: { bg: '#f3e5f5', text: '#4a148c', panel: '#e1bee7', accent: '#9c27b0' } },
  { id: 'sand', name: 'Sand', colors: { bg: '#fff8e1', text: '#795548', panel: '#ffe082', accent: '#ffca28' } },
  { id: 'ice', name: 'Ice', colors: { bg: '#e0f7fa', text: '#01579b', panel: '#b2ebf2', accent: '#00bcd4' } },
  { id: 'ember', name: 'Ember', colors: { bg: '#fff5f5', text: '#b71c1c', panel: '#ffcdd2', accent: '#e53935' } },
];

function applyTheme(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  selectedTheme = themeId;
  document.body.style.background = theme.colors.bg;
  document.body.style.color = theme.colors.text;
  document.querySelectorAll('.stats-panel, .settings-panel, .app').forEach(el => {
    el.style.background = theme.colors.panel;
    el.style.color = theme.colors.text;
  });

  // set accent as CSS variable for other UI pieces
  document.documentElement.style.setProperty('--accent', theme.colors.accent);

  // Helper: convert hex to rgb
  function hexToRgb(hex) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  // Helper: choose black or white depending on perceived luminance
  function getContrastColor(hex) {
    try {
      const { r, g, b } = hexToRgb(hex);
      // Perceived luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.6 ? '#000000' : '#ffffff';
    } catch (e) {
      return '#ffffff';
    }
  }

  // small helper to detect elements inside the task area so we can skip them
  function isInTaskArea(el) {
    return el && el.closest && (el.closest('#task-list') || el.closest('#task-grid') || el.closest('.task-grid'));
  }

  // Set button colors (background + contrasting text) and expose CSS vars
  const btnBg = theme.colors.accent || '#007bff';
  const btnText = getContrastColor(btnBg);
  document.documentElement.style.setProperty('--button-bg', btnBg);
  document.documentElement.style.setProperty('--button-text', btnText);

  // Expose main text color as a CSS variable
  const textColor = theme.colors.text || getContrastColor(theme.colors.bg || '#000');
  document.documentElement.style.setProperty('--text-color', textColor);

  // Apply text color to common textual elements, but skip task area elements
  document.querySelectorAll('p, span, label, a, h1, h2, h3, h4, h5, h6, .theme-label, .reward-info, .theme-wrapper').forEach(el => {
    if (isInTaskArea(el)) return;
    el.style.color = textColor;
  });

  // Ensure task area remains with readable (black) text/background regardless of theme
  // This forces the task input and task items to stay visible
  try {
    document.querySelectorAll('#task-list, #task-list li, #task-list li span, #task-grid, #task-grid div, #task-input').forEach(el => {
      if (!el) return;
      // keep text black
      el.style.color = '#000000';
      // ensure input has white background for contrast
      if (el.id === 'task-input') {
        el.style.background = '#ffffff';
        el.style.color = '#000000';
        el.style.borderColor = 'rgba(0,0,0,0.08)';
      }
    });
  } catch (e) {
    // ignore if elements don't exist
  }

  // Apply inline styles to interactive controls so they immediately match theme
  // Skip controls inside the task area (task input row and task items)
  document.querySelectorAll('button, .btn, input[type="button"], input[type="submit"]').forEach(el => {
    if (isInTaskArea(el)) return;
    el.style.background = btnBg;
    el.style.color = btnText;
    el.style.border = btnText === '#ffffff' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)';
    el.style.cursor = 'pointer';
  });

  // Update selection state for theme options
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.id === themeId);
  });
}

function renderThemes() {
  const panel = document.getElementById('themes-panel');
  if (!panel) return;
  panel.innerHTML = '';

  themes.forEach(theme => {
    const wrapper = document.createElement('div');
    wrapper.className = 'theme-wrapper';

    const label = document.createElement('div');
    label.className = 'theme-label';
    label.innerHTML = unlockedThemes.includes(theme.id)
      ? `${theme.name}`
      : `${theme.name} <span class="lock-indicator">🔒 </span>`;

  const div = document.createElement('div');
  div.className = 'theme-option';
  // extend vertically so the option is easier to tap/click
  div.style.height = '44px';
  div.style.display = 'inline-flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  // extend horizontally so the option has a larger hit area
  div.style.width = '80px';
  div.style.minWidth = '80px';
  div.style.borderRadius = '8px';
  div.style.boxSizing = 'border-box';
  div.style.cursor = 'pointer';
    div.dataset.id = theme.id;
    div.dataset.tooltip = unlockedThemes.includes(theme.id)
      ? theme.name
      : `${theme.name} - Unlock for 20 points`;

    if (theme.id === 'light') {
      div.style.background = '#ffffff';
      div.style.border = '1px solid #ccc';
    } else {
      div.style.background = theme.colors.accent;
    }

    if (!unlockedThemes.includes(theme.id)) div.classList.add('locked');
    if (selectedTheme === theme.id) div.classList.add('selected');

    div.addEventListener('click', () => handleThemeClick(theme.id));

    wrapper.appendChild(label);
    wrapper.appendChild(div);
    panel.appendChild(wrapper);
  });
}



function handleThemeClick(themeId) {
  if (unlockedThemes.includes(themeId)) {
    applyTheme(themeId);
  } else if (points >= 20) {
    if (confirm(`Unlock ${themeId} theme for 20 points?`)) {
      points -= 20;
      unlockedThemes.push(themeId);
      renderThemes();
      applyTheme(themeId);
      updatePointsUI();
    }
  } else {
    alert("Not enough points!");
  }
}

function updatePointsDisplay() {
  const rewardInfo = document.querySelector('#rewards-panel .reward-info');
  if (rewardInfo) rewardInfo.textContent = `You have ${points} points.`;
}

// ========== EXP / LEVEL UI + LOGIC ==========
function addExp(amount) {
  if (!amount || amount <= 0) return;
  exp += amount;
  let leveled = false;
  while (exp >= 30) {
    exp -= 30;
    level += 1;
    leveled = true;
  }
  updateExpUI();
  if (leveled) {
    try { alert(`🎉 Level up! You reached level ${level}.`); } catch (e) { }
  }
}

function updateExpUI() {
  // Try to place the exp bar right after the points element in stats
  const pointsEl = document.getElementById('points');
  // If we can't find a stats location, fall back to inserting near the task grid
  const grid = document.getElementById('task-grid');

  let expContainer = document.getElementById('exp-container');
  if (!expContainer) {
    expContainer = document.createElement('div');
    expContainer.id = 'exp-container';
  expContainer.style.margin = '20px 0';
    expContainer.style.padding = '8px 10px';
    expContainer.style.borderRadius = '8px';
    expContainer.style.background = 'transparent';
  }

  // ensure it's placed under points if possible
  if (pointsEl) {
    pointsEl.insertAdjacentElement('afterend', expContainer);
  } else if (grid) {
    grid.insertAdjacentElement('beforebegin', expContainer);
  } else {
    // last resort: append to body
    document.body.appendChild(expContainer);
  }

  // build content
  expContainer.innerHTML = '';
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '6px';
  const title = document.createElement('div'); title.textContent = 'Experience'; title.style.fontWeight = '600';
  const lvl = document.createElement('div'); lvl.textContent = `Level ${level}`; lvl.style.fontSize = '0.95rem';
  header.appendChild(title); header.appendChild(lvl);

  const barWrap = document.createElement('div');
  barWrap.style.width = '100%';
  barWrap.style.background = 'rgba(0,0,0,0.06)';
  barWrap.style.borderRadius = '10px';
  barWrap.style.height = '12px';
  barWrap.style.overflow = 'hidden';

  const bar = document.createElement('div');
  const pct = Math.max(0, Math.min(100, Math.round((exp / 30) * 100)));
  bar.style.width = pct + '%';
  // use CSS variable for accent so the bar updates automatically with theme
  bar.style.background = 'var(--button-bg, #007bff)';
  bar.style.height = '100%';
  bar.style.transition = 'width 0.35s ease';
  barWrap.appendChild(bar);

  const footer = document.createElement('div');
  footer.style.display = 'flex'; footer.style.justifyContent = 'space-between'; footer.style.marginTop = '6px'; footer.style.fontSize = '0.85rem';
  const expText = document.createElement('div'); expText.textContent = `${exp} / 30 XP`;
  const pctText = document.createElement('div'); pctText.textContent = `${pct}%`;
  footer.appendChild(expText); footer.appendChild(pctText);

  expContainer.appendChild(header);
  expContainer.appendChild(barWrap);
  expContainer.appendChild(footer);

  // make EXP text inherit the theme text color (via CSS var) so it updates when the theme changes
  expContainer.style.color = 'var(--text-color, ' + (document.body.style.color || '#000') + ')';
}

// ========== INITIAL SETUP ==========
document.addEventListener('DOMContentLoaded', () => {
  setMode(25, "focus");
  updatePointsUI();
  updateBreakRewardInfo();
  updatePointsDisplay();
  renderThemes();
  applyTheme(selectedTheme);
  updateStatsUI(); // ✅ ensures stats section is ready on load
  try { updateExpUI(); } catch (e) { /* ignore */ }
});
