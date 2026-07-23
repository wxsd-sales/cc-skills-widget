import { Desktop } from "@wxcc-desktop/sdk";

const template = document.createElement("template");

function customLog(msg, args) {
  if (args) {
    console.log("cc-skills-gadget:", msg, args);
  } else {
    console.log("cc-skills-gadget:", msg);
  }
}

template.innerHTML = `
  <style>
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 24px 0;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #ddd;
      border-top-color: #064157;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text {
      color: #005E7D;
      font-size: 13px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .hidden { display: none; }
    .result-span {
      text-align: center;
      display: block;
      min-height: 24px;
      margin-top: 8px;
    }
    .fieldset {
      width: 100%;
      max-width: 560px;
      border-radius: 5px;
      border: 1px solid #ddd;
      padding: 12px;
    }
    .button {
      display: block;
      border-radius: 5px;
      background: #064157;
      color: white;
      padding: 8px;
      margin-top: 10px;
      width: 100%;
      border: none;
      cursor: pointer;
    }
    button:disabled {
      background-color: #cccccc;
      color: #666666;
      cursor: not-allowed;
    }
    select {
      width: 100%;
      margin-top: 6px;
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #005E7D;
      box-sizing: border-box;
    }
    label {
      display: block;
      margin-top: 12px;
      font-weight: 600;
      color: #064157;
    }
    h3 { margin: 0 0 8px 0; color: #064157; }
    .faded { color: #888; font-size: 12px; }
    .skills-table {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
      font-size: 13px;
    }
    .skills-table th, .skills-table td {
      text-align: left;
      padding: 6px 4px;
      border-bottom: 1px solid #eee;
    }
    .skills-table th { color: #064157; }
    .current-label {
      margin-top: 8px;
      font-size: 13px;
      color: #005E7D;
    }
  </style>

  <div id="loading" class="loading-wrap">
    <div class="spinner"></div>
    <span class="loading-text">Loading...</span>
  </div>
  <div id="main" class="hidden">
    <fieldset class="fieldset">
      <h3>Skill Profile</h3>
      <p class="faded">
        Select a skill profile to assign to yourself. This only changes your individual
        assignment and does not modify the shared profile or affect other agents.
      </p>
      <p id="currentProfile" class="current-label"></p>
      <label for="skillProfileSelect">Available profiles</label>
      <select id="skillProfileSelect"></select>

      <div id="skillsPreview"></div>

      <button id="saveSkillProfile" class="button">Apply Skill Profile</button>
      <span id="result" class="result-span"></span>
    </fieldset>
  </div>
`;

class SkillsGadget extends HTMLElement {
  constructor() {
    super();
    const font = document.createElement("link");
    font.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;600&display=swap";
    font.rel = "stylesheet";
    document.head.appendChild(font);

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    window.shadowRoot = this.shadowRoot;
    this.agentUserId = null;
    this.agentEmail = null;
    this.currentSkillProfileId = null;
    this.skillProfiles = [];
    this.skillsById = {};
  }

  setResult(message, color = "#064157") {
    const el = this.shadowRoot.getElementById("result");
    el.textContent = message;
    el.style.color = color;
  }

  showMain() {
    this.shadowRoot.getElementById("loading").classList.add("hidden");
    this.shadowRoot.getElementById("main").classList.remove("hidden");
  }

  async apiGet(path) {
    const resp = await fetch(`${process.env.HOST_URI}${path}`);
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(json.error || json.message || `GET ${path} failed (${resp.status})`);
    }
    return json;
  }

  async apiPut(path, body) {
    const resp = await fetch(`${process.env.HOST_URI}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(json.error || json.message || `PUT ${path} failed (${resp.status})`);
    }
    return json;
  }

  profileName(profileId) {
    const profile = this.skillProfiles.find((p) => p.id === profileId);
    return profile ? profile.name : profileId || "None";
  }

  updateCurrentLabel() {
    const el = this.shadowRoot.getElementById("currentProfile");
    if (this.currentSkillProfileId) {
      el.textContent = `Current: ${this.profileName(this.currentSkillProfileId)}`;
    } else {
      el.textContent = "Current: Team default (no individual profile assigned)";
    }
  }

  renderSkillProfiles() {
    const select = this.shadowRoot.getElementById("skillProfileSelect");
    select.innerHTML = "";
    for (const profile of this.skillProfiles) {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      if (profile.id === this.currentSkillProfileId) {
        option.selected = true;
      }
      select.appendChild(option);
    }
    if (!this.skillProfiles.length) {
      const option = document.createElement("option");
      option.textContent = "No skill profiles available";
      option.disabled = true;
      select.appendChild(option);
    }
    this.updateCurrentLabel();
  }

  formatSkillValue(activeSkill, skillDef) {
    if (activeSkill.textValue !== undefined && activeSkill.textValue !== "") {
      return activeSkill.textValue;
    }
    if (activeSkill.booleanValue !== undefined) {
      return activeSkill.booleanValue ? "Yes" : "No";
    }
    if (activeSkill.proficiencyValue !== undefined) {
      return String(activeSkill.proficiencyValue);
    }
    if (activeSkill.enumSkillValueId) {
      return activeSkill.enumSkillValueId;
    }
    const type = skillDef?.skillType || "unknown";
    return type === "TEXT" ? "(empty)" : "—";
  }

  renderSkillsPreview(profile) {
    const container = this.shadowRoot.getElementById("skillsPreview");
    container.innerHTML = "";

    if (!profile) {
      container.innerHTML = "<p class='faded'>Select a profile to preview its skills.</p>";
      return;
    }

    const activeSkills = profile.activeSkills || [];
    const activeEnumSkills = profile.activeEnumSkills || [];
    const allActive = [...activeSkills, ...activeEnumSkills];

    if (!allActive.length) {
      container.innerHTML = "<p class='faded'>This profile has no skills configured.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "skills-table";
    table.innerHTML = "<thead><tr><th>Skill</th><th>Value</th></tr></thead>";
    const tbody = document.createElement("tbody");

    for (const activeSkill of allActive) {
      const skillDef = this.skillsById[activeSkill.skillId] || {};
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${skillDef.name || activeSkill.skillId}</td>
        <td>${this.formatSkillValue(activeSkill, skillDef)}</td>
      `;
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  async loadProfilePreview(profileId) {
    if (!profileId) {
      this.renderSkillsPreview(null);
      return;
    }
    try {
      const profile = await this.apiGet(`/api/skill-profiles/${profileId}`);
      this.renderSkillsPreview(profile);
    } catch (e) {
      customLog("loadProfilePreview error", e);
      this.renderSkillsPreview(null);
    }
  }

  async loadData() {
    const health = await this.apiGet("/health");
    if (!health.tokenReady) {
      this.setResult(
        "Server Service App token not ready. Configure CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN.",
        "red"
      );
      this.showMain();
      return;
    }

    const [profilesResp, skillsResp] = await Promise.all([
      this.apiGet("/api/skill-profiles"),
      this.apiGet("/api/skills")
    ]);

    this.skillProfiles = profilesResp.data || profilesResp || [];
    const skills = Array.isArray(skillsResp) ? skillsResp : [];
    this.skillsById = Object.fromEntries(skills.map((s) => [s.id, s]));

    if (this.agentUserId) {
      const user = await this.apiGet(`/api/users/${this.agentUserId}`);
      this.currentSkillProfileId = user.skillProfileId || null;
    }

    this.renderSkillProfiles();

    const select = this.shadowRoot.getElementById("skillProfileSelect");
    const selectedId = select.value || this.currentSkillProfileId;
    await this.loadProfilePreview(selectedId);
    this.showMain();
  }

  wireEvents() {
    const select = this.shadowRoot.getElementById("skillProfileSelect");
    select.addEventListener("change", () => {
      this.loadProfilePreview(select.value);
    });

    const saveBtn = this.shadowRoot.getElementById("saveSkillProfile");
    saveBtn.addEventListener("click", async () => {
      if (!this.agentUserId || !this.agentEmail) {
        this.setResult("Could not resolve your agent account.", "red");
        return;
      }
      const skillProfileId = select.value;
      if (!skillProfileId) {
        this.setResult("Select a skill profile first.", "red");
        return;
      }

      saveBtn.disabled = true;
      try {
        await this.apiPut(`/api/users/${this.agentUserId}/skill-profile`, {
          skillProfileId,
          email: this.agentEmail
        });
        this.currentSkillProfileId = skillProfileId;
        this.updateCurrentLabel();
        this.setResult("Skill profile applied to your account.", "#067d06");
      } catch (e) {
        customLog("saveSkillProfile error", e);
        this.setResult(e.message, "red");
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  async init() {
    Desktop.config.init();
    this.wireEvents();
    try {
      window.myAgentService = Desktop.agentContact.SERVICE;
      const person = await Desktop.agentContact.SERVICE.webex.fetchPersonData("me");
      window.agentDetails = person;
      this.agentEmail = person.emails?.[0] || null;

      if (this.agentEmail) {
        const user = await this.apiGet(
          `/api/users/by-email/${encodeURIComponent(this.agentEmail)}`
        );
        this.agentUserId = user.id;
        this.currentSkillProfileId = user.skillProfileId || null;
        customLog("resolved WxCC user", user);
      }
    } catch (e) {
      customLog("init agent context error", e);
    }

    try {
      await this.loadData();
    } catch (e) {
      customLog("loadData error", e);
      this.setResult(e.message, "red");
      this.showMain();
    }
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    Desktop.agentContact.removeAllEventListeners();
  }
}

customElements.define("sa-ds-voice-sdk", SkillsGadget);
