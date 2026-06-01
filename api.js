/*
 * api.js — Claude API integration for Live AI mode.
 *
 * Direct browser-to-Anthropic calls (no backend), per the blueprint. The API
 * key lives only in memory (see app.js appState) and is sent solely to
 * Anthropic via the x-api-key header.
 *
 * Model: claude-sonnet-4-6 — the current latest Sonnet, verified against
 * https://platform.claude.com/docs/en/about-claude/models/overview
 * (don't change this from memory; re-check the docs).
 */
const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Call the Claude Messages API.
 * @param {string} systemPrompt - system instructions
 * @param {string} userMessage  - the structured incident context
 * @param {string} apiKey       - Anthropic API key (memory-only)
 * @param {object} [options]    - { maxTokens }
 * @returns {Promise<string>} the assistant's text, or throws a clear Error
 */
async function callClaudeAPI(systemPrompt, userMessage, apiKey, options = {}) {
  if (!apiKey) throw new Error("No API key provided.");

  const maxTokens = options.maxTokens || 1500;

  let response;
  try {
    response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        // Required to allow calling the API straight from a browser.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (networkErr) {
    // fetch() rejects on network/DNS/CORS failures (no HTTP status).
    throw new Error("Could not reach Anthropic. Check your connection. (" + networkErr.message + ")");
  }

  if (!response.ok) {
    // Try to surface Anthropic's error message; fall back to status text.
    let detail = "";
    try {
      const errBody = await response.json();
      detail = (errBody && errBody.error && errBody.error.message) || "";
    } catch (_) { /* non-JSON error body */ }

    if (response.status === 401) {
      throw new Error("Invalid or unauthorized API key (401)." + (detail ? " " + detail : ""));
    }
    if (response.status === 429) {
      throw new Error("Rate limit reached (429). Please wait and try again." + (detail ? " " + detail : ""));
    }
    throw new Error("Anthropic API error " + response.status + (detail ? ": " + detail : "."));
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) throw new Error("The API returned an empty response.");
  return text;
}

// Allow Node-based tooling/tests to import this (no-op in the browser).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { callClaudeAPI, CLAUDE_MODEL, CLAUDE_API_URL, ANTHROPIC_VERSION };
}
