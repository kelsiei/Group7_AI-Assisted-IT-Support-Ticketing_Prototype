# HelpDesk/AI — Frontend Proof-of-Concept (Group 7, INFO 4190)

Frontend proof-of-concept for the **AI-Assisted IT Support Ticketing and
Knowledge Base System**. Two screens (end-user ticket submission, technician
dashboard) demonstrating the **Human-in-the-Loop** workflow: AI-suggested
categories, priorities, and draft responses must be accepted, edited, or
rejected by a technician, and every decision is written to a visible audit log.

Runs entirely on **seeded mock data** — no backend, no live AI calls
(consistent with the demonstration contingency plan in the midterm report).
This code is frozen as of Progress Report #2; the screenshots in Section 2.4
of the report were taken from this exact version.

## Run it locally

Requires [Node.js](https://nodejs.org) (LTS version).

```bash
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).
Use the **End user / Technician** tabs in the header to switch views.

## Planned for INFO 4290

Extension into the complete ticket workflow: MySQL persistence, backend REST
API, AI suggestions through the AIService layer (Claude API with mock
fallback), authentication (JWT + bcrypt), and administrator screens.
