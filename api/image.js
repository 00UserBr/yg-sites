const store = require("../lib/store");

const NAME_PATTERN = /^[a-f0-9]{16,64}\.(jpg|jpeg|png|webp|gif)$/;

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const name = String(url.searchParams.get("name") || "").toLowerCase();

  if (!NAME_PATTERN.test(name)) {
    res.status(400).json({ error: "invalid_name" });
    return;
  }

  try {
    const file = await store.readImage(name);

    if (!file) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    // O nome é o hash do conteúdo: nunca muda, então pode ficar em cache para sempre.
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "HEAD") {
      res.status(200).end();
      return;
    }

    res.status(200).send(file.buffer);
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "storage_unavailable" });
  }
};
