import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const apiBase = process.env.WXCC_API_BASE || "https://api.wxcc-us1.cisco.com";
const orgId = process.env.WXCC_ORG_ID;

let serviceAppToken;

app.use(cors());
app.use(express.static(`${__dirname}/src`));
app.use(express.json());

async function wxccRequest(method, path, body) {
  const headers = {
    Authorization: `Bearer ${serviceAppToken}`,
    Accept: "application/json"
  };
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const resp = await fetch(`${apiBase}${path}`, options);
  const text = await resp.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: resp.status, body: json };
}

async function tokenRefresh() {
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REFRESH_TOKEN) {
    console.warn("Service App credentials missing — write API proxy disabled until .env is configured.");
    return;
  }
  console.log("Refreshing Service App token...");
  const resp = await fetch("https://webexapis.com/v1/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN
    })
  });
  const json = await resp.json();
  if (!resp.ok) {
    console.error("tokenRefresh failed:", json);
    return;
  }
  serviceAppToken = json.access_token;
  console.log("Service App token refreshed.");
}

function requireOrg(res) {
  if (!orgId) {
    res.status(500).json({ error: "WXCC_ORG_ID is not configured on the server." });
    return false;
  }
  if (!serviceAppToken) {
    res.status(503).json({ error: "Service App token unavailable. Check CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN." });
    return false;
  }
  return true;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    orgConfigured: Boolean(orgId),
    tokenReady: Boolean(serviceAppToken)
  });
});

app.get("/api/skills", async (_req, res) => {
  if (!requireOrg(res)) return;
  const result = await wxccRequest("GET", `/organization/${orgId}/skill`);
  res.status(result.status).json(result.body);
});

app.get("/api/skill-profiles", async (_req, res) => {
  if (!requireOrg(res)) return;
  const result = await wxccRequest("GET", `/organization/${orgId}/v2/skill-profile`);
  res.status(result.status).json(result.body);
});

app.get("/api/skill-profiles/:id", async (req, res) => {
  if (!requireOrg(res)) return;
  const result = await wxccRequest("GET", `/organization/${orgId}/skill-profile/${req.params.id}`);
  res.status(result.status).json(result.body);
});

app.get("/api/users/by-email/:email", async (req, res) => {
  if (!requireOrg(res)) return;
  const result = await wxccRequest("GET", `/organization/${orgId}/user`);
  if (result.status !== 200 || !Array.isArray(result.body)) {
    res.status(result.status).json(result.body);
    return;
  }
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const user = result.body.find((u) => (u.email || "").toLowerCase() === email);
  if (!user) {
    res.status(404).json({ error: "User not found for email." });
    return;
  }
  res.json(user);
});

app.get("/api/users/:id", async (req, res) => {
  if (!requireOrg(res)) return;
  const result = await wxccRequest("GET", `/organization/${orgId}/user/${req.params.id}`);
  res.status(result.status).json(result.body);
});

function sanitizeUserPayload(user, skillProfileId) {
  const payload = { ...user };
  delete payload._links;
  delete payload.links;
  payload.skillProfileId = skillProfileId;
  return payload;
}

app.put("/api/users/:id/skill-profile", async (req, res) => {
  if (!requireOrg(res)) return;
  const { skillProfileId, email } = req.body || {};
  if (!skillProfileId) {
    res.status(400).json({ error: "skillProfileId is required." });
    return;
  }
  if (!email) {
    res.status(400).json({ error: "email is required to verify agent identity." });
    return;
  }

  const current = await wxccRequest("GET", `/organization/${orgId}/user/${req.params.id}`);
  if (current.status !== 200) {
    res.status(current.status).json(current.body);
    return;
  }

  if ((current.body.email || "").toLowerCase() !== email.toLowerCase()) {
    res.status(403).json({ error: "You may only update your own skill profile." });
    return;
  }

  const profileCheck = await wxccRequest(
    "GET",
    `/organization/${orgId}/skill-profile/${skillProfileId}`
  );
  if (profileCheck.status !== 200) {
    res.status(400).json({ error: "Invalid skillProfileId for this organization." });
    return;
  }

  const payload = sanitizeUserPayload(current.body, skillProfileId);
  const result = await wxccRequest("PUT", `/organization/${orgId}/user/${req.params.id}`, payload);
  res.status(result.status).json(result.body);
});

app.listen(port, async () => {
  await tokenRefresh();
  console.log(`cc-skills-gadget listening on ${port}`);
  setInterval(tokenRefresh, 86400 * 1000);
});
