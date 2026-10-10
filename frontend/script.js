const API_URL = "/api/opportunities";
const form = document.getElementById("opportunity-form");
const messageArea = document.getElementById("message-area");
const listContainer = document.getElementById("opportunities-list");
const detailCard = document.getElementById("detail-card");
let messageTimeout;
let selectedOpportunityId = null;

window.addEventListener("DOMContentLoaded", loadAllOpportunities);

async function apiRequest(url, options) {
  const response = await fetch(url, options);
  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }

  if (!response.ok) {
    const details = Array.isArray(result.errors) ? ` ${result.errors.join(" ")}` : "";
    throw new Error((result.message || `Request failed (${response.status}).`) + details);
  }

  return result;
}

async function loadAllOpportunities() {
  listContainer.textContent = "Loading opportunities...";

  try {
    const opportunities = await apiRequest(API_URL);
    displayOpportunities(opportunities);
  } catch (error) {
    listContainer.textContent = "";
    showMessage(error.message, "danger");
  }
}

function displayOpportunities(opportunities) {
  listContainer.textContent = "";

  if (opportunities.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "text-muted";
    emptyMessage.textContent = "No research opportunities available yet.";
    listContainer.append(emptyMessage);
    return;
  }

  opportunities.forEach(function (opportunity) {
    const item = document.createElement("article");
    item.className = "opportunity-item";

    const heading = document.createElement("div");
    heading.className = "opportunity-heading";

    const title = document.createElement("h3");
    title.textContent = opportunity.title;
    heading.append(title, createStatusBadge(opportunity.status));
    item.append(heading);

    const summary = document.createElement("p");
    summary.className = "text-muted";
    summary.textContent = `${opportunity.research_area} · ${opportunity.department} · ${opportunity.faculty_name}`;
    item.append(summary);

    const details = document.createElement("p");
    details.className = "opportunity-meta";
    details.textContent = `${opportunity.positions} position(s) · Deadline: ${formatDate(opportunity.deadline)}`;
    item.append(details);

    const actions = document.createElement("div");
    actions.className = "opportunity-actions";
    actions.append(
      createButton("View details", "btn btn-sm btn-info", () => viewDetails(opportunity.id)),
      createButton("Edit", "btn btn-sm btn-warning", () => editOpportunity(opportunity.id)),
    );

    if (opportunity.status === "Open") {
      actions.append(createButton("Close", "btn btn-sm btn-secondary", () => closeOpportunity(opportunity.id)));
    }

    actions.append(createButton("Delete", "btn btn-sm btn-danger", () => deleteOpportunity(opportunity.id)));
    item.append(actions);
    listContainer.append(item);
  });
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = status === "Open" ? "badge-open" : "badge-closed";
  badge.textContent = status;
  return badge;
}

async function viewDetails(id) {
  try {
    const opportunity = await apiRequest(`${API_URL}/${id}`);
    const table = document.createElement("table");
    table.className = "table";

    [
      ["ID", opportunity.id],
      ["Title", opportunity.title],
      ["Description", opportunity.description],
      ["Research area", opportunity.research_area],
      ["Faculty member", opportunity.faculty_name],
      ["Department", opportunity.department],
      ["Required skills", opportunity.required_skills],
      ["Positions", opportunity.positions],
      ["Application deadline", formatDate(opportunity.deadline)],
    ].forEach(function ([label, value]) {
      const row = table.insertRow();
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = label;
      const cell = row.insertCell();
      cell.textContent = value;
    });

    const statusRow = table.insertRow();
    const statusHeading = document.createElement("th");
    statusHeading.scope = "row";
    statusHeading.textContent = "Status";
    statusRow.append(statusHeading);
    const statusCell = statusRow.insertCell();
    statusCell.append(createStatusBadge(opportunity.status));

    const content = document.getElementById("detail-content");
    content.replaceChildren(table);
    selectedOpportunityId = opportunity.id;
    detailCard.hidden = false;
    detailCard.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const id = document.getElementById("opportunity-id").value;
  const positions = Number(document.getElementById("positions").value);
  if (!Number.isInteger(positions) || positions < 1) {
    showMessage("Number of positions must be a positive whole number.", "danger");
    return;
  }

  const data = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    research_area: document.getElementById("research_area").value.trim(),
    faculty_name: document.getElementById("faculty_name").value.trim(),
    department: document.getElementById("department").value.trim(),
    required_skills: document.getElementById("required_skills").value.trim(),
    positions,
    deadline: document.getElementById("deadline").value,
    status: id ? document.getElementById("status").value : "Open",
  };

  try {
    const result = await apiRequest(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    showMessage(result.message, "success");
    resetForm();
    await loadAllOpportunities();
  } catch (error) {
    showMessage(error.message, "danger");
  }
});

async function editOpportunity(id) {
  try {
    const opportunity = await apiRequest(`${API_URL}/${id}`);
    document.getElementById("opportunity-id").value = opportunity.id;

    for (const field of [
      "title",
      "description",
      "research_area",
      "faculty_name",
      "department",
      "required_skills",
      "positions",
      "status",
    ]) {
      document.getElementById(field).value = opportunity[field];
    }

    document.getElementById("deadline").value = dateInputValue(opportunity.deadline);
    document.getElementById("form-title").textContent = `Update Research Opportunity (ID: ${opportunity.id})`;
    document.getElementById("submit-btn").textContent = "Save changes";
    document.getElementById("cancel-btn").hidden = false;
    document.getElementById("status-group").hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function closeOpportunity(id) {
  if (!window.confirm("Are you sure you want to close this opportunity?")) {
    return;
  }

  try {
    const opportunity = await apiRequest(`${API_URL}/${id}`);
    opportunity.status = "Closed";
    opportunity.deadline = dateInputValue(opportunity.deadline);
    const result = await apiRequest(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opportunity),
    });
    showMessage(result.message, "success");
    await loadAllOpportunities();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

async function deleteOpportunity(id) {
  if (!window.confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
    return;
  }

  try {
    const result = await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });
    showMessage(result.message, "success");
    if (selectedOpportunityId === Number(id)) {
      detailCard.hidden = true;
      selectedOpportunityId = null;
    }
    await loadAllOpportunities();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

function resetForm() {
  form.reset();
  document.getElementById("opportunity-id").value = "";
  document.getElementById("form-title").textContent = "Create New Research Opportunity";
  document.getElementById("submit-btn").textContent = "Create Opportunity";
  document.getElementById("cancel-btn").hidden = true;
  document.getElementById("status-group").hidden = true;
  document.getElementById("status").value = "Open";
}

function cancelEdit() {
  resetForm();
  showMessage("Editing cancelled.", "info");
}

function showMessage(message, type) {
  window.clearTimeout(messageTimeout);
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.setAttribute("role", type === "danger" ? "alert" : "status");
  alert.textContent = message;

  const closeButton = createButton("Dismiss", "btn-close", () => messageArea.replaceChildren());
  closeButton.textContent = "";
  closeButton.setAttribute("aria-label", "Dismiss message");
  alert.append(closeButton);
  messageArea.replaceChildren(alert);
  window.scrollTo({ top: 0, behavior: "smooth" });
  messageTimeout = window.setTimeout(() => messageArea.replaceChildren(), 6000);
}

function dateInputValue(value) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  const [year, month, day] = dateInputValue(value).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}
