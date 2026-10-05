(() => {
  const STORAGE_KEY = "daywell.tasks.v1";
  const form = document.querySelector("#task-form");
  const input = document.querySelector("#task-input");
  const list = document.querySelector("#task-list");
  const emptyState = document.querySelector("#empty-state");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyCopy = document.querySelector("#empty-copy");
  const count = document.querySelector("#task-count");
  const progressLabel = document.querySelector("#progress-label");
  const progressBar = document.querySelector("#progress-bar");
  const announcer = document.querySelector("#announcer");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  let activeFilter = "all";
  let tasks = loadTasks();

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error("Saved tasks are not a list.");
      return parsed.filter((task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
      );
    } catch (error) {
      console.error("Unable to load saved tasks.", error);
      announce("Saved tasks could not be loaded. You can still add tasks for this session.");
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Unable to save tasks.", error);
      announce("Your change could not be saved on this device.");
      return false;
    }
  }

  function announce(message) {
    announcer.textContent = message;
  }

  function render() {
    const completedCount = tasks.filter((task) => task.completed).length;
    const visibleTasks = tasks.filter((task) =>
      activeFilter === "all" ||
      (activeFilter === "active" && !task.completed) ||
      (activeFilter === "completed" && task.completed)
    );

    count.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    progressBar.style.width = tasks.length ? `${(completedCount / tasks.length) * 100}%` : "0%";
    progressLabel.textContent = tasks.length
      ? completedCount === tasks.length ? "Everything checked off — lovely work!" : `${completedCount} of ${tasks.length} complete`
      : "A fresh start";
    list.replaceChildren(...visibleTasks.map(createTaskRow));
    emptyState.hidden = visibleTasks.length > 0;

    if (activeFilter === "active" && tasks.length && !visibleTasks.length) {
      emptyTitle.textContent = "Nothing left to do.";
      emptyCopy.textContent = "You’ve finished everything on your list.";
    } else if (activeFilter === "completed" && !visibleTasks.length && tasks.length) {
      emptyTitle.textContent = "Not yet, and that’s okay.";
      emptyCopy.textContent = "Completed tasks will show up here.";
    } else {
      emptyTitle.textContent = "A clear page feels good.";
      emptyCopy.textContent = "Add your first task above and take it from there.";
    }
  }

  function createTaskRow(task) {
    const row = document.createElement("li");
    row.className = `task-row${task.completed ? " is-completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Complete"}: ${task.text}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      render();
      announce(checkbox.checked ? `Completed: ${task.text}` : `Reopened: ${task.text}`);
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const removeButton = document.createElement("button");
    removeButton.className = "delete-button";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Delete: ${task.text}`);
    removeButton.title = "Delete task";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
      announce(`Deleted: ${task.text}`);
    });

    row.append(checkbox, text, removeButton);
    return row;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({ id: crypto.randomUUID(), text, completed: false });
    saveTasks();
    render();
    input.value = "";
    input.focus();
    announce(`Added: ${text}`);
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle("is-selected", selected);
        filter.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });

  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date()).toUpperCase();

  render();
})();
