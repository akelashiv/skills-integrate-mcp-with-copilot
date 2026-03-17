document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");

  const tasksList = document.getElementById("tasks-list");
  const taskForm = document.getElementById("task-form");
  const taskIdInput = document.getElementById("task-id");
  const titleInput = document.getElementById("task-title");
  const descriptionInput = document.getElementById("task-description");
  const dateInput = document.getElementById("task-date");
  const priorityInput = document.getElementById("task-priority");
  const statusInput = document.getElementById("task-status");
  const cancelTaskButton = document.getElementById("cancel-task");

  const messageDiv = document.getElementById("message");

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const card = document.createElement("div");
        card.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML = details.participants.length
          ? `<div class="participants-section"><h5>Participants:</h5><ul class="participants-list">${details.participants
              .map((email) =>
                `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
              )
              .join("")}</ul></div>`
          : "<p><em>No participants yet</em></p>";

        card.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">${participantsHTML}</div>
        `;
        activitiesList.appendChild(card);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (event) => {
          const activity = btn.dataset.activity;
          const email = btn.dataset.email;
          const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) showMessage(data.message, "success");
          else showMessage(data.detail || "Error unregistering", "error");
          fetchActivities();
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function fetchTasks() {
    try {
      const response = await fetch("/tasks");
      const taskArray = await response.json();
      tasksList.innerHTML = "";
      if (taskArray.length === 0) {
        tasksList.innerHTML = "<p>No tasks yet.</p>";
        return;
      }
      taskArray.forEach((task) => {
        const row = document.createElement("div");
        row.className = "task-card";
        row.innerHTML = `
          <div class="task-row">
            <div>
              <strong>${task.title}</strong> <em>(${task.priority}, ${task.status})</em><br/>
              ${task.description || "No description."}<br/>
              <small>${task.date_time || "No date set"}</small>
            </div>
            <div class="task-actions">
              <button class="edit-task" data-id="${task.id}">Edit</button>
              <button class="delete-task" data-id="${task.id}">Delete</button>
            </div>
          </div>
        `;
        tasksList.appendChild(row);
      });

      document.querySelectorAll(".edit-task").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;
          const res = await fetch(`/tasks/${id}`);
          if (!res.ok) {
            showMessage("Failed to load task.", "error");
            return;
          }
          const task = await res.json();
          taskIdInput.value = task.id;
          titleInput.value = task.title;
          descriptionInput.value = task.description || "";
          dateInput.value = task.date_time || "";
          priorityInput.value = task.priority || "medium";
          statusInput.value = task.status || "todo";
        });
      });

      document.querySelectorAll(".delete-task").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;
          const res = await fetch(`/tasks/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok) {
            showMessage(data.message, "success");
            fetchTasks();
          } else {
            showMessage(data.detail || "Failed to delete task", "error");
          }
        });
      });
    } catch (error) {
      tasksList.innerHTML = "<p>Unable to load tasks.</p>";
      console.error("Error fetching tasks:", error);
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    setTimeout(() => {
      messageDiv.className = "hidden";
    }, 3000);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = activitySelect.value;
    const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      showMessage(data.message, "success");
      signupForm.reset();
      fetchActivities();
    } else {
      showMessage(data.detail || "Failed to sign up.", "error");
    }
  });

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = taskIdInput.value;
    const payload = {
      title: titleInput.value,
      description: descriptionInput.value,
      date_time: dateInput.value,
      priority: priorityInput.value,
      status: statusInput.value,
    };
    let res;
    if (id) {
      res = await fetch(`/tasks/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    const data = await res.json();
    if (res.ok) {
      showMessage(id ? "Task updated." : "Task created.", "success");
      taskForm.reset();
      taskIdInput.value = "";
      fetchTasks();
    } else {
      showMessage(data.detail || "Task save failed.", "error");
    }
  });

  cancelTaskButton.addEventListener("click", () => {
    taskForm.reset();
    taskIdInput.value = "";
  });

  fetchActivities();
  fetchTasks();
});
