const crypto = require("crypto");
const { verify, bearer } = require("../lib/auth");
const store = require("../lib/store");

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB depois de decodificado

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function parseDataUrl(value) {
  if (typeof value !== "string") return null;

  const match = /^data:([a-z0-9.+/-]+);base64,([a-z0-9+/=\r\n\s]+)$/i.exec(value.trim());
  if (!match) return null;

  const type = match[1].toLowerCase();
  const ext = ALLOWED[type];
  if (!ext) return null;

  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!buffer.length) return null;

  return { type, ext, buffer };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

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

  const image = parseDataUrl(body?.image);
  if (!image) {
    res.status(400).json({ error: "invalid_image" });
    return;
  }

  if (image.buffer.length > MAX_BYTES) {
    res.status(413).json({ error: "image_too_large", maxBytes: MAX_BYTES });
    return;
  }

  // O nome é o hash do conteúdo: arquivos iguais ocupam um único espaço.
  const name = crypto.createHash("sha256").update(image.buffer).digest("hex").slice(0, 32) + "." + image.ext;

  try {
    if (!(await store.imageExists(name))) {
      await store.writeImage(name, image.buffer.toString("base64"));
    }
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "storage_unavailable" });
    return;
  }

  res.status(200).json({
    url: "/api/image?name=" + name,
    name,
    bytes: image.buffer.length,
    type: image.type
  });
};
