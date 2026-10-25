const REPO = process.env.DATA_REPO || "00UserBr/yg-sites-data";
const FILE = "catalog.json";
const IMAGE_DIR = "images";

const IMAGE_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif"
};

function imageType(name) {
  const ext = String(name).split(".").pop().toLowerCase();
  return IMAGE_TYPES[ext] || "application/octet-stream";
}

function token() {
  return String(process.env.GITHUB_TOKEN || "").trim();
}

async function gh(path, init = {}) {
  const res = await fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "yg-sites-catalog",
      ...(init.headers || {})
    }
  });
  return res;
}

async function read() {
  const res = await gh(`/repos/${REPO}/contents/${FILE}`);
  if (res.status === 404) return { items: [], sha: null, updatedAt: null };
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`github_read_${res.status}: ${detail.slice(0, 160)}`);
  }
  const data = await res.json();
  const text = Buffer.from(data.content || "", "base64").toString("utf8");
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    parsed = {};
  }
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    sha: data.sha,
    updatedAt: parsed.updatedAt || null
  };
}

async function write(items) {
  const payload = JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2);

  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await read();
    const body = {
      message: `catalogo: ${items.length} projeto(s)`,
      content: Buffer.from(payload, "utf8").toString("base64"),
      committer: { name: "YG Sites", email: "contato@ygsites.local" }
    };
    if (current.sha) body.sha = current.sha;

    const res = await gh(`/repos/${REPO}/contents/${FILE}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    if (res.ok) return JSON.parse(payload);
    if (res.status === 409 && attempt === 0) continue;

    const detail = await res.text();
    throw new Error(`github_write_${res.status}: ${detail.slice(0, 160)}`);
  }

  throw new Error("github_write_conflict");
}

async function readImage(name) {
  const res = await gh(`/repos/${REPO}/contents/${IMAGE_DIR}/${name}`, {
    headers: { Accept: "application/vnd.github.raw+json" }
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`github_image_read_${res.status}: ${detail.slice(0, 160)}`);
  }

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: imageType(name)
  };
}

async function imageExists(name) {
  const res = await gh(`/repos/${REPO}/contents/${IMAGE_DIR}/${name}`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  throw new Error(`github_image_head_${res.status}`);
}

async function writeImage(name, base64) {
  const body = {
    message: `imagem: ${name}`,
    content: base64,
    committer: { name: "YG Sites", email: "contato@ygsites.local" }
  };

  const res = await gh(`/repos/${REPO}/contents/${IMAGE_DIR}/${name}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });

  // 422 = o mesmo arquivo já existe (o nome é o hash do conteúdo).
  if (res.ok || res.status === 422) return;

  const detail = await res.text();
  throw new Error(`github_image_write_${res.status}: ${detail.slice(0, 160)}`);
}

module.exports = { read, write, readImage, imageExists, writeImage, imageType };
