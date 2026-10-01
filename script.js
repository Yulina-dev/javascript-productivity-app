const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll(".filter");
const remainingLabel = document.querySelector("#remaining");
const sideCount = document.querySelector("#side-count");
let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem("daylight-tasks")) ?? [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem("daylight-tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-row${task.done ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.done ? "to do" : "completed"}`);
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.text;

    const date = document.createElement("span");
    date.className = "task-date";
    date.textContent = task.date;

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.text}`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, name, date, remove);
    taskList.append(item);
  });

  const openCount = tasks.filter((task) => !task.done).length;
  remainingLabel.textContent = openCount;
  sideCount.textContent = openCount;
  emptyState.classList.toggle("show", visibleTasks.length === 0);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, done: false, date: new Date().toLocaleDateString() });
  saveTasks();
  taskInput.value = "";
  currentFilter = "all";
  filterButtons.forEach((button) => button.classList.toggle("active", button.dataset.filter === "all"));
  renderTasks();
  taskInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderTasks();
  });
});

document.querySelector("#clear-done").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

// Simple calculator state: current number, stored number, and pending operation.
let current = "0";
let stored = null;
let operation = null;
let shouldStartNew = false;
const display = document.querySelector("#display");
const calculation = document.querySelector("#calculation");

function updateDisplay() {
  display.textContent = current;
}

function calculate(left, right, op) {
  if (op === "+") return left + right;
  if (op === "−") return left - right;
  if (op === "×") return left * right;
  if (op === "÷") return right === 0 ? null : left / right;
  return right;
}

function formatResult(value) {
  if (value === null || !Number.isFinite(value)) return "Error";
  return String(Number(value.toPrecision(10)));
}

document.querySelector(".keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit !== undefined) {
    if (shouldStartNew || current === "0" || current === "Error") current = button.dataset.digit;
    else current += button.dataset.digit;
    shouldStartNew = false;
    calculation.textContent = operation ? `${stored} ${operation}` : "Ready";
    updateDisplay();
    return;
  }

  const action = button.dataset.action;
  if (action === "clear") {
    current = "0"; stored = null; operation = null; shouldStartNew = false;
    calculation.textContent = "Ready"; updateDisplay(); return;
  }
  if (action === "decimal") {
    if (shouldStartNew || current === "Error") current = "0";
    if (!current.includes(".")) current += ".";
    shouldStartNew = false; updateDisplay(); return;
  }
  if (action === "sign") {
    if (current !== "0" && current !== "Error") current = current.startsWith("-") ? current.slice(1) : `-${current}`;
    updateDisplay(); return;
  }
  if (action === "percent") {
    if (current !== "Error") current = formatResult(Number(current) / 100);
    updateDisplay(); return;
  }
  if (button.dataset.op) {
    if (operation && !shouldStartNew) {
      current = formatResult(calculate(stored, Number(current), operation));
      updateDisplay();
    }
    stored = Number(current);
    operation = button.dataset.op;
    shouldStartNew = true;
    calculation.textContent = `${stored} ${operation}`;
    return;
  }
  if (action === "equals" && operation) {
    const left = stored;
    const right = Number(current);
    const result = formatResult(calculate(left, right, operation));
    calculation.textContent = `${left} ${operation} ${right} =`;
    current = result;
    stored = null;
    operation = null;
    shouldStartNew = true;
    updateDisplay();
  }
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${button.dataset.tab}-panel`));
  });
});

document.querySelector("#today").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date());
renderTasks();
updateDisplay();
