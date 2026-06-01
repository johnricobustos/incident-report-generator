/*
 * app.js — Reactive form logic for the Northwind Incident Report Generator.
 *
 * Chunk 1 scope: populate the form from the embedded NORTHWIND_DATA (data.js)
 * and wire the reactive behavior — employee -> supervisor auto-fill, violation
 * -> valid severities only, severity -> monitoring period / incentive impact.
 * No AI generation yet; the Generate button is intentionally inert.
 *
 * NORTHWIND_DATA is provided by data.js, loaded before this script.
 */
(function () {
  "use strict";

  // Session-only application state. Never persisted (no localStorage until a
  // later chunk); the API key lives here in memory only.
  const appState = {
    mode: "demo", // "demo" | "live"
    apiKey: "",
  };

  // Which kind of body is currently rendered. Drives whether the separate
  // signature block is shown/appended: the demo template stops at the closing
  // paragraph (we add the signature), whereas AI output already ends with its
  // own signature (per the verbatim system prompt), so we must not double it.
  let lastRenderKind = "demo"; // "demo" | "ai"

  // System prompt — copied verbatim from BLUEPRINT.md "The AI Prompt" section.
  const SYSTEM_PROMPT = `You are an HR communications specialist at Northwind Solutions, a professional services company. Your job is to draft a formal, legally-compliant Notice to Explain (NTE) email for an employee incident.

TONE REQUIREMENTS:
- Formal, professional, and respectful
- Factual and neutral — never accusatory or emotional
- Clear and direct, but never harsh
- Match the severity of the incident — minor violations get a measured tone, serious violations get appropriate gravity
- Always assume good faith — the employee has the right to respond and explain

STRUCTURE REQUIREMENTS:
- Begin with "Dear [first name],"
- Three to five short paragraphs in the body
- Cite the specific violation category and severity level
- Clearly state monitoring period, incentive impact, and any probationary consequences
- State the response deadline (5 days standard, 3 days for harassment/fraud cases)
- Close with "Sincerely," and the HR officer's full signature

WHAT NOT TO INCLUDE:
- Do not declare guilt or assign blame — this is a notice to explain, not a verdict
- Do not include subjective language ("clearly", "obviously", "unacceptable behavior")
- Do not threaten termination unless severity is Level 6
- Do not use casual or sympathetic language ("I know this is tough", "we all make mistakes")

INPUTS YOU WILL RECEIVE:
- Employee details (name, ID, department, position, employment status)
- Supervisor details
- HR officer details
- Violation category and description
- Severity level and severity guideline text
- Monitoring period
- Incentive impact text
- Probationary consequences (if applicable)
- HR's description of the specific incident
- Date of incident
- Date of notice

OUTPUT FORMAT:
Return only the email body, starting with "Dear [first name]," and ending with the signature block. Do not include the TO/FROM/SUBJECT header — the application handles that separately.`;

  // --- Element references -------------------------------------------------
  const els = {
    employeeSelect: document.getElementById("employeeSelect"),
    employeeDetails: document.getElementById("employeeDetails"),
    empEmail: document.getElementById("empEmail"),
    empDepartment: document.getElementById("empDepartment"),
    empPosition: document.getElementById("empPosition"),
    empStatus: document.getElementById("empStatus"),
    supName: document.getElementById("supName"),
    supEmail: document.getElementById("supEmail"),

    violationSelect: document.getElementById("violationSelect"),
    violationInfo: document.getElementById("violationInfo"),
    violationDescription: document.getElementById("violationDescription"),
    violationExamples: document.getElementById("violationExamples"),

    severitySelect: document.getElementById("severitySelect"),
    severityInfo: document.getElementById("severityInfo"),
    severityBadge: document.getElementById("severityBadge"),
    severityGuideline: document.getElementById("severityGuideline"),
    monitoringPeriod: document.getElementById("monitoringPeriod"),
    incentiveImpact: document.getElementById("incentiveImpact"),
    probationaryBox: document.getElementById("probationaryBox"),
    probationaryConsequence: document.getElementById("probationaryConsequence"),

    incidentDate: document.getElementById("incidentDate"),
    incidentDescription: document.getElementById("incidentDescription"),
    additionalNotes: document.getElementById("additionalNotes"),
    hrOfficerSelect: document.getElementById("hrOfficerSelect"),
    hrName: document.getElementById("hrName"),
    hrTitle: document.getElementById("hrTitle"),
    hrEmail: document.getElementById("hrEmail"),

    // Add HR Staff modal
    editHrBtn: document.getElementById("editHrBtn"),
    hrModal: document.getElementById("hrModal"),
    hrModalBackdrop: document.getElementById("hrModalBackdrop"),
    newHrName: document.getElementById("newHrName"),
    newHrTitle: document.getElementById("newHrTitle"),
    newHrEmail: document.getElementById("newHrEmail"),
    addHrBtn: document.getElementById("addHrBtn"),
    closeHrBtn: document.getElementById("closeHrBtn"),
    hrModalError: document.getElementById("hrModalError"),

    // Validation error messages
    errEmployee: document.getElementById("errEmployee"),
    errViolation: document.getElementById("errViolation"),
    errSeverity: document.getElementById("errSeverity"),
    errDescription: document.getElementById("errDescription"),

    // Generate + email output
    generateBtn: document.getElementById("generateBtn"),
    emailPanel: document.getElementById("emailPanel"),
    outTo: document.getElementById("outTo"),
    outCc: document.getElementById("outCc"),
    outFrom: document.getElementById("outFrom"),
    outDate: document.getElementById("outDate"),
    outSubject: document.getElementById("outSubject"),
    emailBadge: document.getElementById("emailBadge"),
    outMonitoring: document.getElementById("outMonitoring"),
    outIncentive: document.getElementById("outIncentive"),
    outProbationaryBox: document.getElementById("outProbationaryBox"),
    outProbationary: document.getElementById("outProbationary"),
    emailBody: document.getElementById("emailBody"),
    emailSignature: document.getElementById("emailSignature"),
    outSigName: document.getElementById("outSigName"),
    outSigTitle: document.getElementById("outSigTitle"),

    // Email mode badge + loading + fallback notice
    emailModeBadge: document.getElementById("emailModeBadge"),
    emailLoading: document.getElementById("emailLoading"),
    emailDocument: document.getElementById("emailDocument"),
    emailActions: document.getElementById("emailActions"),
    genNotice: document.getElementById("genNotice"),

    // Action buttons
    copyBtn: document.getElementById("copyBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    printBtn: document.getElementById("printBtn"),
    resetBtn: document.getElementById("resetBtn"),

    // Settings panel
    headerStatus: document.getElementById("headerStatus"),
    gearBtn: document.getElementById("gearBtn"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsBackdrop: document.getElementById("settingsBackdrop"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    modeToggle: document.getElementById("modeToggle"),
    modeToggleLabel: document.getElementById("modeToggleLabel"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    toggleKeyVisBtn: document.getElementById("toggleKeyVisBtn"),
    testConnBtn: document.getElementById("testConnBtn"),
    testResult: document.getElementById("testResult"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  };

  // Violations that get an expedited 3-day response deadline (vs. 5 standard).
  const EXPEDITED_VIOLATIONS = new Set(["V-HAR", "V-FRD"]);

  // --- Helpers ------------------------------------------------------------

  // Map a severity level (1-6) to a Tailwind-ish badge class. The CSS lives in
  // style.css; here we only pick the variant. Blueprint color bands:
  //   L1-2 amber · L3-4 orange · L5-6 red.
  function severityVariant(level) {
    if (level <= 2) return "severity-low";
    if (level <= 4) return "severity-mid";
    return "severity-high";
  }

  function findEmployee(id) {
    return NORTHWIND_DATA.employees.find((e) => e.employee_id === id);
  }

  function findViolation(id) {
    return NORTHWIND_DATA.violations.find((v) => v.id === id);
  }

  // --- Populate the static dropdowns from data ----------------------------

  function populateEmployees() {
    // Alphabetical by name for easy scanning.
    const sorted = [...NORTHWIND_DATA.employees].sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
    for (const emp of sorted) {
      const opt = document.createElement("option");
      opt.value = emp.employee_id;
      opt.textContent = `${emp.full_name} · ${emp.department} (${emp.employee_id})`;
      els.employeeSelect.appendChild(opt);
    }
  }

  // Populate the HR officer dropdown from NORTHWIND_DATA.hr_staff. Email is the
  // option value since it's unique per officer. Preserves the current selection
  // when possible (used after adding a new officer).
  function populateHrOfficers(selectEmail) {
    const prev = selectEmail || els.hrOfficerSelect.value;
    els.hrOfficerSelect.innerHTML = "";
    els.hrOfficerSelect.appendChild(new Option("— Select HR officer —", ""));
    for (const hr of NORTHWIND_DATA.hr_staff) {
      els.hrOfficerSelect.appendChild(new Option(`${hr.name} (${hr.title})`, hr.email));
    }
    if (prev) els.hrOfficerSelect.value = prev;
  }

  function findHrOfficer(email) {
    return NORTHWIND_DATA.hr_staff.find((h) => h.email === email);
  }

  // Mirror the selected officer into the read-only Name/Title/Email fields.
  function onHrOfficerChange() {
    const hr = findHrOfficer(els.hrOfficerSelect.value);
    els.hrName.value = hr ? hr.name : "";
    els.hrTitle.value = hr ? hr.title : "";
    els.hrEmail.value = hr ? hr.email : "";
  }

  // --- Add HR Staff modal -------------------------------------------------

  function openHrModal() {
    els.newHrName.value = "";
    els.newHrTitle.value = "";
    els.newHrEmail.value = "";
    els.hrModalError.classList.add("hidden");
    els.hrModal.classList.remove("hidden");
    els.newHrName.focus();
  }

  function closeHrModal() {
    els.hrModal.classList.add("hidden");
  }

  function addHrOfficer() {
    const name = els.newHrName.value.trim();
    const title = els.newHrTitle.value.trim();
    const email = els.newHrEmail.value.trim();

    const showErr = (msg) => {
      els.hrModalError.textContent = msg;
      els.hrModalError.classList.remove("hidden");
    };

    if (!name || !title || !email) return showErr("All three fields are required.");
    // Lightweight email sanity check — not RFC-perfect, just catches typos.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr("Please enter a valid email address.");
    if (findHrOfficer(email)) return showErr("An officer with that email already exists.");

    NORTHWIND_DATA.hr_staff.push({ name, title, email });
    populateHrOfficers(email);      // re-render and select the new officer
    onHrOfficerChange();
    closeHrModal();
  }

  function populateViolations() {
    for (const v of NORTHWIND_DATA.violations) {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.category;
      els.violationSelect.appendChild(opt);
    }
  }

  // --- Reactive handlers --------------------------------------------------

  function onEmployeeChange() {
    const emp = findEmployee(els.employeeSelect.value);
    if (!emp) {
      els.employeeDetails.classList.add("hidden");
      return;
    }
    // Auto-fill; all fields remain editable for corrections.
    els.empEmail.value = emp.email;
    els.empDepartment.value = emp.department;
    els.empPosition.value = emp.position;
    els.empStatus.value = emp.employment_status;
    els.supName.value = emp.supervisor_name;
    els.supEmail.value = emp.supervisor_email;
    els.employeeDetails.classList.remove("hidden");

    // Employment status affects the probationary consequence line, so refresh
    // the severity panel if a severity is already chosen.
    if (els.severitySelect.value) onSeverityChange();
  }

  function onViolationChange() {
    const v = findViolation(els.violationSelect.value);

    // Reset severity whenever the violation changes.
    els.severitySelect.innerHTML = "";
    els.severityInfo.classList.add("hidden");

    if (!v) {
      els.violationInfo.classList.add("hidden");
      els.severitySelect.disabled = true;
      els.severitySelect.appendChild(new Option("— Select a violation first —", ""));
      return;
    }

    // Reference panel: description + examples.
    els.violationDescription.textContent = v.description;
    els.violationExamples.innerHTML = "";
    for (const ex of v.examples) {
      const li = document.createElement("li");
      li.textContent = ex;
      els.violationExamples.appendChild(li);
    }
    els.violationInfo.classList.remove("hidden");

    // Severity dropdown: only the levels valid for this violation.
    const [min, max] = v.severity_range;
    els.severitySelect.appendChild(new Option("— Choose a severity level —", ""));
    for (let level = min; level <= max; level++) {
      const guideline = v.severity_guidelines[level] || "";
      els.severitySelect.appendChild(
        new Option(`Level ${level} — ${guideline}`, String(level))
      );
    }
    els.severitySelect.disabled = false;
  }

  function onSeverityChange() {
    const level = parseInt(els.severitySelect.value, 10);
    const v = findViolation(els.violationSelect.value);
    if (!v || Number.isNaN(level)) {
      els.severityInfo.classList.add("hidden");
      return;
    }

    // Badge: text + color band.
    els.severityBadge.textContent = `Level ${level} of ${v.severity_range[1]}`;
    els.severityBadge.className = "severity-badge " + severityVariant(level);

    els.severityGuideline.textContent = v.severity_guidelines[level] || "";
    els.monitoringPeriod.textContent = NORTHWIND_DATA.monitoring_periods[level].label;
    els.incentiveImpact.textContent = NORTHWIND_DATA.incentive_impact[level];

    // Probationary consequence only applies to probationary employees.
    const status = (els.empStatus.value || "").trim().toLowerCase();
    if (status === "probationary") {
      els.probationaryConsequence.textContent =
        NORTHWIND_DATA.probationary_consequences[level];
      els.probationaryBox.classList.remove("hidden");
    } else {
      els.probationaryBox.classList.add("hidden");
    }

    els.severityInfo.classList.remove("hidden");
  }

  // --- Email generation (Demo Mode) ---------------------------------------

  // Format an ISO yyyy-mm-dd (or Date) as "June 1, 2026". Falls back to the
  // raw string if it can't be parsed, so the email never shows "Invalid Date".
  function formatDate(value) {
    const d = value instanceof Date ? value : new Date(value + "T00:00:00");
    if (Number.isNaN(d.getTime())) return String(value || "");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function firstNameOf(fullName) {
    return (fullName || "").trim().split(/\s+/)[0] || "Employee";
  }

  // Clear all validation error states.
  function clearErrors() {
    [["errEmployee", "employeeSelect"], ["errViolation", "violationSelect"],
     ["errSeverity", "severitySelect"], ["errDescription", "incidentDescription"]]
      .forEach(([errId, fieldId]) => {
        els[errId].classList.add("hidden");
        els[fieldId].classList.remove("input-error");
      });
  }

  // Returns true if all required fields are filled; otherwise shows inline
  // errors next to the offending fields and returns false.
  function validate() {
    clearErrors();
    let ok = true;
    const fail = (errId, fieldId) => {
      els[errId].classList.remove("hidden");
      els[fieldId].classList.add("input-error");
      ok = false;
    };
    if (!els.employeeSelect.value) fail("errEmployee", "employeeSelect");
    if (!els.violationSelect.value) fail("errViolation", "violationSelect");
    if (!els.severitySelect.value) fail("errSeverity", "severitySelect");
    if (!els.incidentDescription.value.trim()) fail("errDescription", "incidentDescription");
    return ok;
  }

  // Build the editable body text, templated by severity band. Placeholders are
  // filled from the assembled context. Body runs from greeting to closing; the
  // signature block is rendered/appended separately.
  function buildBodyText(ctx) {
    const intro =
      `Dear ${ctx.firstName},\n\n` +
      `This letter serves as a formal Notice to Explain regarding a matter concerning ${ctx.category}, ` +
      `recorded on ${ctx.incidentDateLong}. It has been documented as a Level ${ctx.level} of ${ctx.maxLevel} concern under company policy.\n\n` +
      `The specific circumstances reported are as follows:\n${ctx.incidentDescription}\n`;

    const consequences =
      `\nIn connection with this notice, a ${ctx.monitoringLower} will apply. Regarding incentives: ${ctx.incentive} ` +
      (ctx.probationary ? `As you are currently under probationary status, please also note: ${ctx.probationary} ` : "") +
      `You are requested to submit a written explanation within ${ctx.deadlineDays} calendar days of receiving this notice.\n`;

    let stance;
    if (ctx.band === "low") {
      stance =
        `\nWhile this matter is assessed at a lower severity level, it is being formally documented to maintain consistency ` +
        `and to provide you the opportunity to share your account of the circumstances.\n`;
    } else if (ctx.band === "mid") {
      stance =
        `\nThis matter is regarded as a significant concern. You are asked to provide a full account of the circumstances ` +
        `so that the matter can be reviewed fairly and in accordance with company policy.\n`;
    } else {
      stance =
        `\nThis matter is regarded with the utmost seriousness and is subject to formal review. ` +
        `You are asked to provide a complete account of the circumstances, which will be carefully considered before any further determination is made.\n`;
    }

    const closing =
      `\nPlease be advised that this notice is an opportunity for you to explain the circumstances; it is not a final determination. ` +
      `Should you wish to provide context or have any questions, you may contact the Human Resources department directly. ` +
      `Your written response will be reviewed before any further action is considered.\n`;

    return intro + stance + consequences + closing;
  }

  // Assemble the structured incident context from current form state.
  function assembleContext() {
    const emp = findEmployee(els.employeeSelect.value);
    const v = findViolation(els.violationSelect.value);
    const level = parseInt(els.severitySelect.value, 10);
    const band = level <= 2 ? "low" : level <= 4 ? "mid" : "high";
    const isProbationary = (els.empStatus.value || "").trim().toLowerCase() === "probationary";
    const monitoringLabel = NORTHWIND_DATA.monitoring_periods[level].label;

    const hrName = els.hrName.value.trim() || "[HR Officer Name]";
    const hrTitle = els.hrTitle.value.trim() || "[HR Officer Title]";

    return {
      firstName: firstNameOf(emp.full_name),
      fullName: emp.full_name,
      employeeId: emp.employee_id,
      department: els.empDepartment.value.trim(),
      position: els.empPosition.value.trim(),
      employmentStatus: els.empStatus.value.trim(),
      supName: els.supName.value.trim(),
      category: v.category,
      violationId: v.id,
      violationDescription: v.description,
      severityGuideline: v.severity_guidelines[level] || "",
      level,
      maxLevel: v.severity_range[1],
      band,
      monitoringLabel,
      monitoringLower: monitoringLabel.charAt(0).toLowerCase() + monitoringLabel.slice(1),
      incentive: NORTHWIND_DATA.incentive_impact[level],
      probationary: isProbationary ? NORTHWIND_DATA.probationary_consequences[level] : null,
      incidentDescription: els.incidentDescription.value.trim(),
      additionalNotes: els.additionalNotes.value.trim(),
      incidentDateLong: formatDate(els.incidentDate.value),
      noticeDateLong: formatDate(new Date()),
      deadlineDays: EXPEDITED_VIOLATIONS.has(v.id) ? 3 : 5,
      empEmail: els.empEmail.value.trim(),
      supEmail: els.supEmail.value.trim(),
      hrEmail: els.hrEmail.value.trim(),
      hrName,
      hrTitle,
    };
  }

  // Render the assembled context into the email panel. bodyText is the email
  // body (greeting..closing) — demo template or AI output.
  function renderEmail(ctx, bodyText) {
    els.outTo.textContent = ctx.empEmail;
    els.outCc.textContent = [ctx.supEmail, ctx.hrEmail].filter(Boolean).join("; ");
    els.outFrom.textContent = ctx.hrName;
    els.outDate.textContent = ctx.noticeDateLong;
    els.outSubject.textContent = `Notice to Explain — ${ctx.category} (Severity Level ${ctx.level})`;

    els.emailBadge.textContent = `Level ${ctx.level} of ${ctx.maxLevel}`;
    els.emailBadge.className = "severity-badge " + severityVariant(ctx.level);
    els.outMonitoring.textContent = ctx.monitoringLabel;
    els.outIncentive.textContent = ctx.incentive;

    if (ctx.probationary) {
      els.outProbationary.textContent = ctx.probationary;
      els.outProbationaryBox.classList.remove("hidden");
    } else {
      els.outProbationaryBox.classList.add("hidden");
    }

    els.emailBody.value = bodyText;
    els.outSigName.textContent = ctx.hrName;
    els.outSigTitle.textContent = ctx.hrTitle;
  }

  // Build the structured incident context as the user message for the API.
  function buildUserMessage(ctx) {
    const lines = [
      "Draft the NTE email body for the following incident.",
      "",
      "EMPLOYEE",
      `- Name: ${ctx.fullName} (${ctx.employeeId})`,
      `- Department: ${ctx.department}`,
      `- Position: ${ctx.position}`,
      `- Employment status: ${ctx.employmentStatus}`,
      "",
      "SUPERVISOR",
      `- Name: ${ctx.supName}`,
      "",
      "HR OFFICER (signs the notice)",
      `- Name: ${ctx.hrName}`,
      `- Title: ${ctx.hrTitle}`,
      "",
      "VIOLATION",
      `- Category: ${ctx.category}`,
      `- Description: ${ctx.violationDescription}`,
      `- Severity level: ${ctx.level} of ${ctx.maxLevel}`,
      `- Severity guideline: ${ctx.severityGuideline}`,
      "",
      "CONSEQUENCES",
      `- Monitoring period: ${ctx.monitoringLabel}`,
      `- Incentive impact: ${ctx.incentive}`,
      ctx.probationary ? `- Probationary consequence: ${ctx.probationary}` : "- Probationary consequence: N/A (regular employee)",
      `- Response deadline: ${ctx.deadlineDays} calendar days`,
      "",
      "INCIDENT",
      `- Date of incident: ${ctx.incidentDateLong}`,
      `- Date of notice: ${ctx.noticeDateLong}`,
      `- HR's description of what happened: ${ctx.incidentDescription}`,
    ];
    if (ctx.additionalNotes) lines.push(`- Additional notes: ${ctx.additionalNotes}`);
    return lines.join("\n");
  }

  // --- Mode badge / loading / notice helpers ------------------------------

  function setModeBadge(kind) {
    if (kind === "ai") {
      els.emailModeBadge.textContent = "✨ AI-generated";
      els.emailModeBadge.className = "text-xs font-semibold px-2 py-1 rounded bg-green-400 text-green-950";
    } else {
      els.emailModeBadge.textContent = "📋 Demo template";
      els.emailModeBadge.className = "text-xs font-semibold px-2 py-1 rounded bg-amber-400 text-navy-dark";
    }
  }

  function showLoading(on) {
    els.emailLoading.classList.toggle("hidden", !on);
    els.emailDocument.classList.toggle("hidden", on);
    els.emailActions.classList.toggle("hidden", on);
  }

  function showNotice(msg) {
    els.genNotice.textContent = msg;
    els.genNotice.classList.remove("hidden");
  }

  function hideNotice() {
    els.genNotice.classList.add("hidden");
  }

  // Render the demo-templated email. Demo body stops before the signature, so
  // we show the separate signature block.
  function renderDemo(ctx) {
    renderEmail(ctx, buildBodyText(ctx));
    lastRenderKind = "demo";
    els.emailSignature.classList.remove("hidden");
    setModeBadge("demo");
  }

  async function onGenerate() {
    if (!validate()) {
      els.emailPanel.classList.add("hidden");
      const firstErr = document.querySelector(".error-msg:not(.hidden)");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const ctx = assembleContext();
    hideNotice();
    els.emailPanel.classList.remove("hidden");
    els.emailPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    if (appState.mode === "live") {
      await generateLive(ctx);
    } else {
      showLoading(false);
      renderDemo(ctx);
    }
  }

  // Live AI generation, with graceful fallback to the demo template so the user
  // is never left with a broken/empty panel.
  async function generateLive(ctx) {
    // No key → don't even attempt a call; fall back with a clear pointer.
    if (!appState.apiKey) {
      showLoading(false);
      renderDemo(ctx);
      showNotice("Live AI mode is on but no API key is set. Open Settings (⚙️) to add one. Showing the demo template for now.");
      return;
    }

    showLoading(true);
    try {
      const text = await callClaudeAPI(SYSTEM_PROMPT, buildUserMessage(ctx), appState.apiKey);
      showLoading(false);
      renderEmail(ctx, text);
      // AI output already ends with its own signature — hide the static block
      // so it isn't duplicated on screen, in copy, in download, or in print.
      lastRenderKind = "ai";
      els.emailSignature.classList.add("hidden");
      setModeBadge("ai");
      hideNotice();
    } catch (err) {
      // Fall back to the demo template and tell the user why.
      showLoading(false);
      renderDemo(ctx);
      showNotice("Live AI generation failed (" + err.message + "). Falling back to the demo template.");
    }
  }

  // Build the full email as clean plain text (header + body + signature) for
  // copy/download — formatted to paste cleanly into Outlook/Gmail.
  function buildPlainText() {
    const headerLines = [
      `TO: ${els.outTo.textContent}`,
      `CC: ${els.outCc.textContent}`,
      `FROM: ${els.outFrom.textContent}`,
      `DATE: ${els.outDate.textContent}`,
      `SUBJECT: ${els.outSubject.textContent}`,
    ];
    // Body textarea holds greeting..closing; normalize trailing whitespace.
    const body = els.emailBody.value.replace(/\s+$/, "");

    // AI output already contains its own signature; only append ours for demo.
    if (lastRenderKind === "ai") {
      return headerLines.join("\n") + "\n\n" + body + "\n";
    }
    const signature = [
      "Sincerely,",
      "",
      els.outSigName.textContent,
      els.outSigTitle.textContent,
      "Northwind Solutions HR Department",
    ];
    return headerLines.join("\n") + "\n\n" + body + "\n\n" + signature.join("\n") + "\n";
  }

  function onCopy() {
    const text = buildPlainText();
    const flash = (msg) => {
      const orig = els.copyBtn.textContent;
      els.copyBtn.textContent = msg;
      setTimeout(() => { els.copyBtn.textContent = orig; }, 1500);
    };
    // navigator.clipboard may be unavailable under file:// (not a secure
    // context in some browsers), so fall back to execCommand.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash("Copied!"), () => legacyCopy(text, flash));
    } else {
      legacyCopy(text, flash);
    }
  }

  function legacyCopy(text, flash) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    document.body.removeChild(ta);
    flash(ok ? "Copied!" : "Press Ctrl+C");
  }

  function onDownload() {
    const text = buildPlainText();
    const empId = els.employeeSelect.value || "employee";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NTE_${empId}_${els.incidentDate.value || "draft"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onReset() {
    // Clear the whole form and hide the email panel. HR officer returns to the
    // default selection rather than blank.
    selectDefaultHrOfficer();
    els.employeeSelect.value = "";
    els.employeeDetails.classList.add("hidden");
    ["empEmail","empDepartment","empPosition","empStatus","supName","supEmail"]
      .forEach((id) => { els[id].value = ""; });
    els.violationSelect.value = "";
    els.violationInfo.classList.add("hidden");
    els.severitySelect.innerHTML = "";
    els.severitySelect.appendChild(new Option("— Select a violation first —", ""));
    els.severitySelect.disabled = true;
    els.severityInfo.classList.add("hidden");
    els.incidentDescription.value = "";
    els.additionalNotes.value = "";
    clearErrors();
    hideNotice();
    showLoading(false);
    els.emailPanel.classList.add("hidden");
    setDefaultDate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- Settings panel -----------------------------------------------------

  // Reflect current appState into the header pill.
  function updateHeaderStatus() {
    if (appState.mode === "live" && appState.apiKey) {
      els.headerStatus.textContent = "🟢 Live AI";
    } else if (appState.mode === "live") {
      els.headerStatus.textContent = "🟡 Live AI (no key)";
    } else {
      els.headerStatus.textContent = "🟡 Demo Mode";
    }
  }

  function openSettings() {
    // Seed the panel controls from current state.
    els.modeToggle.checked = appState.mode === "live";
    els.modeToggleLabel.textContent = appState.mode === "live" ? "Live AI Mode" : "Demo Mode";
    els.apiKeyInput.value = appState.apiKey;
    els.apiKeyInput.type = "password";
    els.testResult.classList.add("hidden");
    els.settingsPanel.classList.remove("hidden");
  }

  function closeSettings() {
    els.settingsPanel.classList.add("hidden");
  }

  function onModeToggleChange() {
    els.modeToggleLabel.textContent = els.modeToggle.checked ? "Live AI Mode" : "Demo Mode";
  }

  function toggleKeyVisibility() {
    els.apiKeyInput.type = els.apiKeyInput.type === "password" ? "text" : "password";
  }

  function saveSettings() {
    appState.mode = els.modeToggle.checked ? "live" : "demo";
    appState.apiKey = els.apiKeyInput.value.trim();
    updateHeaderStatus();
    closeSettings();
  }

  // Tiny verification call (~5-10 tokens). Uses whatever key is currently typed
  // (not necessarily saved) so the user can verify before committing.
  async function testConnection() {
    const key = els.apiKeyInput.value.trim();
    const show = (msg, ok) => {
      els.testResult.textContent = msg;
      els.testResult.className = "mt-2 text-sm " + (ok ? "text-green-700" : "text-red-700");
      els.testResult.classList.remove("hidden");
    };
    if (!key) return show("Enter an API key first.", false);

    els.testConnBtn.disabled = true;
    const original = els.testConnBtn.textContent;
    els.testConnBtn.textContent = "Testing…";
    try {
      await callClaudeAPI("You are a connection test.", "Reply with the single word: OK", key, { maxTokens: 10 });
      show("✓ Connection successful — key works.", true);
    } catch (err) {
      show("✗ " + err.message, false);
    } finally {
      els.testConnBtn.disabled = false;
      els.testConnBtn.textContent = original;
    }
  }

  // Default to the demo user (John Rico Bustos) if present, else the first
  // officer. Then mirror into the read-only fields.
  function selectDefaultHrOfficer() {
    const demo = NORTHWIND_DATA.hr_staff.find((h) => h.email === "john.bustos@northwindsolutions.com");
    const fallback = NORTHWIND_DATA.hr_staff[0];
    els.hrOfficerSelect.value = (demo || fallback || {}).email || "";
    onHrOfficerChange();
  }

  function setDefaultDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    els.incidentDate.value = `${yyyy}-${mm}-${dd}`;
  }

  // --- Init ---------------------------------------------------------------

  function init() {
    populateEmployees();
    populateViolations();
    populateHrOfficers();
    selectDefaultHrOfficer();

    // HR officer selector + Add-staff modal
    els.hrOfficerSelect.addEventListener("change", onHrOfficerChange);
    els.editHrBtn.addEventListener("click", openHrModal);
    els.addHrBtn.addEventListener("click", addHrOfficer);
    els.closeHrBtn.addEventListener("click", closeHrModal);
    els.hrModalBackdrop.addEventListener("click", closeHrModal);

    els.employeeSelect.addEventListener("change", onEmployeeChange);
    els.violationSelect.addEventListener("change", onViolationChange);
    els.severitySelect.addEventListener("change", onSeverityChange);

    // Email generation + actions
    els.generateBtn.addEventListener("click", onGenerate);
    els.copyBtn.addEventListener("click", onCopy);
    els.downloadBtn.addEventListener("click", onDownload);
    els.printBtn.addEventListener("click", () => window.print());

    // Keep the print-only body mirror in sync with the editable textarea.
    window.addEventListener("beforeprint", () => {
      const mirror = document.getElementById("emailBodyPrint");
      if (mirror) mirror.textContent = els.emailBody.value;
    });
    els.resetBtn.addEventListener("click", onReset);

    // Settings panel
    els.gearBtn.addEventListener("click", openSettings);
    els.closeSettingsBtn.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", closeSettings);
    els.modeToggle.addEventListener("change", onModeToggleChange);
    els.toggleKeyVisBtn.addEventListener("click", toggleKeyVisibility);
    els.testConnBtn.addEventListener("click", testConnection);
    els.saveSettingsBtn.addEventListener("click", saveSettings);
    updateHeaderStatus();

    // Clear a field's error as soon as the user addresses it.
    els.employeeSelect.addEventListener("change", () => {
      els.errEmployee.classList.add("hidden");
      els.employeeSelect.classList.remove("input-error");
    });
    els.violationSelect.addEventListener("change", () => {
      els.errViolation.classList.add("hidden");
      els.violationSelect.classList.remove("input-error");
    });
    els.severitySelect.addEventListener("change", () => {
      els.errSeverity.classList.add("hidden");
      els.severitySelect.classList.remove("input-error");
    });
    els.incidentDescription.addEventListener("input", () => {
      if (els.incidentDescription.value.trim()) {
        els.errDescription.classList.add("hidden");
        els.incidentDescription.classList.remove("input-error");
      }
    });

    setDefaultDate();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
