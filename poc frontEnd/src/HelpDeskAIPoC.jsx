import { useState } from "react";
import {
  Bot, Check, X, Pencil, Clock, ShieldCheck, CircleDot, Send,
  Inbox, User, ChevronRight, Sparkles, ScrollText
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* HelpDesk/AI — Group 7 proof-of-concept (INFO 4190, PR#2)            */
/* Seeded mock data only. No backend. No live AI calls.                */
/* HITL rule: no AI suggestion takes effect until a technician acts.   */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["Network", "Account access", "Hardware", "Email", "Software request", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["New", "In progress", "Waiting on user", "Resolved"];

const prioChip = {
  Critical: "bg-rose-100 text-rose-800 ring-rose-200",
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-amber-50 text-amber-800 ring-amber-200",
  Low: "bg-slate-100 text-slate-600 ring-slate-200",
};
const statusDot = {
  "New": "text-sky-500",
  "In progress": "text-amber-500",
  "Waiting on user": "text-slate-400",
  "Resolved": "text-emerald-500",
};

const seedTickets = [
  {
    id: "T-1042", subject: "Cannot connect to VPN from home", requester: "Priya Sharma",
    created: "Today 08:12", status: "New", category: null, priority: null,
    sla: "First response due in 1h 48m", slaLate: false,
    description: "Since this morning the VPN client says 'Gateway unreachable'. Wired connection at home works fine for everything else. I have a client demo at 1pm and need access to the shared drive.",
    ai: {
      category: { sug: "Network", conf: 0.94, state: "pending", final: null },
      priority: { sug: "High", conf: 0.88, state: "pending", final: null },
      draft: {
        sug: "Hi Priya — sorry about the VPN trouble. Please try the three reset steps in KB-014 (sign out of the client, clear the cached profile, reconnect). If the gateway error persists, reply here and we'll re-issue your VPN certificate before your 1pm demo.",
        conf: 0.81, state: "pending", final: null,
      },
    },
  },
  {
    id: "T-1041", subject: "Locked out of payroll portal", requester: "Diego Fuentes",
    created: "Today 07:55", status: "In progress", category: null, priority: null,
    sla: "First response overdue by 32m", slaLate: true,
    description: "Tried my password three times after the weekend and now the payroll portal says my account is locked. Payday is Friday so I'd like this sorted before then.",
    ai: {
      category: { sug: "Account access", conf: 0.97, state: "pending", final: null },
      priority: { sug: "High", conf: 0.83, state: "pending", final: null },
      draft: {
        sug: "Hi Diego — your payroll account locked after repeated sign-in attempts. I've queued an unlock; you'll get a reset link at your work email within 15 minutes. Set a new password and you'll be back in well before Friday.",
        conf: 0.79, state: "pending", final: null,
      },
    },
  },
  {
    id: "T-1040", subject: "3rd-floor printer keeps jamming", requester: "Mei-Ling Chou",
    created: "Yesterday 16:20", status: "New", category: null, priority: null,
    sla: "First response due in 5h 10m", slaLate: false,
    description: "The Canon printer by the kitchenette jams on every duplex job. Single-sided prints are fine. Tray 2 looks slightly bent.",
    ai: {
      category: { sug: "Hardware", conf: 0.91, state: "pending", final: null },
      priority: { sug: "Low", conf: 0.76, state: "pending", final: null },
      draft: {
        sug: "Hi Mei-Ling — thanks for flagging the duplex jams. We'll inspect Tray 2 on the 3rd-floor Canon this afternoon. Until then, single-sided printing or the 2nd-floor printer are the quickest workaround.",
        conf: 0.74, state: "pending", final: null,
      },
    },
  },
  {
    id: "T-1039", subject: "Outlook not syncing on phone", requester: "Arjun Patel",
    created: "Yesterday 11:02", status: "Waiting on user", category: null, priority: null,
    sla: "Waiting on requester", slaLate: false,
    description: "Mail on my phone stopped updating on Tuesday. Desktop Outlook is fine. I've already tried toggling airplane mode.",
    ai: {
      category: { sug: "Email", conf: 0.89, state: "pending", final: null },
      priority: { sug: "Medium", conf: 0.81, state: "pending", final: null },
      draft: {
        sug: "Hi Arjun — desktop working while mobile doesn't usually points to a stale mobile profile. Could you remove and re-add the account on your phone (Settings → Accounts)? If sync still fails, tell us the exact error and we'll reset the device pairing.",
        conf: 0.77, state: "pending", final: null,
      },
    },
  },
  {
    id: "T-1038", subject: "Request: install Figma on workstation", requester: "Sofia Ricci",
    created: "Mon 09:41", status: "New", category: null, priority: null,
    sla: "First response due tomorrow", slaLate: false,
    description: "Joining the design guild next sprint and need Figma desktop installed. Manager (L. Novak) has approved the seat.",
    ai: {
      category: { sug: "Software request", conf: 0.95, state: "pending", final: null },
      priority: { sug: "Low", conf: 0.9, state: "pending", final: null },
      draft: {
        sug: "Hi Sofia — approval from L. Novak noted. We'll push Figma to your workstation via the software centre; expect it within one business day. No restart needed, it will appear in your Start menu.",
        conf: 0.8, state: "pending", final: null,
      },
    },
  },
];

const seedAudit = [
  { t: "Yesterday 16:44", who: "S. Rakhra (Technician)", text: "Accepted AI category \"Email\" on T-1037" },
  { t: "Yesterday 16:45", who: "S. Rakhra (Technician)", text: "Edited AI draft response on T-1037 before sending" },
];

/* Keyword mock triage for newly submitted tickets (stands in for AIService) */
function mockTriage(subject, description) {
  const text = (subject + " " + description).toLowerCase();
  const hit = (words) => words.some((w) => text.includes(w));
  let category = "Other", priority = "Medium", conf = 0.71, line =
    "we've logged your request and a technician will pick it up shortly.";
  if (hit(["vpn", "network", "wifi", "internet", "connection"])) {
    category = "Network"; priority = "High"; conf = 0.87;
    line = "connection issues like this are usually resolved by the reset steps in KB-014 — a technician will confirm the right fix for your setup.";
  } else if (hit(["password", "login", "locked", "account", "sign in", "signin"])) {
    category = "Account access"; priority = "High"; conf = 0.88;
    line = "account access requests are prioritized — expect an unlock or reset link after a technician verifies the request.";
  } else if (hit(["printer", "monitor", "laptop", "keyboard", "mouse", "hardware", "screen"])) {
    category = "Hardware"; priority = "Medium"; conf = 0.84;
    line = "a technician will take a look at the affected device and suggest a workaround in the meantime.";
  } else if (hit(["email", "outlook", "calendar", "inbox", "mail"])) {
    category = "Email"; priority = "Medium"; conf = 0.85;
    line = "mail sync issues are usually profile-related — a technician will confirm before any changes are made.";
  } else if (hit(["install", "software", "license", "licence", "app", "figma", "access to"])) {
    category = "Software request"; priority = "Low"; conf = 0.86;
    line = "software requests are checked against your team's approved list, then pushed to your workstation.";
  }
  return {
    category: { sug: category, conf, state: "pending", final: null },
    priority: { sug: priority, conf: Math.max(0.7, conf - 0.05), state: "pending", final: null },
    draft: {
      sug: `Hi — thanks for reaching out. Based on your description, ${line} You'll hear from us before the SLA target on this ticket.`,
      conf: Math.max(0.68, conf - 0.09), state: "pending", final: null,
    },
  };
}

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ------------------------------- UI bits ------------------------------- */

function Chip({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {children}
    </span>
  );
}

function ConfidenceBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-violet-100">
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="font-mono text-xs text-violet-700">{Math.round(value * 100)}%</span>
    </div>
  );
}

const decisionBadge = {
  accepted: ["bg-teal-50 text-teal-700 ring-teal-200", "Accepted"],
  edited: ["bg-teal-50 text-teal-700 ring-teal-200", "Edited & applied"],
  rejected: ["bg-slate-100 text-slate-500 ring-slate-200", "Rejected"],
};

/* ------------------------------- App ------------------------------- */

export default function HelpDeskAIPoC() {
  const [view, setView] = useState("tech");
  const [tickets, setTickets] = useState(seedTickets);
  const [selectedId, setSelectedId] = useState("T-1042");
  const [audit, setAudit] = useState(seedAudit);
  const [editing, setEditing] = useState(null); // {field, value}
  const [nextNum, setNextNum] = useState(1043);

  // end-user form state
  const [subject, setSubject] = useState("");
  const [formCat, setFormCat] = useState("");
  const [desc, setDesc] = useState("");
  const [myTicketIds, setMyTicketIds] = useState([]);
  const [justCreated, setJustCreated] = useState(null);

  const selected = tickets.find((t) => t.id === selectedId) || null;
  const log = (text) =>
    setAudit((a) => [{ t: `Today ${nowTime()}`, who: "K. Malik (Technician)", text }, ...a]);

  const applyDecision = (field, action, newValue) => {
    if (!selected) return;
    const label = field === "draft" ? "draft response" : field;
    setTickets((ts) =>
      ts.map((t) => {
        if (t.id !== selected.id) return t;
        const s = t.ai[field];
        const final = action === "edited" ? newValue : s.sug;
        const nextAI = { ...t.ai, [field]: { ...s, state: action, final: action === "rejected" ? null : final } };
        const patch = {};
        if (action !== "rejected" && field === "category") patch.category = final;
        if (action !== "rejected" && field === "priority") patch.priority = final;
        return { ...t, ai: nextAI, ...patch };
      })
    );
    if (action === "accepted") log(`Accepted AI ${label} "${field === "draft" ? "as written" : selected.ai[field].sug}" on ${selected.id}`);
    if (action === "edited") log(`Edited AI ${label} on ${selected.id} before applying`);
    if (action === "rejected") log(`Rejected AI ${label} on ${selected.id}`);
    setEditing(null);
  };

  const changeStatus = (value) => {
    if (!selected) return;
    log(`Status changed ${selected.status} → ${value} on ${selected.id}`);
    setTickets((ts) => ts.map((t) => (t.id === selected.id ? { ...t, status: value } : t)));
  };

  const submitTicket = () => {
    if (!subject.trim() || !desc.trim()) return;
    const id = `T-${nextNum}`;
    const ai = mockTriage(subject, desc);
    if (formCat) ai.category = { ...ai.category, sug: formCat, conf: Math.max(ai.category.conf, 0.9) };
    const t = {
      id, subject: subject.trim(), requester: "Alex Chen", created: `Today ${nowTime()}`,
      status: "New", category: null, priority: null,
      sla: "First response due in 4h 00m", slaLate: false,
      description: desc.trim(), ai,
    };
    setTickets((ts) => [t, ...ts]);
    setMyTicketIds((m) => [id, ...m]);
    setNextNum((n) => n + 1);
    setJustCreated(id);
    setSubject(""); setFormCat(""); setDesc("");
  };

  const myTickets = tickets.filter((t) => myTicketIds.includes(t.id));

  /* ---------------- suggestion row ---------------- */
  const SuggestionRow = ({ field, label }) => {
    const s = selected.ai[field];
    const isDraft = field === "draft";
    const isEditing = editing && editing.field === field;
    return (
      <div className="border-t border-violet-100 py-3 first:border-t-0 first:pt-0 last:pb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-900">{label}</span>
            <ConfidenceBar value={s.conf} />
          </div>
          {s.state === "pending" ? (
            <div className="flex items-center gap-1">
              <button onClick={() => applyDecision(field, "accepted")}
                className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button onClick={() => setEditing({ field, value: s.sug })}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => applyDecision(field, "rejected")}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          ) : (
            <Chip tone={decisionBadge[s.state][0]}>
              <ShieldCheck className="h-3 w-3" /> {decisionBadge[s.state][1]} · K. Malik
            </Chip>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            {isDraft ? (
              <textarea value={editing.value} onChange={(e) => setEditing({ field, value: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600" />
            ) : (
              <select value={editing.value} onChange={(e) => setEditing({ field, value: e.target.value })}
                className="rounded-md border border-slate-300 p-1.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600">
                {(field === "category" ? CATEGORIES : PRIORITIES).map((o) => <option key={o}>{o}</option>)}
              </select>
            )}
            <div className="mt-2 flex gap-2">
              <button onClick={() => applyDecision(field, "edited", editing.value)}
                className="rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
                Apply edit
              </button>
              <button onClick={() => setEditing(null)}
                className="rounded-md px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={`mt-1.5 text-sm ${s.state === "rejected" ? "text-slate-400 line-through" : "text-slate-800"}`}>
            {s.state === "edited" ? s.final : s.sug}
          </p>
        )}
      </div>
    );
  };

  /* ---------------- layout ---------------- */
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Inbox className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-tight">HELPDESK<span className="text-teal-700">/AI</span></div>
              <div className="text-xs text-slate-500">Group 7 · INFO 4190 proof-of-concept</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 sm:inline-flex">
              <CircleDot className="h-3 w-3" /> AIService · Claude API (primary)
            </span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-inset ring-slate-200" role="tablist" aria-label="View">
              {[["user", "End user"], ["tech", "Technician"]].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 ${view === k ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------ END USER VIEW ------------------------ */}
      {view === "user" && (
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Submit a ticket</h1>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <User className="h-3.5 w-3.5" /> Signed in as Alex Chen · alex.chen@corp.local
              </span>
            </div>

            {justCreated && (
              <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                Ticket <span className="font-mono font-semibold">{justCreated}</span> created. AI pre-triage is complete — a technician reviews every suggestion before anything reaches you.
              </div>
            )}

            <label htmlFor="subj" className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
            <input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="One line describing the problem"
              className="mb-4 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600" />

            <label htmlFor="cat" className="mb-1 block text-sm font-medium text-slate-700">Category <span className="font-normal text-slate-400">(optional)</span></label>
            <select id="cat" value={formCat} onChange={(e) => setFormCat(e.target.value)}
              className="mb-4 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600">
              <option value="">Not sure — let AI suggest one</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <label htmlFor="desc" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={5}
              placeholder="What happened, what you expected, and anything you already tried"
              className="mb-5 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600" />

            <button onClick={submitTicket} disabled={!subject.trim() || !desc.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-300">
              <Send className="h-4 w-4" /> Submit ticket
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Your tickets</h2>
            {myTickets.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing yet. Tickets you submit appear here with live status.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myTickets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{t.id}</span>
                        <span className="truncate text-sm font-medium">{t.subject}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">Awaiting technician review — no AI response is sent until a technician approves it.</p>
                    </div>
                    <Chip tone="bg-sky-50 text-sky-700 ring-sky-200"><CircleDot className={`h-3 w-3 ${statusDot[t.status]}`} /> {t.status}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      )}

      {/* ------------------------ TECHNICIAN VIEW ------------------------ */}
      {view === "tech" && (
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-5">
          {/* Queue */}
          <section className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <h1 className="text-sm font-semibold text-slate-700">Queue</h1>
              <span className="text-xs text-slate-500">{tickets.filter((t) => t.status !== "Resolved").length} open · {tickets.filter((t) => t.slaLate).length} past SLA</span>
            </div>
            <ul className="space-y-2">
              {tickets.map((t) => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button onClick={() => { setSelectedId(t.id); setEditing(null); }}
                      className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-600 ${active ? "border-teal-600 ring-1 ring-teal-600" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-500">{t.id}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <CircleDot className={`h-3 w-3 ${statusDot[t.status]}`} /> {t.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">{t.subject}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {t.priority ? (
                          <Chip tone={prioChip[t.priority]}>{t.priority}</Chip>
                        ) : (
                          <Chip tone="bg-violet-50 text-violet-700 ring-violet-200"><Sparkles className="h-3 w-3" /> AI: {t.ai.priority.sug}</Chip>
                        )}
                        {t.category ? (
                          <Chip tone="bg-slate-100 text-slate-700 ring-slate-200">{t.category}</Chip>
                        ) : (
                          <Chip tone="bg-violet-50 text-violet-700 ring-violet-200"><Sparkles className="h-3 w-3" /> AI: {t.ai.category.sug}</Chip>
                        )}
                      </div>
                      <div className={`mt-1.5 flex items-center gap-1 text-xs ${t.slaLate ? "font-medium text-rose-600" : "text-slate-500"}`}>
                        <Clock className="h-3 w-3" /> {t.sla}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 px-1 text-xs text-slate-400">Violet chips are unconfirmed AI suggestions. They become solid only after a technician decision.</p>
          </section>

          {/* Detail + audit */}
          <section className="space-y-4 lg:col-span-3">
            {selected && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{selected.id}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{selected.requester} · {selected.created}</span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold">{selected.subject}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="status" className="text-xs text-slate-500">Status</label>
                    <select id="status" value={selected.status} onChange={(e) => changeStatus(e.target.value)}
                      className="rounded-md border border-slate-300 p-1.5 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{selected.description}</p>

                {/* AI Assist — the HITL panel */}
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-700" />
                      <span className="text-sm font-semibold text-violet-900">AI suggestions</span>
                    </div>
                    <span className="text-xs font-medium text-violet-600">Awaiting technician review — nothing is applied or sent automatically</span>
                  </div>
                  <SuggestionRow field="category" label="Category" />
                  <SuggestionRow field="priority" label="Priority" />
                  <SuggestionRow field="draft" label="Draft response" />
                </div>
              </div>
            )}

            {/* Audit log */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700">Audit log</h2>
                <span className="text-xs text-slate-400">every AI decision is recorded</span>
              </div>
              {audit.length === 0 ? (
                <p className="text-sm text-slate-400">No actions yet. Decisions you make on AI suggestions appear here.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {audit.map((e, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                      <span className="font-mono text-xs text-slate-400">{e.t}</span>
                      <span className="text-xs font-medium text-slate-600">{e.who}</span>
                      <span className="text-sm text-slate-800">{e.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-6">
        <p className="text-center text-xs text-slate-400">
          Proof-of-concept · seeded mock data · no backend, no live AI calls · HITL model: no AI suggestion reaches an end user without technician approval.
        </p>
      </footer>
    </div>
  );
}
