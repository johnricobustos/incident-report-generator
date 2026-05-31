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
    hrName: document.getElementById("hrName"),
    hrTitle: document.getElementById("hrTitle"),

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
    outSigName: document.getElementById("outSigName"),
    outSigTitle: document.getElementById("outSigTitle"),

    // Action buttons
    copyBtn: document.getElementById("copyBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    printBtn: document.getElementById("printBtn"),
    resetBtn: document.getElementById("resetBtn"),
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
      category: v.category,
      violationId: v.id,
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
      hrEmail: NORTHWIND_DATA.company.hr_department.email,
      hrName,
      hrTitle,
    };
  }

  // Render the assembled context into the email panel.
  function renderEmail(ctx) {
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

    els.emailBody.value = buildBodyText(ctx);
    els.outSigName.textContent = ctx.hrName;
    els.outSigTitle.textContent = ctx.hrTitle;
  }

  function onGenerate() {
    if (!validate()) {
      // Surface the first error to the user.
      els.emailPanel.classList.add("hidden");
      const firstErr = document.querySelector(".error-msg:not(.hidden)");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const ctx = assembleContext();
    renderEmail(ctx);
    // Re-trigger the fade-in animation by toggling hidden off after a frame.
    els.emailPanel.classList.remove("hidden");
    els.emailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const signature = [
      "Sincerely,",
      "",
      els.outSigName.textContent,
      els.outSigTitle.textContent,
      "Northwind Solutions HR Department",
    ];
    // Body textarea holds greeting..closing; normalize trailing whitespace.
    const body = els.emailBody.value.replace(/\s+$/,"");
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
    // Clear the whole form and hide the email panel.
    els.hrName.value = "";
    els.hrTitle.value = "";
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
    els.emailPanel.classList.add("hidden");
    setDefaultDate();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
