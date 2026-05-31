# Northwind Incident Report Generator — Project Blueprint

> This document is the single source of truth for the Incident Report Generator project. It describes what the app does, how it works, and how it should be built. Use this as the master spec when building the app.

---

## 🎯 What the App Does

A web-based tool for HR personnel at Northwind Solutions to generate professional, AI-drafted incident report emails (Notices to Explain / NTEs) for employee violations. The user fills in a simple form, the app generates a polished email draft, and the user can edit or copy it before sending.

**The single sentence pitch:** Pick an employee, pick a violation, pick a severity, get a professional NTE email in seconds.

---

## 👥 Who Uses It

- **Primary user:** HR personnel and supervisors at Northwind Solutions
- **Use case:** Quickly draft consistent, well-worded incident reports without having to write each one from scratch
- **Pain it solves:** Manually writing NTEs is time-consuming, inconsistent in tone, and prone to missing important consequences (monitoring periods, incentive impact, probationary clauses)

---

## 🖥️ The User Experience (Step by Step)

### Screen 1: HR User Input (Top of Page)
HR types their own info — this stays consistent across the session:
- **HR Officer Name** (text input)
- **HR Officer Title** (text input, e.g., "HR Specialist", "HR Director")

### Screen 2: Incident Details (Main Form)
Fillable form with:

1. **Select Employee** (searchable dropdown, pulls from `employees.json`)
   - When selected, auto-displays: employee email, department, position, supervisor name, supervisor email, employment status
   - All auto-displayed fields are editable in case of corrections

2. **Select Violation Category** (dropdown, pulls from `violations.json`)
   - 6 options: Attendance & Punctuality, Performance & Productivity, Policy Violations, Misconduct & Behavior, Harassment & Discrimination, Fraud & Integrity Violations
   - When selected, shows the description and example list below the dropdown for HR reference

3. **Select Severity Level** (dropdown, 1-6)
   - Only shows severity levels valid for the selected violation (e.g., Harassment only shows 3-6)
   - When selected, shows the severity guideline text below
   - Also displays the monitoring period and incentive impact that will apply

4. **Incident Description** (large text area)
   - HR types specific details of what happened — the AI will use this to write the email body
   - Placeholder text: "Describe the specific incident, including date, time, location, and observable behavior. Be factual and avoid interpretation."

5. **Date of Incident** (date picker, defaults to today)

6. **Additional Notes** (optional text area, for supervisor's notes or context)

### Screen 3: Generate Email Button
Big primary action button: **"Generate NTE Email"**

When clicked:
- App constructs a prompt with all the info above
- Sends it to the Claude API
- Receives a drafted email
- Displays the result in Screen 4

### Screen 4: Generated Email Output

Layout:
- **Header section (top of email)**: To, From, Subject, Date, with a sidebar showing severity level, monitoring period, and incentive impact (visual badge style)
- **Body section**: The AI-drafted email body
- **Signature section**: HR officer name, title, "Northwind Solutions HR Department"

All fields are editable inline (it's a draft, not a final).

Action buttons:
- **Copy to Clipboard**
- **Download as .txt**
- **Print / Save as PDF** (browser print dialog)
- **Reset Form** (start over)

---

## 📋 Email Structure (The Template the AI Fills In)

Every email should follow this structure:

```
TO: [employee.email]
CC: [supervisor.email]; [hr_officer.email]
FROM: [hr_officer.name]
DATE: [date_of_notice]
SUBJECT: Notice to Explain — [violation_category] (Severity Level [X])

────────────────────────────────────────────────
INCIDENT SUMMARY
────────────────────────────────────────────────
Employee: [full_name] ([employee_id])
Department: [department]
Position: [position]
Employment Status: [Regular / Probationary]
Violation Type: [violation_category]
Severity Level: [X] of [max_for_category]
Date of Incident: [date]
────────────────────────────────────────────────

[Greeting — "Dear [first_name],"]

[Opening paragraph — formal acknowledgment that this is an NTE, citing the violation category and date of incident]

[Body paragraph 1 — factual description of the incident, derived from HR's incident description input. Professional, neutral tone, no interpretation or judgment.]

[Body paragraph 2 — citation of the specific company policy violated, and reference to the severity level guideline]

[Consequences paragraph — clearly states:
  - The monitoring period
  - The incentive impact
  - Any probationary consequences (if applicable)
  - Required response from employee (within 5 days, or 3 days for harassment/fraud)]

[Closing paragraph — clear statement of next steps, reminder of right to respond, contact info for clarification]

Sincerely,

[HR Officer Name]
[HR Officer Title]
Northwind Solutions HR Department
[hr_officer.email]
```

---

## 🧠 The AI Prompt (System Prompt for Claude API)

The app should send this prompt to Claude with all the variables filled in:

```
You are an HR communications specialist at Northwind Solutions, a professional services company. Your job is to draft a formal, legally-compliant Notice to Explain (NTE) email for an employee incident.

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
Return only the email body, starting with "Dear [first name]," and ending with the signature block. Do not include the TO/FROM/SUBJECT header — the application handles that separately.
```

---

## 🔌 Technical Architecture

### Tech Stack
- **HTML / CSS / JavaScript** — vanilla, no framework needed for a single-page tool
- **Tailwind CSS** via CDN — for styling
- **Claude API** (Anthropic) — for email generation
- **GitHub Pages** — for hosting the live demo

### File Structure
```
incident-report-generator/
├── index.html              # The main app page
├── style.css               # Custom styles beyond Tailwind
├── app.js                  # Main app logic
├── api.js                  # Claude API integration
├── data/
│   ├── employees.json      # Northwind employee directory
│   └── violations.json     # Violation catalog
├── assets/
│   └── logo.svg            # Optional: Northwind branding
├── README.md               # Project documentation
├── LICENSE                 # MIT
└── .gitignore              # Ignore API keys, node_modules, etc.
```

### How API Authentication Works (Demo Mode + Bring Your Own Key)

The app should support TWO modes:

**Mode 1: Demo Mode (default — no API key needed)**
- The app comes with 3-4 pre-written sample email outputs
- When user clicks "Generate" without an API key, it returns one of these samples (matched roughly to the selected violation category)
- Clearly labeled in the UI: "Demo Mode — sample output. Add an API key for real AI generation."
- This way the GitHub Pages demo works for anyone, no setup needed

**Mode 2: Real AI Mode**
- User clicks a "Settings" icon → enters their Anthropic API key
- Key is stored in browser memory only (NOT localStorage, NOT a file — just in-memory JS variable)
- App calls Claude API directly from the browser
- When the tab is closed, the key is gone — user enters again next session
- Security note in the UI: "Your API key is never stored or sent anywhere except directly to Anthropic."

### The Claude API Call

```javascript
// Pseudo-code structure
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": userApiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: structuredIncidentData }
    ]
  })
});
```

---

## 🎨 Design Direction

- **Professional but not boring** — think modern HR software, not a 1990s form
- **Clean white/light gray background** — easy on the eyes for office use
- **Northwind navy blue** (#1e3a5f) as the primary brand color
- **Severity badges** with color coding:
  - L1-2: Yellow / Amber (warning)
  - L3-4: Orange (serious)
  - L5-6: Red (severe)
- **Sans-serif font** — Inter or system default
- **Responsive layout** — must work on a standard laptop screen
- **Subtle animations** — fade-in for generated content, smooth transitions

---

## ✅ Definition of Done

The project is complete when:

1. ✅ App loads on GitHub Pages (live URL works)
2. ✅ Form correctly populates from `employees.json` and `violations.json`
3. ✅ Selecting an employee auto-fills supervisor info
4. ✅ Selecting a violation only shows valid severity levels
5. ✅ Severity selection auto-displays monitoring period and incentive impact
6. ✅ "Generate Email" button works in Demo Mode (no key needed)
7. ✅ Adding an API key triggers real Claude API calls
8. ✅ Generated email is editable in-place
9. ✅ Copy, Download, Print, and Reset buttons all work
10. ✅ README.md explains what the app does, how to use it, and includes screenshots
11. ✅ Repo is public on GitHub
12. ✅ MIT license included

---

## 🚀 Future Enhancements (Post-MVP — Don't Build Yet)

- Multi-language support (English + Filipino)
- History view (track previously generated NTEs in localStorage)
- Template library (different email styles for different industries)
- Integration with Outlook / Gmail (send directly from app)
- Bulk generation (multiple employees at once)
- PDF export with letterhead

---

## 📝 Notes for the Builder

- This is a **portfolio project** — code quality and documentation matter as much as features
- Comments in code should explain WHY decisions were made, not just WHAT the code does
- The README is the front page — invest time there
- Take screenshots of the working app for the README
- Make at least 5-7 commits with meaningful messages (don't just push one giant commit)
- The data files are fictional — all employee names, IDs, and emails are made up

---

*Created: May 2026 — Northwind Incident Report Generator project blueprint*
