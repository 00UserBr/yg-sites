const STORAGE_KEY = "ygsites-catalog-v1";

const form = document.getElementById("project-form");
const idInput = document.getElementById("project-id");
const nameInput = document.getElementById("project-name");
const descInput = document.getElementById("project-desc");
const tagsInput = document.getElementById("project-tags");
const linkInput = document.getElementById("project-link");
const coverInput = document.getElementById("project-cover");
const listEl = document.getElementById("admin-list");
const formTitle = document.getElementById("form-title");
const submitLabel = document.getElementById("submit-label");
const resetFormBtn = document.getElementById("reset-form");
const cancelEditBtn = document.getElementById("cancel-edit");
const exportBtn = document.getElementById("export-json");
const importTrigger = document.getElementById("import-json-trigger");
const importInput = document.getElementById("import-json");
const clearAllBtn = document.getElementById("clear-all");

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(error);
    return [];
  }
}

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function renderList() {
  const projects = loadProjects();
  listEl.innerHTML = "";

  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "admin-empty";
    empty.innerHTML = "<p>Nenhum projeto cadastrado ainda. Adicione o primeiro acima.</p>";
    listEl.appendChild(empty);
    return;
  }

  projects.forEach((project) => {
    const item = document.createElement("article");
    item.className = "admin-item";
    const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean).join(" • ") : "";
    item.innerHTML = `
      <span class="admin-item__dot"></span>
      <div class="admin-item__info">
        <strong class="admin-item__title">${escapeHtml(project.name)}</strong>
        <p class="admin-item__meta">${tags ? tags + " • " : ""}${project.link ? "Possui link" : "Sem link"}</p>
      </div>
      <div class="admin-item__actions">
        <button class="icon-btn" data-action="edit" data-id="${project.id}" aria-label="Editar">
          <i class="ri-pencil-line"></i>
        </button>
        <button class="icon-btn" data-action="remove" data-id="${project.id}" aria-label="Remover">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;
    listEl.appendChild(item);
  });
}

function resetForm() {
  form.reset();
  idInput.value = "";
  formTitle.textContent = "Adicionar novo projeto";
  submitLabel.textContent = "Salvar projeto";
  cancelEditBtn.hidden = true;
}

function fillForm(project) {
  idInput.value = project.id;
  nameInput.value = project.name || "";
  descInput.value = project.description || "";
  tagsInput.value = Array.isArray(project.tags) ? project.tags.join(", ") : "";
  linkInput.value = project.link || "";
  coverInput.value = project.cover || "";
  formTitle.textContent = "Editando projeto";
  submitLabel.textContent = "Atualizar projeto";
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const projects = loadProjects();
  const tags = tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (idInput.value) {
    const index = projects.findIndex((project) => project.id === idInput.value);
    if (index >= 0) {
      projects[index] = {
        ...projects[index],
        name: nameInput.value.trim(),
        description: descInput.value.trim(),
        tags,
        link: linkInput.value.trim(),
        cover: coverInput.value.trim()
      };
      saveProjects(projects);
      resetForm();
      renderList();
      return;
    }
  }

  const newProject = {
    id: "yg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    name: nameInput.value.trim(),
    description: descInput.value.trim(),
    tags,
    link: linkInput.value.trim(),
    cover: coverInput.value.trim(),
    createdAt: Date.now()
  };

  projects.unshift(newProject);
  saveProjects(projects);
  resetForm();
  renderList();
});

listEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const projects = loadProjects();
  const id = button.dataset.id;

  if (button.dataset.action === "edit") {
    const project = projects.find((item) => item.id === id);
    if (project) fillForm(project);
    return;
  }

  if (button.dataset.action === "remove") {
    const confirmed = confirm("Remover este projeto do catálogo?");
    if (!confirmed) return;
    const filtered = projects.filter((item) => item.id !== id);
    saveProjects(filtered);
    resetForm();
    renderList();
  }
});

resetFormBtn.addEventListener("click", resetForm);
cancelEditBtn.addEventListener("click", resetForm);

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("Isso vai apagar TODO o catálogo deste navegador. Tem certeza?");
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEY);
  resetForm();
  renderList();
});

exportBtn.addEventListener("click", () => {
  const projects = loadProjects();
  const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "yg-sites-catalogo.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

importTrigger.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido");
    saveProjects(parsed);
    resetForm();
    renderList();
    alert("Catálogo importado com sucesso!");
  } catch (error) {
    alert("Não foi possível importar. Verifique se é um JSON válido exportado pelo painel.");
  } finally {
    importInput.value = "";
  }
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", renderList);
