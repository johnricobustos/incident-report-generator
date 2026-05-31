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
  };

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

  // --- Init ---------------------------------------------------------------

  function init() {
    populateEmployees();
    populateViolations();

    els.employeeSelect.addEventListener("change", onEmployeeChange);
    els.violationSelect.addEventListener("change", onViolationChange);
    els.severitySelect.addEventListener("change", onSeverityChange);

    // Default incident date to today (local time).
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    els.incidentDate.value = `${yyyy}-${mm}-${dd}`;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
