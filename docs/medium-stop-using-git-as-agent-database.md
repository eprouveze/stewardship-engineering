---
title: "Stop Using Git as an AI Agent Database"
subtitle: "How my autonomous fleet generated 1,500 commits a day just to say 'I'm alive'—and the 15-minute edge architecture that fixed it."
author: Emmanuel Prouvèze
date: 2026-10-20
placement: Medium (French in Japan / Personal) & dev.to
canonical_companion: https://stewardshipengineering.com/writing/zero-churn-repository-custody
stealth_notes: "Compliant with stealth standards: no proprietary company or stealth product names."
---

# Stop Using Git as an AI Agent Database

A few months ago, I set up a fleet of background AI agents to run continuous development tasks across my machines. They woke on timers, ran test suites, repaired failing branches, and recorded their operational status.

To make sure a dead worker didn't fail silently, I added a dead-man switch: on every five-minute loop tick, the worker appended a JSON timestamp to a heartbeat log and committed it to Git. If the machine died, the commits stopped, and I would know.

It took about two weeks for that decision to blow up in my face.

With five background workers running around the clock, my agents were generating **1,470 commits every single day** just to say: *"I am still alive."*

Within a month, the repository had accumulated over 44,000 synthetic commits. `git log` was completely unreadable. When I opened a feature branch to write real code, running `git pull --rebase` triggered constant push rejections because an automated worker had pushed another heartbeat while I was typing. Continuous integration was thrashing. My `.git` directory was swelling with thousands of loose tree objects.

I had committed a classic systems design error: **I was using Git as a high-frequency operational database.**

If you are running background AI agents with tools like Claude Code, AutoGPT, or scheduled cron scripts, there is a very high probability you are doing the exact same thing.

---

## The 60-Second Self-Audit

Run this one-line command in your repository right now:

```bash
git log --since="7 days ago" --oneline | wc -l
```

If that number is over 500, take a look at the commit messages:

```bash
git log --since="7 days ago" --oneline | head -n 20
```

Are you seeing actual features, bug fixes, and documentation? Or are you seeing walls of:
- `chore: heartbeat tick #481`
- `update status.json`
- `agent run 2026-10-20-03-15`
- `automated sync`

If more than half of your commits are operational timecards, your version control system has been hijacked.

```
Commit Volume Comparison (30-Day Window)
=============================================================
Genuine Code Releases (Human & Verified PRs):            ~150
In-Band Operational Heartbeat Commits:                ~43,200
=============================================================
Operational Pollution Ratio:                            99.6%
=============================================================
```

---

## Why Every Builder Falls into This Trap

Nobody sets out to abuse Git. You fall into it because Git is the single universal substrate already present on day one.

When you write a single script running on one laptop once an hour, committing state feels harmless. Git is free, authenticated, cryptographically signed, and requires no external servers. 

The trap snaps shut only when you cross the threshold from an interactive script to an unattended fleet.

The mathematics are unforgiving:

$$\text{Daily Commits} = N_{\text{workers}} \times \left( \frac{1440}{\Delta t_{\text{interval}}} \right)$$

At 5 workers running on 5-minute ticks, you generate 1,440 commits a day. At 10 workers, you generate 2,880 commits a day. That is **86,400 commits per month**.

Last week, Anthropic published a report revealing that Claude merged 30,000 code changes a day, breaking Git and forcing them to build an in-house version control system named Scion.

Most of us do not need to replace Git with an enterprise distributed VCS. Most teams drowning in commit churn aren't merging 30,000 legitimate code pull requests a day—they are making a simple category error: **treating Git as an operational message bus.**

A repository is an asset registry, not an operational spool. Version control exists to preserve human craftsmanship, architectural diffs, and deliberate releases. Operational telemetry belongs out-of-band.

---

## The 15-Minute Fix: Out-of-Band Edge Telemetry

To fix this, we decoupled our fleet's operational telemetry from Git entirely. 

Instead of writing to disk and committing to `main`, workers transmit lightweight HTTPS payloads to an edge API backed by a distributed serverless SQLite database (Cloudflare D1).

Here is the entire system architecture:

```
[ Worker Fleet (Laptops, Servers, VPS) ]
          │
          │ HTTPS POST (Signed Token)  --> Zero Git Commits on main
          ▼
┌──────────────────────────────────────┐
│ Cloudflare Worker Edge API           │
│ (/v1/heartbeat/tick)                 │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────┐
│ Cloudflare D1 (Serverless SQLite)    │     │ Git Repository (main)         │
│  - raw_events (append-only stream)   │     │                               │
│  - expectations (silence thresholds) │     │ Clean, human-readable history │
│  - kv_state (atomic CAS locks)       │     │ 0 operational telemetry churn │
└──────────────────┬───────────────────┘     └───────────────▲───────────────┘
                   │                                         │
                   ├─────────────────────────────────────────┤
                   ▼                                         ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────┐
│ Inverted Edge Watchdog               │     │ Nightly Batch Committer       │
│ Checks silence every 2 mins          │     │ 00:00 UTC: Compresses past 24h│
│ Trips self-healing if ticks stop     │     │ into 1 clean audit archive PR │
└──────────────────────────────────────┘     └───────────────────────────────┘
```

The results were immediate:
- **1,470 daily clutter commits dropped to exactly zero.**
- Ingestion latency dropped below 30 milliseconds.
- Worktree merge conflicts vanished.
- We retained 24/7 dead-man liveness monitoring without touching `.git`.

---

## The Copy-Paste Blueprint

You can implement this in 15 minutes on Cloudflare's free tier.

### 1. The D1 SQLite Schema (`schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS raw_events (
  id TEXT PRIMARY KEY,
  stream TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expectations (
  subject TEXT PRIMARY KEY,
  max_interval_minutes INTEGER NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
```

### 2. The Cloudflare Worker (`worker.js`)

```javascript
export default {
  async fetch(request, env) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${env.TELEMETRY_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/v1/telemetry") {
      const { stream, subject, payload } = await request.json();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO raw_events (id, stream, subject, payload, received_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, stream, subject, JSON.stringify(payload), now),
        env.DB.prepare(
          "INSERT INTO expectations (subject, max_interval_minutes, last_seen_at) VALUES (?, 15, ?) ON CONFLICT(subject) DO UPDATE SET last_seen_at = excluded.last_seen_at"
        ).bind(subject, now)
      ]);

      return Response.json({ ok: true, id });
    }

    return new Response("Not Found", { status: 404 });
  }
};
```

### 3. The Worker Agent Hook (Python or Bash)

Inside your agent loop, replace `git commit` with a simple HTTP call:

```python
import os, requests

def send_heartbeat(worker_id, tick_n):
    url = "https://telemetry.yourdomain.com/v1/telemetry"
    headers = {"Authorization": f"Bearer {os.environ['TELEMETRY_SECRET']}"}
    payload = {
        "stream": "heartbeat_tick",
        "subject": worker_id,
        "payload": {"tick": tick_n, "status": "active"}
    }
    requests.post(url, json=payload, headers=headers, timeout=5)
```

---

## The Rule of Thumb: Where Does State Belong?

Before your agent writes anything to disk, apply this decision matrix:

| Data Type | Proper Destination | Reason |
| :--- | :--- | :--- |
| **Code, Tests, Docs** | Git Repository | Permanent asset; needs human review and diff history. |
| **Heartbeats, Beacons** | Edge Telemetry (D1/KV) | Decaying operational half-life; useless after 7 days. |
| **Task Claiming Locks** | Edge KV with Atomic CAS | High contention; locks in Git cause merge conflicts. |
| **Audit Trails** | 1 Daily Git Squash Batch | Preserves historical compliance without commit spam. |

---

## Conclusion: The Custodian Rule

When you build with AI agents, you are building the digital equivalent of an autonomous staff.

An agent that generates thousands of synthetic commits to prove it is still alive is not a custodian. It is a polluter.

Treat version control with respect. Keep your commit log clean for human craftsmanship. Move your operational telemetry out-of-band, and give your agents the freedom to run around the clock without turning your repository into a trash bin.

---

*For the complete architectural essay on out-of-band telemetry, the 5-rung escalation ladder, and Rung 5 Stewardship Engineering in production, see the full paper at [stewardshipengineering.com](https://stewardshipengineering.com/writing/zero-churn-repository-custody).*
