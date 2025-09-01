let duration = 0;
let timeLeft = 0;
let timer = null;
let isRunning = false;

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
  duration = 5;
  timeLeft = duration;
  updateDisplay();
  setProgress(0);
}

function startTimer() {
  if (isRunning || timeLeft <= 0) return;
  isRunning = true;
  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    setProgress((duration - timeLeft) / duration);
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;

      const task = document.getElementById("task-input").value.trim();
      if (task) {
        alert(`⏰ Time’s up! Great job focusing on:\n\n${task}`);
      } else {
        alert("⏰ Time’s up! Great job!");
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

// Distraction alert
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning) {
    alert("🚨 Stay focused! Your session isn’t over yet.");
  }
});

// Default mode
setMode(25);
