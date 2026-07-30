import { Desktop } from "@wxcc-desktop/sdk";

const template = document.createElement("template");

function customLog(msg, args) {
  if (args) {
    console.log("cc-skills-gadget:", msg, args);
  } else {
    console.log("cc-skills-gadget:", msg);
  }
}

function compareByName(a, b) {
  return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
}

template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
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
    .loading-text { color: #005E7D; font-size: 13px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hidden { display: none; }
    .result-span {
      text-align: center;
      display: block;
      min-height: 20px;
      margin-top: 6px;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .fieldset {
      width: 100%;
      max-width: 600px;
      min-width: 560px;
      max-height: 400px;
      overflow: auto;
      border-radius: 5px;
      border: 1px solid #ddd;
      padding: 0px 12px;
      margin-top: 8px;
      margin-left: 6px;
    }
    .main-layout {
      width: 100%;
    }
    .dynamic-skills-scroll {
      max-height: 150px;
      overflow-y: auto;
    }
    .button {
      display: inline-block;
      border-radius: 5px;
      background: #064157;
      color: white;
      padding: 8px 12px;
      margin-top: 8px;
      border: none;
      cursor: pointer;
      font-size: 13px;
    }
    .button.full { display: block; width: 100%; margin-top: 10px; }
    .button.secondary { background: #005E7D; }
    .button.danger { background: #8b3a3a; }
    .button.action {
      padding: 8px 12px;
      margin: 0;
      font-size: 13px;
      white-space: nowrap;
    }
    .button:disabled {
      background: #cccccc;
      color: #666666;
      cursor: not-allowed;
    }
    .action-cell {
      display: flex;
      gap: 6px;
      flex-wrap: nowrap;
      align-items: center;
    }
    select, input[type="text"], input[type="number"] {
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      color: #005E7D;
      box-sizing: border-box;
      font-size: 13px;
      width: 100%;
    }
    label {
      display: block;
      margin-top: 10px;
      font-weight: 600;
      color: #064157;
      font-size: 13px;
    }
    h3 { margin: 0 0 0 0; color: #064157; font-size: 16px; }
    .faded { color: #888; font-size: 12px; margin: 0 0 0 0; }
    .skills-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .skills-table th, .skills-table td {
      text-align: left;
      padding: 6px 3px;
      vertical-align: middle;
      width: 50px;
    }
    .skills-table tbody tr {
      border-bottom: 1px solid #eee;
    }
    .skills-table th { color: #064157; border-bottom: 1px solid #ddd; }
    .current-label { margin-top: 4px; font-size: 13px; color: #005E7D; }
    .add-form { margin-top: 10px; flex-shrink: 0; }
    .add-fields-row {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }
    .add-field-half {
      flex: 1 1 50%;
      min-width: 0;
    }
    .sub-label {
      display: block;
      margin-top: 0;
      font-size: 12px;
      font-weight: 600;
      color: #064157;
    }
    .add-field-half select,
    .add-field-half input,
    .add-field-half .value-input {
      margin-top: 4px;
    }
    .value-hint {
      font-size: 11px;
      color: #888;
      margin-top: 6px;
    }
    .value-input { width: 100%; }
    .empty-note { font-size: 13px; color: #888; font-style: italic; margin: 8px 0; }
    .type-tag {
      font-size: 11px;
      color: #666;
      display: block;
    }
  </style>

  <div id="loading" class="loading-wrap">
    <div class="spinner"></div>
    <span class="loading-text">Loading...</span>
  </div>

  <div id="main" class="main-layout hidden">
    <fieldset class="fieldset">
      <h3>Skill Profile</h3>
      <p class="faded">Switch your individual skill profile assignment. Does not affect other agents.</p>
      <p id="currentProfile" class="current-label"></p>
      <label for="skillProfileSelect">Available profiles</label>
      <select id="skillProfileSelect" style="margin-top:6px;"></select>
      <div id="skillsPreview"></div>
      <button id="saveSkillProfile" class="button full">Apply Skill Profile</button>
      <span id="profileResult" class="result-span"></span>
    </fieldset>

    <fieldset class="fieldset">
      <h3>Dynamic Skills</h3>
      <p class="faded">Your personal skill assignments, separate from your skill profile.</p>
      <div id="dynamicSkillsList" class="dynamic-skills-scroll"></div>
      <div id="addDynamicSection" class="add-form">
        <label>Add a dynamic skill</label>
        <div class="add-fields-row">
          <div class="add-field-half">
            <span class="sub-label" for="addSkillSelect">Skill</span>
            <select id="addSkillSelect"></select>
          </div>
          <div class="add-field-half">
            <span class="sub-label" id="addValueLabel">Value</span>
            <div id="addValueWrap">
              <input id="addValueInput" class="value-input" type="text" placeholder="Value" />
            </div>
          </div>
        </div>
        <p id="addValueHint" class="value-hint"></p>
        <button id="addDynamicBtn" class="button secondary full dynamic-action-btn" type="button">Add Dynamic Skill</button>
      </div>
      <span id="dynamicResult" class="result-span"></span>
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
    this.enumValueById = {};
    this.dynamicSkillDefs = [];
    this.assignedDynamicSkills = [];
    this.addDynamicDisabled = false;
    this.dynamicBusy = false;
  }

  setProfileResult(message, color = "#064157") {
    const el = this.shadowRoot.getElementById("profileResult");
    el.textContent = message;
    el.style.color = color;
  }

  setDynamicResult(message, color = "#064157") {
    const el = this.shadowRoot.getElementById("dynamicResult");
    el.textContent = message;
    el.style.color = color;
  }

  setDynamicBusy(busy) {
    this.dynamicBusy = busy;
    const addBtn = this.shadowRoot.getElementById("addDynamicBtn");
    if (addBtn) addBtn.disabled = busy || this.addDynamicDisabled;
    this.shadowRoot.querySelectorAll(".dynamic-action-btn").forEach((btn) => {
      btn.disabled = busy;
    });
  }

  syncAddDynamicButton() {
    const addBtn = this.shadowRoot.getElementById("addDynamicBtn");
    if (addBtn) addBtn.disabled = this.dynamicBusy || this.addDynamicDisabled;
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
      const errMsg =
        json.error ||
        json?.error?.message?.[0]?.description ||
        json.message ||
        `PUT ${path} failed (${resp.status})`;
      throw new Error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
    return json;
  }

  profileName(profileId) {
    const profile = this.skillProfiles.find((p) => p.id === profileId);
    return profile ? profile.name : profileId || "None";
  }

  skillName(skillId) {
    return this.skillsById[skillId]?.name || skillId;
  }

  indexSkillCatalog(skills) {
    this.skillsById = Object.fromEntries(skills.map((s) => [s.id, s]));
    this.enumValueById = {};
    for (const skill of skills) {
      for (const enumValue of skill.enumSkillValues || []) {
        this.enumValueById[enumValue.id] = {
          valueName: enumValue.name,
          skillId: skill.id,
          skillName: skill.name
        };
      }
    }
  }

  resolveProfileSkillEntry(entry) {
    if (entry.enumSkillValueId) {
      const resolved = this.enumValueById[entry.enumSkillValueId];
      if (resolved) {
        return { skillName: resolved.skillName, value: resolved.valueName };
      }
      return {
        skillName: entry.enumSkillValueId,
        value: entry.enumSkillValueId
      };
    }

    const skillDef = this.skillsById[entry.skillId] || {};
    return {
      skillName: skillDef.name || entry.skillId,
      value: this.formatSkillValue(entry, skillDef)
    };
  }

  profileSkillSortKey(entry) {
    if (entry.enumSkillValueId) {
      return this.enumValueById[entry.enumSkillValueId]?.skillName || entry.enumSkillValueId;
    }
    return this.skillName(entry.skillId);
  }

  formatAssignedValue(entry) {
    const def = this.skillsById[entry.skillId] || {};
    if (entry.textValue !== undefined && entry.textValue !== "") return entry.textValue;
    if (entry.booleanValue !== undefined) return entry.booleanValue ? "Yes" : "No";
    if (entry.proficiencyValue !== undefined) return String(entry.proficiencyValue);
    if (entry.enumSkillValueId) return entry.enumSkillValueId;
    return "—";
  }

  proficiencyHint(skillDef) {
    if (skillDef.description) return skillDef.description;
    return "Expertise level from 0 (none) to 10 (expert). Used for skills-based routing.";
  }

  buildEntryFromInput(skillDef, rawValue) {
    const type = skillDef.skillType;
    if (type === "PROFICIENCY") {
      const n = Number(rawValue);
      if (Number.isNaN(n) || n < 0 || n > 10 || !Number.isInteger(n)) {
        throw new Error(`${skillDef.name}: enter a whole number from 0 to 10.`);
      }
      return { skillId: skillDef.id, proficiencyValue: n };
    }
    if (type === "TEXT") {
      const text = String(rawValue || "").trim();
      if (!text) throw new Error("Text value is required.");
      if (text.length > 40) throw new Error("Text value max length is 40 characters.");
      return { skillId: skillDef.id, textValue: text };
    }
    if (type === "BOOLEAN") {
      return { skillId: skillDef.id, booleanValue: rawValue === true || rawValue === "true" };
    }
    throw new Error(`Unsupported skill type: ${type}`);
  }

  updateCurrentLabel() {
    const el = this.shadowRoot.getElementById("currentProfile");
    el.textContent = this.currentSkillProfileId
      ? `Current: ${this.profileName(this.currentSkillProfileId)}`
      : "Current: Team default (no individual profile assigned)";
  }

  renderSkillProfiles() {
    const select = this.shadowRoot.getElementById("skillProfileSelect");
    select.innerHTML = "";
    const sortedProfiles = [...this.skillProfiles].sort(compareByName);
    for (const profile of sortedProfiles) {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      if (profile.id === this.currentSkillProfileId) option.selected = true;
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
    if (activeSkill.textValue) return activeSkill.textValue;
    if (activeSkill.booleanValue !== undefined) return activeSkill.booleanValue ? "Yes" : "No";
    if (activeSkill.proficiencyValue !== undefined) return String(activeSkill.proficiencyValue);
    if (activeSkill.enumSkillValueId) return activeSkill.enumSkillValueId;
    return skillDef?.skillType === "TEXT" ? "(empty)" : "—";
  }

  renderSkillsPreview(profile) {
    const container = this.shadowRoot.getElementById("skillsPreview");
    container.innerHTML = "";
    if (!profile) {
      container.innerHTML = "<p class='faded'>Select a profile to preview its skills.</p>";
      return;
    }
    const allActive = [...(profile.activeSkills || []), ...(profile.activeEnumSkills || [])];
    if (!allActive.length) {
      container.innerHTML = "<p class='faded'>This profile has no skills configured.</p>";
      return;
    }
    const table = document.createElement("table");
    table.className = "skills-table";
    table.innerHTML = "<thead><tr><th>Skill</th><th>Value</th></tr></thead>";
    const tbody = document.createElement("tbody");
    const sortedActive = [...allActive].sort((a, b) =>
      this.profileSkillSortKey(a).localeCompare(this.profileSkillSortKey(b), undefined, {
        sensitivity: "base"
      })
    );
    for (const activeSkill of sortedActive) {
      const { skillName, value } = this.resolveProfileSkillEntry(activeSkill);
      const row = document.createElement("tr");
      row.innerHTML = `<td>${skillName}</td><td>${value}</td>`;
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  renderDynamicSkillsList() {
    const container = this.shadowRoot.getElementById("dynamicSkillsList");
    container.innerHTML = "";

    if (!this.assignedDynamicSkills.length) {
      container.innerHTML = "<p class='empty-note'>No dynamic skills assigned yet.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "skills-table";
    table.innerHTML = "<thead><tr><th>Skill</th><th>Value</th><th></th></tr></thead>";
    const tbody = document.createElement("tbody");

    const sortedAssigned = [...this.assignedDynamicSkills].sort((a, b) =>
      this.skillName(a.skillId).localeCompare(this.skillName(b.skillId), undefined, {
        sensitivity: "base"
      })
    );

    for (const entry of sortedAssigned) {
      const def = this.skillsById[entry.skillId] || {};
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.innerHTML = `${def.name || entry.skillId}<span class="type-tag">${def.skillType || ""}</span>`;

      const valueCell = document.createElement("td");
      const input = this.createValueInput(def, this.formatAssignedValue(entry));
      input.dataset.skillId = entry.skillId;
      input.classList.add("value-input");
      valueCell.appendChild(input);

      const actionCell = document.createElement("td");
      actionCell.className = "action-cell";

      const updateBtn = document.createElement("button");
      updateBtn.className = "button secondary action dynamic-action-btn";
      updateBtn.textContent = "Update";
      updateBtn.type = "button";
      updateBtn.addEventListener("click", () => this.updateAssignedSkill(entry.skillId, input));

      const removeBtn = document.createElement("button");
      removeBtn.className = "button danger action dynamic-action-btn";
      removeBtn.textContent = "Remove";
      removeBtn.type = "button";
      removeBtn.addEventListener("click", () => this.removeDynamicSkill(entry.skillId));

      actionCell.appendChild(updateBtn);
      actionCell.appendChild(removeBtn);

      row.appendChild(nameCell);
      row.appendChild(valueCell);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  createValueInput(skillDef, value) {
    const type = skillDef.skillType;
    if (type === "BOOLEAN") {
      const select = document.createElement("select");
      select.innerHTML = '<option value="true">Yes</option><option value="false">No</option>';
      select.value = value === "Yes" || value === true ? "true" : "false";
      return select;
    }
    if (type === "PROFICIENCY") {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "10";
      input.step = "1";
      input.placeholder = "0–10";
      input.title = this.proficiencyHint(skillDef);
      input.value = value === "—" ? "" : value;
      return input;
    }
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 40;
    input.value = value === "—" ? "" : value;
    return input;
  }

  readInputValue(skillDef, inputEl) {
    if (skillDef.skillType === "BOOLEAN") {
      return inputEl.value === "true";
    }
    return inputEl.value;
  }

  renderAddDynamicForm() {
    const select = this.shadowRoot.getElementById("addSkillSelect");
    const assignedIds = new Set(this.assignedDynamicSkills.map((e) => e.skillId));
    const available = this.dynamicSkillDefs
      .filter((d) => !assignedIds.has(d.id))
      .sort(compareByName);

    select.innerHTML = "";
    if (!available.length) {
      const opt = document.createElement("option");
      opt.textContent = "All dynamic skills assigned";
      opt.disabled = true;
      select.appendChild(opt);
      this.addDynamicDisabled = true;
      this.syncAddDynamicButton();
      return;
    }

    this.addDynamicDisabled = false;
    this.syncAddDynamicButton();
    for (const def of available) {
      const opt = document.createElement("option");
      opt.value = def.id;
      opt.textContent = `${def.name} (${def.skillType})`;
      select.appendChild(opt);
    }
    this.updateAddValueInput();
  }

  valueLabelForType(skillType) {
    if (skillType === "BOOLEAN") return "Value (Yes / No)";
    if (skillType === "PROFICIENCY") return "Proficiency (0–10)";
    return "Value";
  }

  textPlaceholderForSkill(def) {
    const name = (def.name || "").toLowerCase();
    if (name.includes("language")) return "e.g. English, Spanish";
    if (name.includes("unit") || name.includes("department")) return "e.g. Emergency, Scheduling";
    return "Enter value (max 40 characters)";
  }

  updateAddValueInput() {
    const select = this.shadowRoot.getElementById("addSkillSelect");
    const wrap = this.shadowRoot.getElementById("addValueWrap");
    const hint = this.shadowRoot.getElementById("addValueHint");
    const valueLabel = this.shadowRoot.getElementById("addValueLabel");
    const skillId = select.value;
    const def = this.dynamicSkillDefs.find((d) => d.id === skillId);
    wrap.innerHTML = "";
    hint.textContent = "";

    if (!def) return;

    valueLabel.textContent = this.valueLabelForType(def.skillType);

    const input = this.createValueInput(def, def.skillType === "BOOLEAN" ? "No" : "");
    input.id = "addValueInput";
    if (def.skillType === "TEXT") {
      input.placeholder = this.textPlaceholderForSkill(def);
    }
    wrap.appendChild(input);

    if (def.skillType === "PROFICIENCY") {
      hint.textContent = this.proficiencyHint(def);
    } else if (def.skillType === "BOOLEAN") {
      hint.textContent = def.description || "Yes = you have this capability; No = you do not.";
    } else if (def.description) {
      hint.textContent = def.description;
    }
  }

  async saveDynamicSkills(dynamicSkills) {
    this.setDynamicBusy(true);
    try {
      const resp = await this.apiPut(`/api/users/${this.agentUserId}/dynamic-skills`, {
        email: this.agentEmail,
        dynamicSkills
      });
      this.assignedDynamicSkills = resp.dynamicSkills || [];
      this.renderDynamicSkillsList();
      this.renderAddDynamicForm();
    } finally {
      this.setDynamicBusy(false);
    }
  }

  async addDynamicSkill() {
    const select = this.shadowRoot.getElementById("addSkillSelect");
    const input = this.shadowRoot.getElementById("addValueInput");
    const def = this.dynamicSkillDefs.find((d) => d.id === select.value);
    if (!def) return;

    try {
      const entry = this.buildEntryFromInput(def, this.readInputValue(def, input));
      const next = [...this.assignedDynamicSkills, entry];
      await this.saveDynamicSkills(next);
      this.setDynamicResult(`Added ${def.name}.`, "#067d06");
    } catch (e) {
      this.setDynamicResult(e.message, "red");
    }
  }

  async removeDynamicSkill(skillId) {
    const name = this.skillName(skillId);
    try {
      const next = this.assignedDynamicSkills.filter((e) => e.skillId !== skillId);
      await this.saveDynamicSkills(next);
      this.setDynamicResult(`Removed ${name}.`, "#067d06");
    } catch (e) {
      this.setDynamicResult(e.message, "red");
    }
  }

  async updateAssignedSkill(skillId, inputEl) {
    const def = this.skillsById[skillId];
    try {
      const entry = this.buildEntryFromInput(def, this.readInputValue(def, inputEl));
      const next = this.assignedDynamicSkills.map((e) =>
        e.skillId === skillId ? entry : e
      );
      await this.saveDynamicSkills(next);
      this.setDynamicResult(`Updated ${def.name}.`, "#067d06");
    } catch (e) {
      this.setDynamicResult(e.message, "red");
    }
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
      this.setProfileResult(
        "Server Service App token not ready. Configure CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN.",
        "red"
      );
      this.showMain();
      return;
    }

    const [profilesResp, skillsResp, dynamicResp] = await Promise.all([
      this.apiGet("/api/skill-profiles"),
      this.apiGet("/api/skills"),
      this.apiGet("/api/skills/dynamic")
    ]);

    this.skillProfiles = profilesResp.data || profilesResp || [];
    const skills = Array.isArray(skillsResp) ? skillsResp : skillsResp?.data || [];
    this.indexSkillCatalog(skills);
    this.dynamicSkillDefs = Array.isArray(dynamicResp) ? dynamicResp : [];

    if (this.agentUserId) {
      const user = await this.apiGet(`/api/users/${this.agentUserId}`);
      this.currentSkillProfileId = user.skillProfileId || null;
      this.assignedDynamicSkills = user.dynamicSkills || [];
    }

    this.renderSkillProfiles();
    this.renderDynamicSkillsList();
    this.renderAddDynamicForm();

    const select = this.shadowRoot.getElementById("skillProfileSelect");
    await this.loadProfilePreview(select.value || this.currentSkillProfileId);
    this.showMain();
  }

  wireEvents() {
    const profileSelect = this.shadowRoot.getElementById("skillProfileSelect");
    profileSelect.addEventListener("change", () => {
      this.loadProfilePreview(profileSelect.value);
    });

    this.shadowRoot.getElementById("saveSkillProfile").addEventListener("click", async () => {
      if (!this.agentUserId || !this.agentEmail) {
        this.setProfileResult("Could not resolve your agent account.", "red");
        return;
      }
      const btn = this.shadowRoot.getElementById("saveSkillProfile");
      btn.disabled = true;
      try {
        await this.apiPut(`/api/users/${this.agentUserId}/skill-profile`, {
          skillProfileId: profileSelect.value,
          email: this.agentEmail
        });
        this.currentSkillProfileId = profileSelect.value;
        this.updateCurrentLabel();
        this.setProfileResult("Skill profile applied.", "#067d06");
      } catch (e) {
        this.setProfileResult(e.message, "red");
      } finally {
        btn.disabled = false;
      }
    });

    this.shadowRoot.getElementById("addSkillSelect").addEventListener("change", () => {
      this.updateAddValueInput();
    });

    this.shadowRoot.getElementById("addDynamicBtn").addEventListener("click", () => {
      this.addDynamicSkill();
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
        this.assignedDynamicSkills = user.dynamicSkills || [];
      }
    } catch (e) {
      customLog("init agent context error", e);
    }

    try {
      await this.loadData();
    } catch (e) {
      customLog("loadData error", e);
      this.setProfileResult(e.message, "red");
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
