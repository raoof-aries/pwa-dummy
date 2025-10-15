// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered successfully:",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

// Install PWA Button
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "flex";
});

installBtn.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = "none";
  }
});

window.addEventListener("appinstalled", () => {
  console.log("PWA was installed");
  showToast("App installed successfully! 🎉");
});

// Connection Status
const connectionStatus = document.getElementById("connectionStatus");
const statusText = connectionStatus.querySelector(".status-text");

function updateConnectionStatus() {
  if (navigator.onLine) {
    connectionStatus.classList.remove("offline");
    statusText.textContent = "Online";
  } else {
    connectionStatus.classList.add("offline");
    statusText.textContent = "Offline";
  }
}

window.addEventListener("online", () => {
  updateConnectionStatus();
  showToast("Back online! 🌐");
});

window.addEventListener("offline", () => {
  updateConnectionStatus();
  showToast("You are offline. App will still work! 📱");
});

updateConnectionStatus();

// Task Manager
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.init();
  }

  init() {
    this.renderTasks();
    this.updateStats();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const taskForm = document.getElementById("taskForm");
    const clearCompletedBtn = document.getElementById("clearCompleted");

    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    clearCompletedBtn.addEventListener("click", () => {
      this.clearCompleted();
    });
  }

  loadTasks() {
    const stored = localStorage.getItem("tasks");
    return stored ? JSON.parse(stored) : [];
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (text) {
      const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      this.tasks.unshift(task);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      input.value = "";
      showToast("Task added successfully! ✨");
    }
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      showToast(task.completed ? "Task completed! 🎉" : "Task reopened");
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    showToast("Task deleted");
  }

  clearCompleted() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
      showToast("No completed tasks to clear");
      return;
    }
    this.tasks = this.tasks.filter((t) => !t.completed);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    showToast(
      `Cleared ${completedCount} completed task${completedCount > 1 ? "s" : ""}`
    );
  }

  renderTasks() {
    const tasksList = document.getElementById("tasksList");

    if (this.tasks.length === 0) {
      tasksList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>No tasks yet. Add one to get started!</p>
                </div>
            `;
      return;
    }

    tasksList.innerHTML = this.tasks
      .map(
        (task) => `
            <div class="task-item ${
              task.completed ? "completed" : ""
            }" data-id="${task.id}">
                <div class="task-checkbox ${
                  task.completed ? "checked" : ""
                }" onclick="taskManager.toggleTask(${task.id})"></div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <span class="task-time">${this.formatTime(
                  task.createdAt
                )}</span>
                <button class="delete-btn" onclick="taskManager.deleteTask(${
                  task.id
                })">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `
      )
      .join("");
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
  }

  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Initialize App
const taskManager = new TaskManager();
