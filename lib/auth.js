const crypto = require("crypto");

const SALT = "ygsites::";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

function passwordHash(password) {
  return crypto.createHash("sha256").update(SALT + String(password || "")).digest("hex");
}

function expectedHash() {
  return String(process.env.ADMIN_PASSWORD_HASH || "").trim().toLowerCase();
}

function checkPassword(password) {
  const expected = expectedHash();
  if (!expected) return false;
  const actual = passwordHash(password);
  const a = Buffer.from(actual, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function secret() {
  return "yg-session::" + expectedHash();
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + mac;
}

function verify(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch (error) {
    return false;
  }
}

function issueToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return { token: sign({ exp: expiresAt }), expiresAt };
}

function bearer(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

module.exports = { checkPassword, issueToken, verify, bearer, passwordHash };
