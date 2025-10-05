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
  document.documentElement.style.setProperty('--accent', theme.colors.accent);
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
    label.textContent = theme.name;

    const div = document.createElement('div');
    div.className = 'theme-option';
    div.dataset.id = theme.id;
    div.dataset.tooltip = unlockedThemes.includes(theme.id)
      ? theme.name
      : `${theme.name} - Unlock for 20 points`;

    // 🎨 Special case for Light theme preview
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

// ========== INITIAL SETUP ==========
document.addEventListener('DOMContentLoaded', () => {
  setMode(25, "focus");
  updatePointsUI();
  updateBreakRewardInfo();
  updatePointsDisplay();
  renderThemes();
  applyTheme(selectedTheme);
  updateStatsUI(); // ✅ ensures stats section is ready on load
});
