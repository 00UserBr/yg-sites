const STORAGE_KEY = "ygsites-catalog-v1";
const TOKEN_KEY = "ygsites-admin-token";

/* ---------- Referências ---------- */

const authGate = document.getElementById("auth-gate");
const authForm = document.getElementById("auth-form");
const authInput = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authToggle = document.getElementById("auth-toggle");
const authSubmit = document.getElementById("auth-submit");
const adminApp = document.getElementById("admin-app");
const logoutBtn = document.getElementById("logout");
const syncStatus = document.getElementById("sync-status");

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

/* ---------- Estado ---------- */

let catalog = [];
let authToken = sessionStorage.getItem(TOKEN_KEY) || "";

/* ---------- Sincronização com o servidor ---------- */

class UnauthorizedError extends Error {}

function setSync(message, kind = "ok") {
  if (!syncStatus) return;
  if (!message) {
    syncStatus.hidden = true;
    syncStatus.textContent = "";
    return;
  }
  syncStatus.hidden = false;
  syncStatus.textContent = message;
  syncStatus.dataset.kind = kind;
}

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeCache(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("cache", error);
  }
}

async function apiLogin(password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (res.status === 429) throw new Error("Muitas tentativas. Aguarde alguns minutos.");
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.token) return null;

  authToken = data.token;
  sessionStorage.setItem(TOKEN_KEY, authToken);
  return data;
}

async function apiRead() {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

async function apiSave(items) {
  const res = await fetch("/api/catalog", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + authToken
    },
    body: JSON.stringify({ items })
  });

  if (res.status === 401) throw new UnauthorizedError("Sessão expirada");
  if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : items;
}

async function persist(items, successMessage = "Alterações publicadas no site") {
  setSync("Salvando...", "busy");
  try {
    const saved = await apiSave(items);
    catalog = saved;
    writeCache(saved);
    renderList();
    setSync(successMessage, "ok");
    return true;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      lock("Sua sessão expirou. Entre novamente com a senha.");
      return false;
    }
    console.error(error);
    setSync("Falha ao salvar. Tente novamente.", "error");
    return false;
  }
}

async function hydrate() {
  try {
    catalog = await apiRead();
    writeCache(catalog);
    renderList();
    setSync("Catálogo sincronizado", "ok");
  } catch (error) {
    catalog = readCache();
    renderList();
    setSync("Sem conexão — exibindo cópia local", "warn");
  }
}

/* ---------- Proteção por senha ---------- */

function unlock() {
  adminApp.hidden = false;
  authGate.hidden = true;
  document.body.classList.remove("is-locked");
}

function lock(message = "") {
  adminApp.hidden = true;
  authGate.hidden = false;
  document.body.classList.add("is-locked");
  sessionStorage.removeItem(TOKEN_KEY);
  authToken = "";
  authInput.value = "";
  authInput.type = "password";
  authError.textContent = message || "Senha incorreta. Tente novamente.";
  authError.hidden = !message;
  authInput.focus();
}

if (authToken) {
  unlock();
  hydrate();
} else {
  authInput.focus();
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = authInput.value.trim();
  if (!value) {
    authInput.focus();
    return;
  }

  const label = authSubmit.querySelector("span");
  authSubmit.disabled = true;
  label.textContent = "Verificando...";

  try {
    const session = await apiLogin(value);
    if (session) {
      authError.hidden = true;
      authInput.value = "";
      unlock();
      await hydrate();
      return;
    }
    authError.textContent = "Senha incorreta. Tente novamente.";
  } catch (error) {
    authError.textContent = error.message || "Não foi possível conectar. Tente novamente.";
  } finally {
    authSubmit.disabled = false;
    label.textContent = "Entrar no painel";
  }

  authError.hidden = false;
  authInput.value = "";
  authGate.classList.remove("is-shaking");
  void authGate.offsetWidth;
  authGate.classList.add("is-shaking");
  authInput.focus();
});

authGate.addEventListener("animationend", () => {
  authGate.classList.remove("is-shaking");
});

authToggle.addEventListener("click", () => {
  const hidden = authInput.type === "password";
  authInput.type = hidden ? "text" : "password";
  authToggle.querySelector("i").className = hidden ? "ri-eye-off-line" : "ri-eye-line";
  authToggle.setAttribute("aria-label", hidden ? "Ocultar senha" : "Mostrar senha");
  authInput.focus();
});

logoutBtn.addEventListener("click", () => {
  lock("");
  authError.hidden = true;
  setSync("");
});

/* ---------- Catálogo ---------- */

function renderList() {
  listEl.innerHTML = "";

  if (!catalog.length) {
    const empty = document.createElement("div");
    empty.className = "admin-empty";
    empty.innerHTML = "<p>Nenhum projeto cadastrado ainda. Adicione o primeiro acima.</p>";
    listEl.appendChild(empty);
    return;
  }

  catalog.forEach((project) => {
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
        <button class="icon-btn" data-action="edit" data-id="${escapeHtml(project.id)}" aria-label="Editar">
          <i class="ri-pencil-line"></i>
        </button>
        <button class="icon-btn" data-action="remove" data-id="${escapeHtml(project.id)}" aria-label="Remover">
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const tags = tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const next = catalog.slice();
  const fields = {
    name: nameInput.value.trim(),
    description: descInput.value.trim(),
    tags,
    link: linkInput.value.trim(),
    cover: coverInput.value.trim()
  };

  const editIndex = next.findIndex((project) => project.id === idInput.value);

  if (editIndex >= 0) {
    next[editIndex] = { ...next[editIndex], ...fields };
  } else {
    next.unshift({
      id: "yg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      ...fields,
      createdAt: Date.now()
    });
  }

  const ok = await persist(next);
  if (ok) resetForm();
});

listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  if (button.dataset.action === "edit") {
    const project = catalog.find((item) => item.id === id);
    if (project) fillForm(project);
    return;
  }

  if (button.dataset.action === "remove") {
    if (!confirm("Remover este projeto do catálogo? Ele sai do site na hora.")) return;
    await persist(catalog.filter((item) => item.id !== id), "Projeto removido do site");
    resetForm();
  }
});

resetFormBtn.addEventListener("click", resetForm);
cancelEditBtn.addEventListener("click", resetForm);

clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Isso vai apagar TODO o catálogo do site. Tem certeza?")) return;
  const ok = await persist([], "Catálogo esvaziado");
  if (ok) resetForm();
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
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

    const ok = await persist(parsed, "Catálogo importado e publicado");
    if (ok) {
      resetForm();
      alert("Catálogo importado com sucesso!");
    }
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
