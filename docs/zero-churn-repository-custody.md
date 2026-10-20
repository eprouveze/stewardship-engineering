# Zero-Churn Repository Custody: Why Autonomous Agent Fleets Must Decouple Telemetry from Git Commits

### Out-of-band dead-man telemetry, deterministic escalation ladders, and Rung 5 Stewardship Engineering in production.

**Author:** Emmanuel Prouvèze  
**Published:** October 2026  
**Site:** [stewardshipengineering.com](https://stewardshipengineering.com) / [emmanuel.prouveze.fr](https://emmanuel.prouveze.fr)  
**Classification:** Systems Architecture / Autonomous Agent Infrastructure  

---

## Executive Summary: The Custodian Problem

Over the past year, we have built and run an autonomous, multi-agent, multi-LLM fleet operating under principles we call Stewardship Engineering. This goes beyond a single developer paired with an interactive AI assistant. It functions as an autonomous software factory running around the clock across heterogeneous reasoning engines and physical hosts. Operating at this altitude introduces entirely new classes of operational friction. We address them—and learn—as we go.

Today, we examine one of the earliest and most destructive friction points every autonomous fleet encounters: the catastrophic collision between continuous agent telemetry and repository custody.

If you hire a groundskeeper to tend your garden, you expect them to pull the weeds, trim the hedges, and leave the property in better condition than they found it.

Now imagine if, to prove they were working, the groundskeeper taped a paper receipt to your front door every ten minutes. Within three days, your door is buried under thousands of slips of paper. You cannot open the door, you cannot see your house number, and when you hire a second gardener, the two spend half their morning fighting over who gets to tape their receipt to the door first.

This is the exact operational trap that catches teams building autonomous AI agents.

When you leave an AI agent running unattended, you need to answer three basic questions:
1. Is the agent alive right now?
2. Did it complete its work or did it get deadlocked in a loop?
3. If it failed, what broke?

The path of least resistance on day one is to have the agent write a short log entry into the project repository and commit it to Git. Git is already configured, requires no external servers or monthly database bills, and provides an authenticated, cryptographically hashed ledger for free.

In an experimental script running once an hour, this feels harmless. When you scale to a fleet of five or ten background workers running continuous loops around the clock, this innocent design metastasizes. The agents generate 1,500 commits every single day just to say "I am still alive."

The operational consequences are immediate:
- Human engineers cannot read the project history because 99% of all commits are automated timecards.
- Developers and concurrent agent worktrees hit constant merge conflicts and push rejections.
- The `.git` directory explodes with intermediate tree objects, slowing down clones and continuous integration pipelines.
- Git, a tool designed to preserve human software craftsmanship, is degraded into a noisy operational trash bin.

This paper documents the anatomy of this failure, why it happens to almost every team scaling background agents, and how we solved it in production across our autonomous fleet. 

Instead of treating Git as an operational message board, we enforced the foundational law of **Stewardship Engineering: an agent must act as a custodian of the repository, not an operational polluter.** 

We moved all operational telemetry—heartbeats, worker liveness beacons, execution logs, and health flags—out of Git and into an ultra-fast, lightweight edge database. 

The practical results:
- **1,470 daily operational commits dropped to zero.**
- Git history was restored to clean, human-meaningful code changes.
- Merge conflicts across concurrent agent worktrees were eliminated.
- We gained 24/7 out-of-band dead-man monitoring and an automated five-rung recovery ladder that repairs stuck workers before alerting an engineer.

Below is the architectural case study of how this works, why it matters, and where it fits within the broader discipline of Stewardship Engineering.

> [!NOTE] A Note on Authorship and Engineering Roles
> This paper is an active collaboration between myself (Emmanuel) and Lex, my autonomous AI cofounder. In our operating model, I act as the captain of the ship: setting strategy, architectural direction, editorial standards, and operational bounds. Lex and the underlying fleet supply the engineering execution, telemetry plumbing, and formal mathematical modeling. The derivations and state equations presented in Section 2 reflect the machine's analytical horsepower guided by human direction. I do not claim to hand-derive every differential formula or graph traversal—my job is to steer the ship, stress-test the principles in production, and ensure the factory builds software worthy of long-term custody.

---

## 1. The Custody Threshold

Autonomous software agents cross a critical boundary the moment an operator stops watching the terminal.

In supervised harness engineering (Rungs 3 and 4 of the autonomy ladder), an agent operates in front of an engineer. Tools are executed, diffs are reviewed, and terminal outputs scroll by in real time. If the model loops unproductively, hallucinates an invalid path, or pollutes a branch, the human catches the mistake within seconds.

Rung 5 Stewardship Engineering marks the transition to unattended operation over months. In this regime, an agent is no longer an interactive code-completion assistant. It is a custodian of a production repository. It wakes on a timer, claims work items, runs tests, fixes regressions, coordinates with peer processes, and logs its operational health.

A custodian has a primary duty: to preserve and protect the codebase entrusted to it. When an agent pollutes the repository with operational debris to prove it is still alive, it violates this duty.

A repository is an asset registry, not an operational spool. Version control preserves deliberate, human-comprehensible transitions in software design, configuration, and documentation. Operational telemetry belongs out-of-band.

<div align="center">
<svg viewBox="0 0 760 220" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fffdf8;border:1px solid #e2ddd2;border-radius:12px;padding:16px;margin:24px 0;font-family:Inter,system-ui,sans-serif;">
  <rect x="20" y="20" width="340" height="180" rx="8" fill="#f7f4ee" stroke="#e2ddd2" stroke-width="1.5"/>
  <text x="40" y="52" fill="#8a8f86" font-size="12" font-weight="600" letter-spacing="0.08em">RUNGS 3–4: SUPERVISED HARNESS</text>
  <text x="40" y="78" fill="#1b1d1a" font-size="16" font-weight="600">The Watcher Regime</text>
  <text x="40" y="106" fill="#5d6259" font-size="13">• Human watches terminal in real time</text>
  <text x="40" y="128" fill="#5d6259" font-size="13">• Interactive catches for hallucinated diffs</text>
  <text x="40" y="150" fill="#5d6259" font-size="13">• Session-scoped, ephemeral working state</text>
  <text x="40" y="172" fill="#9b3b2e" font-size="13" font-weight="500">❌ Git used as informal progress log</text>
  
  <path d="M375 110 L395 110" stroke="#a77b2c" stroke-width="2" marker-end="url(#arrow)"/>
  
  <rect x="400" y="20" width="340" height="180" rx="8" fill="#e3ece6" stroke="#1f5a43" stroke-width="1.5"/>
  <text x="420" y="52" fill="#1f5a43" font-size="12" font-weight="600" letter-spacing="0.08em">RUNG 5: STEWARDSHIP CUSTODY</text>
  <text x="420" y="78" fill="#1b1d1a" font-size="16" font-weight="600">The Custodian Regime</text>
  <text x="420" y="106" fill="#1b1d1a" font-size="13">• Unattended operation over weeks and months</text>
  <text x="420" y="128" fill="#1b1d1a" font-size="13">• Bounded execution envelopes and verifiers</text>
  <text x="420" y="150" fill="#1b1d1a" font-size="13">• Out-of-band dead-man telemetry (D1 / KV)</text>
  <text x="420" y="172" fill="#1f5a43" font-size="13" font-weight="600">✓ Zero-churn repository custody</text>
  
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#a77b2c"/>
    </marker>
  </defs>
</svg>
</div>

---

## 2. The Mechanics of Git Strain

### 2.1 The Innocent Escalation Trap

Every team building background agents starts the same way. We did it ourselves. 

When you write a single script or an automated worker loop, Git is the single universal substrate already present in the workspace. It requires no infrastructure provisioning, no external secrets, and provides cryptographic commit hashing for free.

In a single-agent prototype running once an hour, committing a run log or a `heartbeat.jsonl` record feels harmless. Twenty-four commits a day is easily lost in regular project traffic.

The trap snaps shut only when you cross the threshold from an experimental script to an autonomous production fleet. 

The moment you deploy five to ten background workers on dedicated host machines, operating on five-minute or fifteen-minute tick intervals, the mathematics of Git commits become devastating.

```
+-----------------------------------------------------------+
|               THE INNOCENT ESCALATION TRAP                |
+-----------------------------------------------------------+
| 1 Agent, 1 run/hour        -> ~24 commits/day   (Tolerable)|
| 3 Agents, 15-min intervals -> ~288 commits/day  (Noisy)    |
| 5 Agents, 5-min intervals  -> ~1,440 commits/day(Critical) |
| 10 Agents, 5-min intervals -> ~2,880 commits/day(Paralysis)|
+-----------------------------------------------------------+
```

### 2.2 The Mathematical Mechanics of Repository Pollution

Consider an autonomous fleet of $N$ workers running a heartbeat loop at an interval of $\Delta t$ minutes. The number of operational commits generated per day, $C_{\text{daily}}$, is:

$$C_{\text{daily}} = \sum_{w=1}^{N} \frac{1440}{\Delta t_w}$$

For a fleet of 5 workers running on an average 5-minute tick cadence:

$$C_{\text{daily}} = 5 \times \left( \frac{1440}{5} \right) = 1,440 \text{ commits/day}$$

Over thirty days, this produces 43,200 synthetic commits. Over a single quarter, more than 129,000 commits are written to the repository.

<div align="center">
<svg viewBox="0 0 760 260" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fffdf8;border:1px solid #e2ddd2;border-radius:12px;padding:16px;margin:24px 0;font-family:Inter,system-ui,sans-serif;">
  <text x="30" y="32" fill="#1b1d1a" font-size="14" font-weight="600">Cumulative Commit Volume Over 90 Days</text>
  <text x="30" y="52" fill="#8a8f86" font-size="12">Comparing in-band agent telemetry against clean software assets</text>
  
  <line x1="80" y1="210" x2="700" y2="210" stroke="#e2ddd2" stroke-width="1.5"/>
  <line x1="80" y1="70" x2="80" y2="210" stroke="#e2ddd2" stroke-width="1.5"/>
  
  <text x="40" y="214" fill="#8a8f86" font-size="11">0</text>
  <text x="25" y="145" fill="#8a8f86" font-size="11">65k</text>
  <text x="20" y="75" fill="#8a8f86" font-size="11">130k</text>
  
  <text x="80" y="230" fill="#8a8f86" font-size="11">Day 0</text>
  <text x="285" y="230" fill="#8a8f86" font-size="11">Day 30</text>
  <text x="490" y="230" fill="#8a8f86" font-size="11">Day 60</text>
  <text x="670" y="230" fill="#8a8f86" font-size="11">Day 90</text>
  
  <!-- In-band telemetry curve -->
  <path d="M 80 210 L 285 165 L 490 120 L 695 72" fill="none" stroke="#9b3b2e" stroke-width="3"/>
  <circle cx="695" cy="72" r="4" fill="#9b3b2e"/>
  <text x="420" y="65" fill="#9b3b2e" font-size="12" font-weight="600">In-Band Telemetry (~130,000 commits)</text>
  
  <!-- Zero-churn code assets curve -->
  <path d="M 80 210 L 285 208 L 490 206 L 695 203" fill="none" stroke="#1f5a43" stroke-width="3"/>
  <circle cx="695" cy="203" r="4" fill="#1f5a43"/>
  <text x="420" y="195" fill="#1f5a43" font-size="12" font-weight="600">Clean Code Assets (~450 verified PRs)</text>
</svg>
</div>

### 2.3 The Structural Points of Friction

1. **Commit History Obfuscation:** The primary human interface to Git is `git log`. When 99.6% of all commits are automated tick receipts, meaningful code changes disappear behind an unreadable wall of operational noise. Bisecting regressions with `git bisect` requires custom shell predicates to skip thousands of synthetic records.

2. **Rebase and Merge Gridlock:** In a multi-worker environment where several agents and human engineers share a remote repository, every worker must pull and rebase before pushing. Under concurrent operation, the probability $P$ of a push rejection due to an interleaved telemetry push increases rapidly with fleet concurrency:

$$P_{\text{rejection}} \approx 1 - e^{-\lambda \tau_{\text{push}}}$$

Where $\lambda$ is the fleet-wide commit arrival rate and $\tau_{\text{push}}$ is the network window between fetch and push. At $\lambda = 1 \text{ commit/minute}$, push rejections become frequent, forcing workers into endless fetch-rebase loops that consume compute and block real work.

3. **Repository Bloat:** Git is an append-only directed acyclic graph of objects. Every commit, even one appending a single 120-byte JSON line to a heartbeat file, creates a new commit object, a new root tree object, and new intermediate tree objects for every directory above the changed file. A repository generating 1,440 operational commits daily accumulates over 4,300 uncompressed Git objects daily, ballooning `.git` packfile sizes and inflating clone times across the fleet.

4. **CI and Webhook Overload:** Continuous integration systems listen to repository push events. When hundreds of telemetry commits hit `origin/main` daily, CI pipelines require complex path-filtering rules to prevent costly, wasteful test suite runs on synthetic operational updates.

5. **Lifecycle Conflation:** Code changes have long lifecycles; they persist for years. Telemetry has a decaying half-life; a heartbeat tick is vital for fifteen minutes and useless after seven days. Storing high-frequency transient telemetry inside a permanent version control system conflates two entirely different data lifecycles.

---

## 3. Convergent Evolution: The Anthropic Precedent

### 3.1 Two Divergent Responses to Machine Velocity

In late summer and early autumn 2026, as our fleet scaled, we reached the physical limits of Git under high-frequency autonomous execution and began architecting an out-of-band telemetry migration.

On October 13, 2026, Anthropic published an engineering report titled *"Redesigning source control at Anthropic"*. In that paper, Anthropic revealed that Claude's autonomous coding velocity had forced them to migrate away from Git entirely, replacing it with an in-house version control system named Scion.

Between May and September 2026, Anthropic's daily merged changes grew from 2,500 to over 30,000 per day. Git's decentralized model (complete offline clones, packfiles, ref locks, and 600 PB/day in potential CI clone traffic) broke under that volume. Anthropic's solution was to rebuild source control from first principles:
- An in-house, centralized server architecture.
- Commits structured as write-ahead changesets in blob storage.
- Single-row Google Cloud Spanner Compare-and-Swap operations for ref updates.
- Virtualized and sparse checkouts where clients only read files on demand.

Anthropic's publication serves as independent validation of a core reality: **autonomous AI agents operate at a cadence that breaks tools designed for human engineers.**

However, Anthropic's response and the Stewardship Engineering response address two fundamentally different layers of the software problem.

```
+-------------------------------------------------------------------------+
|                  SCALING THE PIPE vs. DISCIPLINING THE BOUNDARY         |
+-------------------------------------------------------------------------+
| Dimension           | Anthropic (Scion)        | Stewardship Engineering|
+---------------------+--------------------------+------------------------+
| Primary Bottleneck  | Genuine code PR merges   | Operational telemetry  |
| Daily Volume        | 30,000 code changes/day  | 1,470 status logs/day  |
| Architectural Move  | Replace the VCS          | Enforce boundary rules |
| Infrastructure Cost | Google Cloud Spanner     | Cloudflare Worker + D1 |
| Target Audience     | Giant foundation labs    | 99.9% of engineering   |
| View of Git         | Deprecated for agents    | Preserved for humans   |
+---------------------+--------------------------+------------------------+
```

### 3.2 Scaling the Pipe vs. Disciplining the Boundary

Anthropic resolved their crisis by *scaling the pipe*: they built a massive, distributed version control system capable of swallowing tens of thousands of agent merges a day.

For the vast majority of engineering organizations and startups, replacing Git with an in-house VCS is neither viable nor desirable. Git is the universal lingua franca of modern software engineering. It connects with GitHub, security scanners, deployment pipelines, code review surfaces, and human collaboration tools.

More importantly, most teams experiencing "Git collapse" under agent workloads are not merging 30,000 legitimate pull requests a day. They are suffering from self-inflicted operational churn: agents using the repository as an execution spool, a dead-man switch, a state coordinator, and a run-log repository.

Anthropic redesigned version control to absorb extreme code velocity. Stewardship Engineering enforces architectural discipline at the boundary.

Even if you run on Scion, Google Piper, or Git, polluting your version control ledger with agent liveness ticks is an architectural failure. By keeping Git as the immutable asset registry and routing operational telemetry out-of-band, teams eliminate 95% of machine-generated Git churn without abandoning the global Git ecosystem.

---

## 4. Architectural Principles for Autonomous Fleet Telemetry

To achieve zero-churn repository custody while preserving complete fleet observability, we established four core architectural principles:

<div align="center">
<svg viewBox="0 0 760 360" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fffdf8;border:1px solid #e2ddd2;border-radius:12px;padding:16px;margin:24px 0;font-family:Inter,system-ui,sans-serif;">
  <!-- Nodes: Autonomous Fleet -->
  <rect x="30" y="25" width="700" height="55" rx="8" fill="#f7f4ee" stroke="#e2ddd2" stroke-width="1.5"/>
  <text x="50" y="48" fill="#8a8f86" font-size="11" font-weight="600" letter-spacing="0.08em">AUTONOMOUS AGENT FLEET (MULTI-HOST)</text>
  <text x="50" y="68" fill="#1b1d1a" font-size="14" font-weight="600">Worker A (Host 1)  •  Worker B (Host 2)  •  Worker C (Cloud VPS)</text>
  
  <!-- Flow Lines -->
  <path d="M 200 80 L 200 130" stroke="#1f5a43" stroke-width="2" marker-end="url(#arrow-green)"/>
  <text x="210" y="110" fill="#1f5a43" font-size="11" font-weight="600">HTTPS POST /v1/telemetry</text>
  
  <path d="M 560 80 L 560 130" stroke="#8a8f86" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="440" y="110" fill="#8a8f86" font-size="11">Zero Git Commits on main</text>
  
  <!-- System of Observation -->
  <rect x="30" y="130" width="340" height="150" rx="8" fill="#e3ece6" stroke="#1f5a43" stroke-width="1.5"/>
  <text x="50" y="155" fill="#1f5a43" font-size="11" font-weight="600" letter-spacing="0.08em">SYSTEM OF OBSERVATION (EDGE D1 / KV)</text>
  <text x="50" y="180" fill="#1b1d1a" font-size="15" font-weight="600">Cloudflare Edge Storage</text>
  <text x="50" y="205" fill="#5d6259" font-size="13">• raw_events: Append-only tick stream</text>
  <text x="50" y="225" fill="#5d6259" font-size="13">• expectations: Dead-man silence thresholds</text>
  <text x="50" y="245" fill="#5d6259" font-size="13">• kv_state: Atomic CAS state flags</text>
  
  <!-- System of Record -->
  <rect x="390" y="130" width="340" height="150" rx="8" fill="#fffdf8" stroke="#e2ddd2" stroke-width="1.5"/>
  <text x="410" y="155" fill="#8a8f86" font-size="11" font-weight="600" letter-spacing="0.08em">SYSTEM OF RECORD (GIT REPOSITORY)</text>
  <text x="410" y="180" fill="#1b1d1a" font-size="15" font-weight="600">Production Git Branch (main)</text>
  <text x="410" y="215" fill="#5d6259" font-size="13">• Verified code diffs and unit test suites</text>
  <text x="410" y="235" fill="#5d6259" font-size="13">• Architecture documentation and schemas</text>
  <text x="410" y="255" fill="#1f5a43" font-size="13" font-weight="600">✓ Clean commit log; 0 operational churn</text>
  
  <!-- Bottom Actions -->
  <rect x="30" y="295" width="340" height="45" rx="6" fill="#f3e9d4" stroke="#a77b2c" stroke-width="1"/>
  <text x="45" y="323" fill="#a77b2c" font-size="12" font-weight="600">Inverted Watchdog: Trips 5-Rung Escalation on Silence</text>
  
  <rect x="390" y="295" width="340" height="45" rx="6" fill="#f7f4ee" stroke="#e2ddd2" stroke-width="1"/>
  <text x="410" y="323" fill="#5d6259" font-size="12">Nightly Batch Committer: 1 squash archive commit/day</text>
  
  <defs>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#1f5a43"/>
    </marker>
  </defs>
</svg>
</div>

### Principle 1: Asset-Observation Separation

A software system requires two distinct planes: a **System of Record** and a **System of Observation**.

The System of Record preserves durable software assets: code, schemas, migrations, test suites, and architectural documentation. It operates on a cadence of hours or days, driven by human commits and verified automated pull requests.

The System of Observation captures transient operational state: heartbeat ticks, task claiming locks, process beacons, resource usage, and continuous integration health flags. It operates on a cadence of seconds or minutes.

Conflating these two planes is the root cause of repository gridlock. By directing high-frequency operational traffic to a lightweight edge API backed by distributed SQLite (Cloudflare D1), operational ingestion latency drops below 30 milliseconds, completely removing the Git network overhead from worker loops.

### Principle 2: Inverted Dead-Man Liveness

The critical failure mode of Git-based monitoring is requiring affirmative execution to prove health. If an agent loops infinitely, hangs on a network call, or crashes, it stops committing. An external monitor reading Git only detects this after polling a stale commit log.

Stewardship Engineering inverts the watchdog. An independent cron evaluates an `expectations` registry at the edge. The expectation defines a maximum silence threshold for each active stream:

$$\text{Silence Duration} = t_{\text{now}} - t_{\text{last\_seen}}$$

$$\text{Trip Condition: } \text{Silence Duration} > \Delta t_{\text{threshold}}$$

The alert trips on silence, not on a failing commit. The dead-man switch is completely decoupled from worker host availability, operating system health, and local Git tooling.

### Principle 3: Concurrency Isolation via Atomic Compare-and-Swap

Autonomous agent fleets require shared coordination primitives: task claiming locks, worker role assignments, and continuous integration status flags.

When these flags are committed as JSON files in Git (`ci-status.json`, `worker-claims.json`), concurrent workers produce push rejections and merge conflicts.

In our architecture, coordination flags are moved to an edge key-value registry backed by atomic Compare-and-Swap (CAS). An agent updates state by providing its observed version. If another worker modified the state concurrently, the CAS fails with HTTP 409 Conflict, enabling clean backoff without generating a single Git conflict or failed merge.

### Principle 4: Asynchronous Temporal Compaction

While operational telemetry does not belong in live Git commits, long-term regulatory and engineering compliance requires retaining an audit trail of agent actions.

Instead of continuous micro-commits throughout the day, an asynchronous compaction worker runs once daily at 00:00 UTC. It queries all raw telemetry events recorded at the edge over the preceding 24 hours, validates schema integrity, and writes a single deterministic archive partition:

```
audit/telemetry/YYYY-MM-DD.jsonl
```

This collapses 1,440 continuous micro-commits into a single, predictable, easily-audited daily record.

---

## 5. The Deterministic Escalation Contract

When an autonomous agent dies or an edge watchdog trips, what should happen?

Naive monitoring sends an instant push notification or Slack alert to an engineer. In an unattended fleet running 24/7, this produces severe alert fatigue. A transient network spike at 03:00 wakes an engineer for an issue that heals itself five seconds later.

Conversely, ignoring failures leads to silent multi-day fleet outages.

To resolve this, we implemented a deterministic five-rung escalation ladder. The core principle: **exhaust automated self-healing before escalating to human attention.**

<div align="center">
<svg viewBox="0 0 760 300" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fffdf8;border:1px solid #e2ddd2;border-radius:12px;padding:16px;margin:24px 0;font-family:Inter,system-ui,sans-serif;">
  <line x1="80" y1="35" x2="80" y2="265" stroke="#e2ddd2" stroke-width="4"/>
  <line x1="220" y1="35" x2="220" y2="265" stroke="#e2ddd2" stroke-width="4"/>
  
  <!-- Rung 0 -->
  <rect x="70" y="40" width="160" height="34" rx="6" fill="#1f5a43"/>
  <text x="85" y="62" fill="#fffdf8" font-size="12" font-weight="600">Rung 0: Local Auto-Repair</text>
  <text x="250" y="62" fill="#1b1d1a" font-size="13">Host actuator restarts process, clears locks, saves Git bundle</text>
  
  <!-- Rung 1 -->
  <rect x="70" y="85" width="160" height="34" rx="6" fill="#2d6e53"/>
  <text x="85" y="107" fill="#fffdf8" font-size="12" font-weight="600">Rung 1: Silent Re-Probe</text>
  <text x="250" y="107" fill="#5d6259" font-size="13">Edge evaluates 3-attempt sliding window to absorb network blips</text>
  
  <!-- Rung 2 -->
  <rect x="70" y="130" width="160" height="34" rx="6" fill="#a77b2c"/>
  <text x="85" y="152" fill="#fffdf8" font-size="12" font-weight="600">Rung 2: Host Grouping</text>
  <text x="250" y="152" fill="#5d6259" font-size="13">Collapses N streams on 1 dead host into 1 page (suppresses storms)</text>
  
  <!-- Rung 3 -->
  <rect x="70" y="175" width="160" height="34" rx="6" fill="#9b3b2e"/>
  <text x="85" y="197" fill="#fffdf8" font-size="12" font-weight="600">Rung 3: GitHub Issue</text>
  <text x="250" y="197" fill="#9b3b2e" font-size="13" font-weight="500">Unresolved after 6 hours: auto-opens Issue; auto-closes on recovery</text>
  
  <!-- Rung 4 -->
  <rect x="70" y="220" width="160" height="34" rx="6" fill="#1b1d1a"/>
  <text x="85" y="242" fill="#fffdf8" font-size="12" font-weight="600">Rung 4: Daily Digest</text>
  <text x="250" y="242" fill="#5d6259" font-size="13">Unconditional 08:00 UTC report proves watchdog itself hasn't died</text>
</svg>
</div>

### 5.1 Rung 0: Local Autonomous Auto-Repair

The first line of defense runs directly on the worker host via an independent watchdog timer. 

If the worker loop stops updating its local heartbeat stamp for more than 15 minutes, the auto-repair actuator triggers. It performs three operations:
1. **Worktree Zero-Loss Snapshot:** Before touching any process or Git state, it creates an immutable backup bundle of the local workspace:
   ```bash
   git bundle create ~/.backups/emergency-$(date +%s).bundle --all
   ```
2. **Orphan Lock Cleanup:** Stale lockfiles from terminated worker processes are cleared.
3. **Clean Process Relaunch:** The worker service is restarted cleanly under its system supervisor.

In production, Rung 0 resolves over 80% of routine failures (memory leaks, stuck subagents, deadlocked network sockets) without human intervention.

### 5.2 Rung 1: Silent Edge Re-Probe

If a worker fails to report to the edge API on time, the edge watchdog does not immediately fire an alert. It evaluates a three-attempt sliding window with exponential backoff. This prevents false alarms caused by transient network routing blips between the worker host and the Cloudflare edge.

### 5.3 Rung 2: Host Incident Grouping

When a physical machine loses power or drops its internet connection, all agent streams running on that machine fail simultaneously.

In an unmanaged setup, an eight-worker host generates eight concurrent emergency pages.

Rung 2 groups all expectations by physical host (`grp = host_id`). When multiple streams on the same host trip within a five-minute window, the edge engine collapses them into a single incident:
```
HOST DOWN: mac-mini-m4 (3 streams affected: worker-a, worker-c, cswap)
```
One page is issued. One acknowledgement silences alerts for the entire host.

### 5.4 Rung 3: Persistent External Escalation

Pager alerts and chat notifications are easily dismissed or missed during sleep. If an incident remains unrecovered for more than six hours, Rung 3 escalates by programmatically opening an issue on the upstream GitHub repository:
```
Title: [FLEET-DOWN] worker-a-m4 silent for 6h (last seen: 2026-10-20 06:12 UTC)
Labels: fleet-down, operational-incident
```
This places the failure directly in the software development workflow. When the worker recovers and completes two consecutive green ticks, the watchdog automatically closes the GitHub issue with a recovery receipt.

### 5.5 Rung 4: Unconditional Daily Digest

The most dangerous failure in any monitoring infrastructure is the silent death of the alerting system itself. If the monitoring cron crashes, a silent fleet appears completely healthy.

To guarantee monitoring integrity, Rung 4 sends an unconditional digest every morning at 08:00 UTC. It reports the total tick counts, error rates, and active streak lengths for every worker in the fleet. If the morning digest does not arrive, operators immediately know the monitoring harness itself has failed.

---

## 6. Where This Sits in Stewardship Engineering

Stewardship Engineering is the practice of operating autonomous AI agents as accountable custodians of software systems over months. 

It organizes the evolution of agent workflows across six rungs:

```
+-------------------------------------------------------------------------+
|                  THE SIX RUNGS OF AGENT OPERATIONS                      |
+-------------------------------------------------------------------------+
| Rung 1: Prompt Engineering   | Direct prompt framing and few-shot examples
| Rung 2: Context Engineering  | Dynamic retrieval, RAG, and system prompt curation
| Rung 3: Harness Engineering  | Equipping agents with bash tools and API wrappers
| Rung 4: Harness Engineering  | Deterministic test-driven loops while watched
+-------------------------------------------------------------------------+
| ======================== THE CUSTODY THRESHOLD ======================== |
| Mistakes transition from caught terminal outputs to unattended actions   |
+-------------------------------------------------------------------------+
| Rung 5: Stewardship Eng.     | Bounded envelopes, outcome ledgers, zero-churn
| Rung 6: Stewardship Eng.     | Self-improving autonomy from empirical track records
+-------------------------------------------------------------------------+
```

Within this discipline, three foundational components form the operational triad:

<div align="center">
<svg viewBox="0 0 760 280" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fffdf8;border:1px solid #e2ddd2;border-radius:12px;padding:16px;margin:24px 0;font-family:Inter,system-ui,sans-serif;">
  <!-- Triad Top Node -->
  <rect x="260" y="25" width="240" height="65" rx="8" fill="#e3ece6" stroke="#1f5a43" stroke-width="1.5"/>
  <text x="280" y="50" fill="#1f5a43" font-size="11" font-weight="600" letter-spacing="0.08em">THE TEMPORAL LOOP</text>
  <text x="280" y="72" fill="#1b1d1a" font-size="16" font-weight="600">heartbeat</text>
  
  <!-- Left Node -->
  <rect x="60" y="170" width="280" height="75" rx="8" fill="#fffdf8" stroke="#e2ddd2" stroke-width="1.5"/>
  <text x="80" y="195" fill="#8a8f86" font-size="11" font-weight="600" letter-spacing="0.08em">THE TRUST SUBSTRATE</text>
  <text x="80" y="217" fill="#1b1d1a" font-size="16" font-weight="600">rightmodel</text>
  <text x="80" y="235" fill="#5d6259" font-size="12">Earned autonomy & outcome ledgers</text>
  
  <!-- Right Node -->
  <rect x="420" y="170" width="280" height="75" rx="8" fill="#fffdf8" stroke="#e2ddd2" stroke-width="1.5"/>
  <text x="440" y="195" fill="#8a8f86" font-size="11" font-weight="600" letter-spacing="0.08em">THE MEMORY SUBSTRATE</text>
  <text x="440" y="217" fill="#1b1d1a" font-size="16" font-weight="600">anamnesis</text>
  <text x="440" y="235" fill="#5d6259" font-size="12">Precedent search & architectural memory</text>
  
  <!-- Connecting Edges -->
  <line x1="330" y1="90" x2="220" y2="170" stroke="#1f5a43" stroke-width="2"/>
  <line x1="430" y1="90" x2="540" y2="170" stroke="#1f5a43" stroke-width="2"/>
  <line x1="340" y1="205" x2="420" y2="205" stroke="#a77b2c" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="350" y="195" fill="#a77b2c" font-size="10" font-weight="600">Out-of-band sync</text>
</svg>
</div>

1. **`heartbeat` (The Loop):** The temporal rhythm. It wakes the agent, validates bounded execution envelopes, advances one discrete task per tick, and paces execution.
2. **`rightmodel` (The Trust Substrate):** The earned-autonomy engine. It routes tasks based on proven model track records and logs falsifiable predictions to an outcome ledger before taking action.
3. **`anamnesis` (The Memory Substrate):** The long-term institutional memory. It retrieves architectural decisions, past failures, and project precedents across sessions.

### How Out-of-Band Telemetry Completes the Triad

Without out-of-band telemetry, this triad cannibalizes the very repository it is assigned to build. 

The loop records its ticks in Git. The router records its outcome predictions in Git. The memory system commits its index stamps in Git. Within weeks, the software repository is overwhelmed by the operational scaffolding of the agents maintaining it.

Out-of-band telemetry serves as the nervous system connecting this triad:
- `heartbeat` reports tick cadence and liveness to edge KV/D1 without writing to Git.
- `rightmodel` streams outcome grades and model performance receipts into the edge ledger.
- `anamnesis` verifies precedent consistency against persistent memory without generating churn commits.

This separation preserves the boundary between the **system of record** (Git: containing software architecture, source code, and intentional documentation) and the **system of observation** (Edge Telemetry: containing operational health, execution timing, and worker status).

---

## 7. Empirical Results from Production

In October 2026, we completed the full cutover of thirteen operational streams across our multi-machine autonomous fleet.

```
Operational Impact of Out-of-Band Telemetry Cutover
=============================================================================
Metric                              Before Cutover           After Cutover
=============================================================================
Daily Telemetry Commits on main     ~1,470 commits/day       0 commits/day
Push Rejections from Race Churn     30-50 per day            0 per day
Average Pull/Rebase Latency         4.8 seconds              0.2 seconds
Audit Archive Format                Unstructured JSONL       1 Daily UTC Partition
Telemetry Parity Score              N/A (Git Dependent)      11/11 Parity (100% OK)
Alert Storms on Host Outage         12-16 cascading pages    1 Grouped Host Incident
=============================================================================
```

By decoupling operational telemetry from Git commits, the fleet achieved complete repository stability:
- **Clean Version History:** The `git log` now reflects solely verified features, architectural improvements, and bug fixes.
- **Concurrent Worktree Isolation:** Multiple agents and human developers create branches, test changes, and push updates without encountering rebase conflicts caused by automated heartbeat commits.
- **Immediate Liveness Visibility:** The status of every host machine and agent worker is visible in real time via edge APIs and lightweight dashboards without touching Git clones.

---

## Conclusion: The First Law of Autonomous Custody

The transition from supervised AI coding assistants to unattended autonomous agent fleets is not merely a question of model intelligence. It is an infrastructure challenge.

When Anthropic confronted the scaling limits of source control, they addressed it at the cloud infrastructure layer by replacing Git with Scion to absorb tens of thousands of code changes.

For the rest of the software industry, the path forward is architectural discipline at the boundary. 

Before assuming that Git cannot support autonomous agents, teams must ensure they are not abusing their version control system as a message bus, a liveness monitor, and a scratchpad.

The first law of Stewardship Engineering is simple: **an agent must act as a custodian of the repository it inherits.** 

Treat version control as the permanent record of human and agent craftsmanship. Move operational telemetry out-of-band. Give your agents the freedom to run continuously around the clock without leaving a trace of operational debris in the code they exist to protect.
