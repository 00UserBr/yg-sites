const { checkPassword, issueToken } = require("../lib/auth");

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function tooManyAttempts(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 0, reset: now + WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(ip) {
  const entry = attempts.get(ip) || { count: 0, reset: Date.now() + WINDOW_MS };
  entry.count += 1;
  attempts.set(ip, entry);

  if (attempts.size > 500) {
    const now = Date.now();
    for (const [key, value] of attempts) {
      if (value.reset < now) attempts.delete(key);
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const ip = clientIp(req);
  if (tooManyAttempts(ip)) {
    res.status(429).json({ error: "too_many_attempts" });
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

  const password = typeof body?.password === "string" ? body.password : "";

  if (!password) {
    res.status(400).json({ error: "missing_password" });
    return;
  }

  if (!checkPassword(password)) {
    registerFailure(ip);
    res.status(401).json({ error: "invalid_password" });
    return;
  }

  attempts.delete(ip);
  res.status(200).json(issueToken());
};
