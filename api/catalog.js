const { verify, bearer } = require("../lib/auth");
const store = require("../lib/store");

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function sanitize(items) {
  if (!Array.isArray(items)) return null;

  return items
    .slice(0, 60)
    .map((item, index) => {
      const raw = item && typeof item === "object" ? item : {};
      return {
        id: clean(raw.id, 64) || `yg-${Date.now().toString(36)}-${index}`,
        name: clean(raw.name, 120),
        description: clean(raw.description, 700),
        tags: Array.isArray(raw.tags)
          ? raw.tags.slice(0, 8).map((tag) => clean(tag, 32)).filter(Boolean)
          : [],
        link: clean(raw.link, 500),
        cover: clean(raw.cover, 500),
        createdAt: Number(raw.createdAt) || Date.now()
      };
    })
    .filter((item) => item.name);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const data = await store.read();
      res.status(200).json({ items: data.items, updatedAt: data.updatedAt });
    } catch (error) {
      console.error(error);
      res.status(503).json({ error: "storage_unavailable" });
    }
    return;
  }

  if (req.method === "PUT") {
    if (!verify(bearer(req))) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (error) {
        body = null;
      }
    }

    const items = sanitize(body?.items);
    if (!items) {
      res.status(400).json({ error: "invalid_items" });
      return;
    }

    try {
      const saved = await store.write(items);
      res.status(200).json({ items: saved.items, updatedAt: saved.updatedAt });
    } catch (error) {
      console.error(error);
      res.status(503).json({ error: "storage_unavailable" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
};
