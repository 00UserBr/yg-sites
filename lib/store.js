const REPO = process.env.DATA_REPO || "00UserBr/yg-sites-data";
const FILE = "catalog.json";

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

module.exports = { read, write };
