let duration = 0;
let timeLeft = 0;
let timer = null;
let isRunning = false;
let sprints = 0;
let tasks = []; 

const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
  const offset = circumference - percent * circumference;
  circle.style.strokeDashoffset = offset;
}

function setMode(minutes) {
  resetTimer();
  duration = minutes * 60;
  timeLeft = duration;
  updateDisplay();
  setProgress(0);
}

function setTestMode() {
  resetTimer();
  duration = 5; // 5s test
  timeLeft = duration;
  updateDisplay();
  setProgress(0);
}

function startTimer() {
  if (isRunning || timeLeft <= 0) return;

  // Task checker
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
      sprints++;
      document.getElementById("sprint-count").textContent = sprints;

      alert("⏰ Time’s up! Check off any tasks you’ve completed.");
      renderTaskList();
      renderTaskGrid();
      updateAIStats(tasks, sprints);
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

// Distraction chu chu
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning) {
    alert("🚨 Stay focused! Your session isn’t over yet.");
  }
});

setMode(25);

// Task Handling
function addTask() {
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ text, status: "pending" });
  input.value = "";
  renderTaskList();
  renderTaskGrid();
}

function toggleTask(index) {
  tasks[index].status = tasks[index].status === "done" ? "pending" : "done";
  renderTaskList();
  renderTaskGrid();
  updateAIStats(tasks, sprints);
}

function renderTaskList() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  tasks.forEach((t, i) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.status === "done";
    checkbox.onchange = () => toggleTask(i);

    const label = document.createElement("span");
    label.textContent = " " + t.text;
    if (t.status === "done") label.style.textDecoration = "line-through";

    li.appendChild(checkbox);
    li.appendChild(label);
    list.appendChild(li);
  });
}

function renderTaskGrid() {
  const grid = document.getElementById("task-grid");
  grid.innerHTML = "";
  tasks.forEach(t => {
    const box = document.createElement("div");
    box.className = "task-box";
    box.style.width = "20px";
    box.style.height = "20px";
    box.style.margin = "2px";
    box.style.display = "inline-block";
    box.style.background = t.status === "done" ? "green" : "red";
    box.title = t.text;
    grid.appendChild(box);
  });
}

// Gemini Part
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=", 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const message =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "AI didn’t return anything.";

    document.getElementById("ai-stats").textContent = message;
  } catch (err) {
    console.error("AI request failed:", err);
    document.getElementById("ai-stats").textContent =
      "⚠️ Could not fetch AI stats.";
  }
}

