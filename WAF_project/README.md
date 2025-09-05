Web Application Firewall (WAF) — SQLi & XSS Protection
1) Overview

This project is a lightweight Web Application Firewall (WAF) built with Flask to detect and block SQL Injection (SQLi) and Cross-Site Scripting (XSS) attacks in real-time.

It leverages signature-based detection, context-aware heuristics, and rate limiting, while maintaining centralized logging for auditing and analysis.

Purpose: SQLi and XSS are among the most common and impactful web attacks. This project demonstrates practical defensive engineering—from detection logic to incident visibility—perfect for labs, educational purposes, or small production-like demos.

2) Key Features

Real-time request inspection (body, query string, headers, path).

SQLi detection: UNION-based, Boolean-based, stacked queries, common operators/keywords.

XSS detection: reflected and stored vectors, <script> tags, event handlers, JS URIs, HTML attribute injections.

Blocking mechanism with configurable response codes and messages.

Rate limiting and temporary IP bans after repeated violations.

Structured logging (JSON + file + in-memory) for all requests, including matched rules.

Dashboard-ready logs for quick triage and payload analysis.

Extensible ruleset via YAML (no code changes required).

3) Architecture (Request Flow)
Client  →  WAF (Flask Middleware / Reverse Proxy)  →  Protected App
             │
             ├─ ALLOW → forward request
             └─ BLOCK → return 403 or 429


Flow:

Request enters the WAF.

Parsers extract payload from body, query, headers, and path.

Rule engine evaluates signatures and heuristics.

Decision (ALLOW/BLOCK) is logged and enforced.

4) Rule Engine (Detection Logic)
4.1 SQL Injection (SQLi)

Detects UNION SELECT, SELECT FROM, INSERT, UPDATE, DELETE, DROP queries.

Boolean-based attacks: ' OR 1=1 --.

Function abuse: SLEEP(), LOAD_FILE(), INFORMATION_SCHEMA.

Encoded or obfuscated payload detection.

Example patterns (simplified):

(?i)\bunion(\s+all)?\s+select\b
(?i)\b(select|insert|update|delete|drop)\b.*\bfrom\b
(?i)\b(or|and)\s*1\s*=\s*1\b
(?i)\/\*.*?\*\/|--\s|#


Heuristics: keyword density, operator chains, quote imbalance, parameter length spikes → high risk → block.

4.2 Cross-Site Scripting (XSS)

Script injection: <script> tags, onload=, onerror=, onclick=, etc.

JS URIs: javascript:alert(1).

HTML injection: attribute-breaking, unbalanced quotes.

DOM abuse: document.cookie, eval(), Function().

Example patterns (simplified):

(?i)<\s*script\b[^>]*>.*?<\s*/\s*script\s*>
(?i)on\w+\s*=\s*["'\s]*[^"']+
(?i)javascript\s*:
(?i)document\.cookie|localStorage|sessionStorage
(?i)eval\s*\(, (?i)new\s+Function\s*\(


Heuristics: tag/attribute context, dangerous JS sinks, encoding tricks → increase risk score.

5) Blocking & Response

Hard block: high-confidence signature match → HTTP 403.

Soft block / rate-limit: heuristics exceed threshold → HTTP 429.

Configurable response: status, body, and headers.

6) Logging & Visibility

Logs include: timestamp, payload, status (attack/safe), rule matched.

Example JSON log:

{
  "timestamp": "2025-09-05T19:43:12Z",
  "data": "q=' OR 1=1 --",
  "status": "attack"
}


Logs stored in-memory and in logs.txt.

Top attack payloads, counts, and time-series trends displayed on the logs dashboard.

7) Configuration (No-Code Updates)

Example rules.yml:

risk_threshold: 0.65
ip_ban_after: 5
ip_ban_minutes: 15
response:
  status: 403
  body: "Request blocked by WAF policy."
rules:
  - id: SQLI_UNION_001
    type: regex
    pattern: "(?i)\\bunion(\\s+all)?\\s+select\\b"
    weight: 0.9
  - id: XSS_SCRIPT_001
    type: regex
    pattern: "(?i)<\\s*script\\b[^>]*>.*?<\\s*/\\s*script\\s*>"
    weight: 0.95
allowlist:
  paths: ["/health", "/status"]
  ips: ["127.0.0.1"]

8) Running Locally

Requirements: Python 3.10+, Flask.

pip install flask
python app.py
# Access WAF on http://127.0.0.1:4000


Endpoints:

/submit → POST JSON payload { "request": "..." }

/logs → View logs and statistics

/clear-logs → Clear all logs

9) Testing Safely

Use intentionally vulnerable apps (e.g., DVWA, Mutillidae) or test endpoints.

SQLi examples:

q=' OR 1=1--
q=1; SELECT * FROM users


XSS examples:

q=<script>alert(1)</script>
q=" onerror=alert(1) "


Expected: WAF blocks with 403, logs rule ID and reason.

10) Repository Structure
waf-project/
├─ app.py
├─ templates/
│   ├─ index.html
│   ├─ logs.html
│   └─ admin.html
├─ logs/
│   └─ logs.txt
├─ waf/
│   ├─ __init__.py
│   ├─ rules_engine.py
│   ├─ parsers.py
│   └─ logger.py
├─ config/
│   └─ rules.yml
└─ README.md

11) Security Considerations

False positives possible → tune risk_threshold, use allowlists.

Normalize inputs before matching (URL-decode, lowercase).

Combine with input validation, output encoding, CSP, HttpOnly/SameSite cookies.

Avoid logging sensitive info (passwords, tokens).

12) Limitations & Future Work

Bypass attempts: Advanced obfuscation may evade regex. Plan: AST parsing, ML-based anomaly detection.

CSP & Sanitization: Auto-inject headers and safe HTML sanitizers.

Learning Mode: Shadow mode to log without blocking.

Threat Intelligence: Auto-ban IPs from feeds, enrich logs with tags.

13) Personal Contribution

Implemented rule engine and risk scoring for SQLi & XSS.

Built rate limiting & temporary IP bans.

Designed JSON logging schema for SIEM dashboards.

Tuned rules to minimize false positives.

