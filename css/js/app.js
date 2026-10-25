const STORAGE_KEY = "ygsites-catalog-v1";

const defaultProjects = [
  {
    id: "demo-1",
    name: "Studio Minimalista",
    description: "Site autoral com tipografia forte, hierarquia clara e foco em transmitir credibilidade para estúdios criativos.",
    tags: ["Autorais", "Responsivo", "Conversão"],
    link: "",
    cover: ""
  },
  {
    id: "demo-2",
    name: "Clínica Premium",
    description: "Layout limpo em azul e branco, pensado para passar segurança, gerar confiança e facilitar o agendamento.",
    tags: ["Saúde", "Autorais", "Mobile First"],
    link: "",
    cover: ""
  },
  {
    id: "demo-3",
    name: "Imobiliária Urbana",
    description: "Foco em autoridade, com seções estratégicas para guiar o lead e transmitir solidez em cada detalhe.",
    tags: ["Autorais", "Performance", "Conversão"],
    link: "",
    cover: ""
  }
];

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProjects;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultProjects;
  } catch (error) {
    console.warn("Não foi possível carregar o catálogo", error);
    return defaultProjects;
  }
}

function renderPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;
  const projects = loadProjects();
  grid.innerHTML = "";

  if (!projects.length) {
    const empty = document.createElement("article");
    empty.className = "portfolio-empty";
    empty.innerHTML = `
      <h3>Catálogo vazio</h3>
      <p>Abra o <a href="admin.html" style="color: var(--text-primary); text-decoration: underline;">painel</a> e adicione seu primeiro site para vender.</p>
    `;
    grid.appendChild(empty);
    return;
  }

  projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = index === 0 ? "portfolio-card portfolio-card--wide" : "portfolio-card";
    const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];
    card.innerHTML = `
      <div class="portfolio-card__media">
        <div class="noise-overlay"></div>
      </div>
      <div class="portfolio-card__content">
        <div class="portfolio-card__top">
          <h3 class="portfolio-card__title">${escapeHtml(project.name)}</h3>
          <div class="portfolio-card__tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
        <p class="portfolio-card__desc">${escapeHtml(project.description)}</p>
        <div class="portfolio-card__actions">
          <span class="btn btn--ghost">
            <i class="ri-shield-check-line"></i>
            <span>Projeto autoral • Transmite confiança</span>
          </span>
          ${project.link ? `<a class="btn btn--primary" href="${escapeAttribute(project.link)}" target="_blank" rel="noopener"><span>Ver projeto</span><i class="ri-arrow-right-line"></i></a>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/javascript:/gi, "");
}

function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  renderPortfolio();
});
