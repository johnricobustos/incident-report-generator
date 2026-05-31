/*
 * data.js — Embedded data layer for the Northwind Incident Report Generator.
 *
 * WHY this file exists (and isn't just a fetch of data/*.json):
 * The app must run by double-clicking index.html (file:// protocol). Browsers
 * block fetch()/XHR of local JSON files under file:// for security (CORS), so
 * loading data/employees.json at runtime would fail with no local web server.
 * Embedding the data as a plain JS object sidesteps that entirely — a classic
 * <script> tag has no such restriction. The data here mirrors the canonical
 * JSON files in data/; if those change, regenerate this file.
 *
 * Top-level `const` in a classic script is shared across all classic scripts on
 * the page, so app.js can read NORTHWIND_DATA directly.
 */
const NORTHWIND_DATA = {
  company: {
    name: "Northwind Solutions",
    domain: "northwindsolutions.com",
    hr_department: {
      head: "Patricia Bennett",
      email: "patricia.bennett@northwindsolutions.com",
    },
  },

  // Lookup tables keyed by severity level (1-6).
  monitoring_periods: {
    1: { days: 30, label: "30-day monitoring period" },
    2: { days: 60, label: "60-day monitoring period" },
    3: { days: 90, label: "90-day monitoring period" },
    4: { days: 120, label: "120-day monitoring period" },
    5: { days: 180, label: "180-day monitoring period" },
    6: { days: null, label: "Permanent record — termination review initiated" },
  },

  incentive_impact: {
    1: "Logged on record. No impact on monthly incentives.",
    2: "50% incentive deduction for the month of violation.",
    3: "Employee is ineligible for any incentives during the 90-day monitoring period.",
    4: "Employee is ineligible for incentives during the 120-day monitoring period and ineligible for the next quarterly bonus.",
    5: "Employee is ineligible for incentives for 180 days and ineligible for promotion consideration for one (1) full year from the date of this notice.",
    6: "All pending and future incentives are forfeited. Employee is referred to HR for a termination review interview.",
  },

  probationary_consequences: {
    1: "Violation logged. No change to probationary status.",
    2: "Violation logged. Probationary supervisor must conduct a formal coaching session within 7 days.",
    3: "Employee is flagged for non-regularization review. Regularization will be reassessed at the end of probation.",
    4: "Employee receives a no-recommendation for regularization. Contract review required before probation ends.",
    5: "Probationary contract is subject to immediate review by HR. Continued employment is not guaranteed.",
    6: "Probationary contract is terminated, subject to HR interview and due process.",
  },

  employees: [
    { employee_id: "EMP-1001", full_name: "Marcus Chen", email: "marcus.chen@northwindsolutions.com", department: "Operations", position: "Operations Manager", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2022-03-15", employment_status: "Regular" },
    { employee_id: "EMP-1002", full_name: "Sofia Rodriguez", email: "sofia.rodriguez@northwindsolutions.com", department: "Customer Service", position: "Customer Service Representative", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2024-08-22", employment_status: "Regular" },
    { employee_id: "EMP-1003", full_name: "James Okonkwo", email: "james.okonkwo@northwindsolutions.com", department: "Customer Service", position: "Senior Customer Service Rep", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2021-11-08", employment_status: "Regular" },
    { employee_id: "EMP-1004", full_name: "Aisha Patel", email: "aisha.patel@northwindsolutions.com", department: "Sales", position: "Sales Associate", supervisor_name: "Robert Hayes", supervisor_email: "robert.hayes@northwindsolutions.com", date_hired: "2025-09-01", employment_status: "Probationary" },
    { employee_id: "EMP-1005", full_name: "Daniel Kim", email: "daniel.kim@northwindsolutions.com", department: "Customer Service", position: "Customer Service Supervisor", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2020-06-10", employment_status: "Regular" },
    { employee_id: "EMP-1006", full_name: "Olivia Thompson", email: "olivia.thompson@northwindsolutions.com", department: "Finance", position: "Junior Accountant", supervisor_name: "Linda Foster", supervisor_email: "linda.foster@northwindsolutions.com", date_hired: "2024-02-14", employment_status: "Regular" },
    { employee_id: "EMP-1007", full_name: "Rashid Al-Mahmoud", email: "rashid.al-mahmoud@northwindsolutions.com", department: "IT", position: "IT Support Specialist", supervisor_name: "Karen Whitfield", supervisor_email: "karen.whitfield@northwindsolutions.com", date_hired: "2023-07-19", employment_status: "Regular" },
    { employee_id: "EMP-1008", full_name: "Emma Larsen", email: "emma.larsen@northwindsolutions.com", department: "Operations", position: "Operations Analyst", supervisor_name: "Marcus Chen", supervisor_email: "marcus.chen@northwindsolutions.com", date_hired: "2023-04-03", employment_status: "Regular" },
    { employee_id: "EMP-1009", full_name: "Tyrone Jackson", email: "tyrone.jackson@northwindsolutions.com", department: "Customer Service", position: "Customer Service Representative", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2025-10-15", employment_status: "Probationary" },
    { employee_id: "EMP-1010", full_name: "Linda Foster", email: "linda.foster@northwindsolutions.com", department: "Finance", position: "Finance Manager", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2019-09-23", employment_status: "Regular" },
    { employee_id: "EMP-1011", full_name: "Mei Lin Wang", email: "mei.wang@northwindsolutions.com", department: "Sales", position: "Sales Representative", supervisor_name: "Robert Hayes", supervisor_email: "robert.hayes@northwindsolutions.com", date_hired: "2022-12-05", employment_status: "Regular" },
    { employee_id: "EMP-1012", full_name: "Brandon Walsh", email: "brandon.walsh@northwindsolutions.com", department: "Operations", position: "Logistics Coordinator", supervisor_name: "Marcus Chen", supervisor_email: "marcus.chen@northwindsolutions.com", date_hired: "2024-05-20", employment_status: "Regular" },
    { employee_id: "EMP-1013", full_name: "Priya Nair", email: "priya.nair@northwindsolutions.com", department: "IT", position: "Software Developer", supervisor_name: "Karen Whitfield", supervisor_email: "karen.whitfield@northwindsolutions.com", date_hired: "2023-01-30", employment_status: "Regular" },
    { employee_id: "EMP-1014", full_name: "Robert Hayes", email: "robert.hayes@northwindsolutions.com", department: "Sales", position: "Sales Manager", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2018-11-12", employment_status: "Regular" },
    { employee_id: "EMP-1015", full_name: "Yuki Tanaka", email: "yuki.tanaka@northwindsolutions.com", department: "Customer Service", position: "Customer Service Representative", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2024-11-04", employment_status: "Regular" },
    { employee_id: "EMP-1016", full_name: "Carlos Mendoza", email: "carlos.mendoza@northwindsolutions.com", department: "Operations", position: "Warehouse Associate", supervisor_name: "Brandon Walsh", supervisor_email: "brandon.walsh@northwindsolutions.com", date_hired: "2025-07-10", employment_status: "Probationary" },
    { employee_id: "EMP-1017", full_name: "Karen Whitfield", email: "karen.whitfield@northwindsolutions.com", department: "IT", position: "IT Director", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2017-04-18", employment_status: "Regular" },
    { employee_id: "EMP-1018", full_name: "Nadia Ibrahim", email: "nadia.ibrahim@northwindsolutions.com", department: "HR", position: "HR Specialist", supervisor_name: "Patricia Bennett", supervisor_email: "patricia.bennett@northwindsolutions.com", date_hired: "2023-09-25", employment_status: "Regular" },
    { employee_id: "EMP-1019", full_name: "Connor O'Brien", email: "connor.obrien@northwindsolutions.com", department: "Sales", position: "Sales Associate", supervisor_name: "Robert Hayes", supervisor_email: "robert.hayes@northwindsolutions.com", date_hired: "2024-06-17", employment_status: "Regular" },
    { employee_id: "EMP-1020", full_name: "Fatima Hassan", email: "fatima.hassan@northwindsolutions.com", department: "Finance", position: "Accounts Payable Clerk", supervisor_name: "Linda Foster", supervisor_email: "linda.foster@northwindsolutions.com", date_hired: "2024-03-08", employment_status: "Regular" },
    { employee_id: "EMP-1021", full_name: "Devon Mitchell", email: "devon.mitchell@northwindsolutions.com", department: "Customer Service", position: "Customer Service Representative", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2025-11-12", employment_status: "Probationary" },
    { employee_id: "EMP-1022", full_name: "Isabella Romano", email: "isabella.romano@northwindsolutions.com", department: "Operations", position: "Quality Assurance Analyst", supervisor_name: "Marcus Chen", supervisor_email: "marcus.chen@northwindsolutions.com", date_hired: "2022-08-29", employment_status: "Regular" },
    { employee_id: "EMP-1023", full_name: "Patricia Bennett", email: "patricia.bennett@northwindsolutions.com", department: "HR", position: "HR Director", supervisor_name: "Executive Office", supervisor_email: "executive@northwindsolutions.com", date_hired: "2016-02-01", employment_status: "Regular" },
    { employee_id: "EMP-1024", full_name: "Ahmed Khalil", email: "ahmed.khalil@northwindsolutions.com", department: "IT", position: "Junior Developer", supervisor_name: "Karen Whitfield", supervisor_email: "karen.whitfield@northwindsolutions.com", date_hired: "2025-08-04", employment_status: "Probationary" },
    { employee_id: "EMP-1025", full_name: "Grace Adeyemi", email: "grace.adeyemi@northwindsolutions.com", department: "Sales", position: "Senior Sales Representative", supervisor_name: "Robert Hayes", supervisor_email: "robert.hayes@northwindsolutions.com", date_hired: "2021-05-14", employment_status: "Regular" },
    { employee_id: "EMP-1026", full_name: "Henrik Bergstrom", email: "henrik.bergstrom@northwindsolutions.com", department: "Operations", position: "Warehouse Associate", supervisor_name: "Brandon Walsh", supervisor_email: "brandon.walsh@northwindsolutions.com", date_hired: "2023-10-02", employment_status: "Regular" },
    { employee_id: "EMP-1027", full_name: "Camille Dubois", email: "camille.dubois@northwindsolutions.com", department: "Customer Service", position: "Customer Service Representative", supervisor_name: "Daniel Kim", supervisor_email: "daniel.kim@northwindsolutions.com", date_hired: "2024-01-22", employment_status: "Regular" },
    { employee_id: "EMP-1028", full_name: "Marcus Webb", email: "marcus.webb@northwindsolutions.com", department: "Finance", position: "Financial Analyst", supervisor_name: "Linda Foster", supervisor_email: "linda.foster@northwindsolutions.com", date_hired: "2022-04-11", employment_status: "Regular" },
  ],

  violations: [
    {
      id: "V-ATT",
      category: "Attendance & Punctuality",
      description: "Covers tardiness, extended or unauthorized breaks, no-shows, undertime, and failure to follow attendance protocols.",
      examples: [
        "Repeated tardiness (3+ instances in a month)",
        "Extended lunch breaks beyond allowed time",
        "No-show without prior notice",
        "Leaving the workstation without proper logging",
        "Failure to clock in or out",
      ],
      severity_range: [1, 5],
      severity_guidelines: {
        1: "First or second isolated tardiness; minor break overrun",
        2: "Pattern of tardiness within a single month; repeated extended breaks",
        3: "No-show without notice; significant pattern of attendance issues",
        4: "Multiple no-shows; chronic attendance violations after prior warnings",
        5: "Job abandonment (3+ consecutive no-shows); attendance fraud",
      },
    },
    {
      id: "V-PERF",
      category: "Performance & Productivity",
      description: "Covers failure to meet performance targets, low productivity, idle time, and failure to follow standard operating procedures (SOPs) that result in poor work output.",
      examples: [
        "Failure to meet monthly productivity quotas",
        "Excessive idle time during shift",
        "Repeated errors in deliverables",
        "Failure to complete assigned tasks within deadlines",
        "Negligence resulting in rework or customer complaints",
      ],
      severity_range: [1, 5],
      severity_guidelines: {
        1: "First-time minor underperformance; isolated missed task",
        2: "Repeated minor underperformance within a single review period",
        3: "Consistent failure to meet quotas; placement on Performance Improvement Plan (PIP)",
        4: "Failure to improve following a PIP; significant productivity loss",
        5: "Gross negligence resulting in financial loss or major service disruption",
      },
    },
    {
      id: "V-POL",
      category: "Policy Violations",
      description: "Covers violations of company policy that do not directly involve misconduct or fraud — such as dress code, unauthorized use of company equipment, or breach of standard operating procedures.",
      examples: [
        "Dress code violations",
        "Unauthorized use of company equipment or property",
        "Use of personal devices during prohibited hours",
        "Breach of documented SOPs (non-safety-critical)",
        "Failure to comply with company communications protocol",
      ],
      severity_range: [1, 4],
      severity_guidelines: {
        1: "First-time minor dress code or protocol violation",
        2: "Repeated minor violations; unauthorized equipment use",
        3: "Deliberate breach of SOP; repeated policy violations after warning",
        4: "Serious policy violation causing operational disruption or risk",
      },
    },
    {
      id: "V-CON",
      category: "Misconduct & Behavior",
      description: "Covers behavioral issues including insubordination, disrespect toward colleagues or supervisors, workplace conflict, and unprofessional conduct.",
      examples: [
        "Insubordination — refusal to follow reasonable instructions",
        "Disrespectful behavior toward coworkers or supervisors",
        "Engaging in verbal conflict during work hours",
        "Use of inappropriate language",
        "Repeated unprofessional conduct after coaching",
      ],
      severity_range: [2, 5],
      severity_guidelines: {
        2: "Isolated incident of unprofessional conduct",
        3: "Repeated incidents; verbal conflict with coworkers",
        4: "Insubordination toward direct supervisor; pattern of disruptive behavior",
        5: "Aggressive or threatening behavior; behavior causing significant team disruption",
      },
    },
    {
      id: "V-HAR",
      category: "Harassment & Discrimination",
      description: "Covers verbal harassment, sexual harassment, discriminatory behavior, bullying, and any conduct that creates a hostile work environment. All cases trigger immediate formal investigation.",
      examples: [
        "Verbal harassment of a coworker",
        "Sexual harassment (verbal, physical, or digital)",
        "Discriminatory remarks based on protected characteristics",
        "Workplace bullying or intimidation",
        "Retaliation against a complainant",
      ],
      severity_range: [3, 6],
      severity_guidelines: {
        3: "Confirmed verbal harassment of a non-severe nature (single incident)",
        4: "Repeated verbal harassment; discriminatory remarks",
        5: "Sexual harassment; severe bullying; retaliation against complainant",
        6: "Severe harassment with documented evidence; gross misconduct — termination review",
      },
    },
    {
      id: "V-FRD",
      category: "Fraud & Integrity Violations",
      description: "Covers acts of dishonesty including theft, data falsification, time theft (e.g., buddy punching), confidentiality breaches, and any act that compromises the integrity of the company or its employees.",
      examples: [
        "Falsification of attendance, timesheets, or performance records",
        "Theft of company property, funds, or intellectual property",
        "Buddy punching or clocking in/out for another employee",
        "Unauthorized disclosure of confidential information",
        "Misrepresentation in official company documents",
        "Conflict of interest not disclosed to management",
      ],
      severity_range: [4, 6],
      severity_guidelines: {
        4: "Minor data falsification; first-time time theft (small magnitude)",
        5: "Significant data falsification; theft of company property; confidentiality breach",
        6: "Major fraud causing financial loss; severe breach of trust — termination review",
      },
    },
  ],
};

// Allow Node-based tooling (node --check, the data-load test) to import this.
// Harmless in the browser, where `module` is undefined.
if (typeof module !== "undefined" && module.exports) {
  module.exports = NORTHWIND_DATA;
}
