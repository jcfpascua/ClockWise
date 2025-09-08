// Dark mode
document.getElementById("dark-mode-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  document.getElementById("dark-mode-toggle").textContent = icon;
});

// Timer
let duration = 0;
let timeLeft = 0;
let timer = null;
let isRunning = false;
let sprints = 0;
let tasks = [];
let mode = "focus"; // track focus/break/test

// const API_KEY = "AIzaSyBRL4I7DCQeztQ9nVGfoGuoWmdwp6sbcY8";

const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  const offset = circumference - percent * circumference;
  circle.style.strokeDashoffset = offset;
}

function setMode(minutes, newMode = "focus") {
  resetTimer();
  duration = minutes * 60;
  timeLeft = duration;
  mode = newMode;
  updateDisplay();
  setProgress(0);
}

function setTestMode() {
  resetTimer();
  duration = 5; // 5s test
  timeLeft = duration;
  mode = "test";
  updateDisplay();
  setProgress(0);
  startTimer();
}

function startTimer() {
  if (isRunning || timeLeft <= 0) return;

  if (tasks.length === 0) {
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
        sprints++;
        alert("⏰ Time’s up! Check your tasks.");
        updateStatsUI();
        updateAIStats(tasks, sprints);
      } else if (mode === "break") {
        alert("☕ Break’s over! Back to work!");
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

// Task chuchu
async function addTask() {
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ text, status: "pending" });
  input.value = "";
  updateTaskList();
  updateStatsUI();
  await updateAIStats(tasks, sprints);
}

async function toggleTask(index) {
  tasks[index].status = tasks[index].status === "done" ? "pending" : "done";
  updateTaskList();
  updateStatsUI();
  await updateAIStats(tasks, sprints);
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

// Stats
function updateStatsUI() {
  document.getElementById("sprint-count").textContent = sprints;
  const grid = document.getElementById("task-grid");
  grid.innerHTML = "";

  const isDark = document.body.classList.contains("dark");

  tasks.forEach(t => {
    const div = document.createElement("div");
    div.textContent = `${t.text} - ${t.status}`;
    
    // Background color
    div.style.background = t.status === "done" ? "#d4edda" : "#f8d7da";

    // Font color
    if (isDark) {
      div.style.color = t.status === "done" ? "#155724" : "#721c24"; // darker green/red for dark mode
    } else {
      div.style.color = t.status === "done" ? "#155724" : "#721c24"; // same for light mode
    }

    div.style.padding = "5px 10px";
    div.style.borderRadius = "5px";
    div.style.marginBottom = "5px";

    grid.appendChild(div);
  });
}


// Settings
function startFocusTimer() {
  const minutes = parseInt(document.getElementById("focus-time").value) || 25;
  if (minutes <= 1) minutes = 1;
  setMode(minutes, "focus");
  startTimer();
}

function startBreakTimer() {
  const minutes = parseInt(document.getElementById("break-time").value) || 5;
  if (minutes <= 1) minutes = 1;
  setMode(minutes, "break");
  startTimer();
}

// Distraction alert
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning && mode === "focus") {
    alert("🚨 Stay focused! Your session isn’t over yet.");
  }
});

// AI
async function updateAIStats(tasks, sprints) {
  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;

  const prompt = `
You are a helpful assistant analyzing productivity.
Stats:
- Finished tasks: ${done}
- Total tasks: ${total}
- Sprints completed: ${sprints}

Give a short motivational summary in under 2 sentences.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    console.log("AI raw response:", data);

    let message = "AI didn’t return anything.";
    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content?.parts || [];
      message = parts.map(p => p.text).join(" ") || message;
    }

    document.getElementById("ai-stats").textContent = message;
  } catch (err) {
    console.error("AI request failed:", err);
    document.getElementById("ai-stats").textContent =
      "⚠️ Could not fetch AI stats.";
  }
}

// initial setup
setMode(25, "focus");
