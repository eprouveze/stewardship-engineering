# Stewardship Engineering

> **Official Site:** [stewardshipengineering.com](https://stewardshipengineering.com)  
> **Manifesto & Architecture Essay:** [Stewardship Engineering: How Agents Earn Autonomy](https://emmanuel.prouveze.fr/writing/stewardship-engineering)  
> **Author:** Emmanuel Prouvèze ([emmanuel.prouveze.fr](https://emmanuel.prouveze.fr))

Operating an AI agent as a **custodian of your work**: running it unattended, accountably, over months. Bounded authority on your behalf, accountable for what it does, preserving what it is entrusted with over time.

---

## The Problem

Getting an agent to *act* is the solved half. Mitchell Hashimoto named it **harness engineering**: building tools and environments so an agent acts correctly while you watch.

The unsolved half begins the moment you walk away. Putting an agent in a loop buys you unattended execution, not unattended authority. It will run a reckless action as faithfully as a careful one. What is the agent allowed to do at 3 AM? How do you know it is earning trust, rather than simply sounding confident? And how does working state survive when the host machine dies?

Stewardship engineering is the operational layer that decides what an unattended agent is allowed to do, and widens or narrows that envelope as an empirical record of predictions holds or slips.

---

## The Four Disciplines & The Six Rungs

Everyone building with AI agents is climbing the same ladder:

| Rung | Discipline | Operating Mode | Focus |
|:---:|:---|:---|:---|
| **1** | **Prompt Engineering** | Direct interaction | Framing instructions, zero/few-shot examples. |
| **2** | **Context Engineering** | Direct interaction | Shaping what the model sees (RAG, documentation, context curation). |
| **3** | **Harness Engineering** | Supervised | Equipping the agent with tools, bash scripts, and API wrappers. |
| **4** | **Harness Engineering** | Supervised | Environment configuration, deterministic test loops while watched. |
| **—** | **THE THRESHOLD** | **The line where you stop watching** | **Mistakes transition from caught outputs to unattended actions.** |
| **5** | **Stewardship Engineering** | Unattended | Bounded execution envelopes, prediction-settlement ledgers, durable memory. |
| **6** | **Stewardship Engineering** | Self-Improving | The agent uses its own verified track record to safely modify its tools and expand authority. |

---

## The Keystone: Earned Autonomy Loop

Trust cannot be granted once as a blanket permission, nor can it be based on model self-evaluations.

```
       ┌────────────────────────────────────────────────────────┐
       │                                                        │
       ▼                                                        │
┌──────────────┐      ┌──────────────┐      ┌─────────────┐     │
│ 1. PREDICT   │ ───► │ 2. ACT       │ ───► │ 3. VERIFY   │ ────┘
│ Falsifiable  │      │ Bounded by   │      │ Independent │
│ claim before │      │ strict blast │      │ dumb check  │
│ acting       │      │ radius       │      │ on horizon  │
└──────────────┘      └──────────────┘      └─────────────┘
                                                   │
                                                   ▼
                                         ┌───────────────────┐
                                         │ 4. ADJUST METER   │
                                         │ Widens on pass;   │
                                         │ narrows on fail   │
                                         └───────────────────┘
```

1. **Predict Before Acting**: Before executing a significant action, the agent writes a falsifiable prediction to an append-only **outcome ledger** (statement, check command, baseline, horizon).
2. **Bounded Action**: The agent executes within a tight blast-radius envelope. Reversible actions run freely; irreversible actions (spending money, production deploys, outbound messaging) halt at the boundary for human review.
3. **Independent Verification**: A deliberately dumb verifier settles the claim against operational reality (exit code, database assertion, or human review verdict).
4. **Dynamic Authority**: Authority is a live meter computed per model and per task class. It expands as predictions hold and snaps back the moment they fail.

---

## The Public Stack Components

Stewardship Engineering is an architectural doctrine implemented through three decoupled, open-source pillars:

| Component | Repository | Role |
|:---|:---|:---|
| **heartbeat** | [`eprouveze/heartbeat`](https://github.com/eprouveze/heartbeat) | **The Execution Loop.** An autonomous work loop for coding agents: wakes itself, evaluates cheap deterministic gates, advances one item per tick inside a hard envelope, and queues irreversible actions to human review. |
| **rightmodel** | [`eprouveze/rightmodel`](https://github.com/eprouveze/rightmodel) | **The Trust & Routing Substrate.** Taint → availability → capability → cost cascade, standing multi-model consensus council, and the falsifiable outcome ledger with anti-Goodhart guards. |
| **anamnesis** | [`eprouveze/anamnesis`](https://github.com/eprouveze/anamnesis) | **The Memory Substrate.** Persistent institutional memory as a git-native build artifact. Writes are commits, CI indexes and cryptographically signs via Sigstore/Cosign, and every client is a disposable local replica with sub-50ms MCP serving. |

---

## The Six Primitives

| Primitive | What It Is | Open Source Reference |
|:---|:---|:---|
| **The Envelope** | A blast-radius boundary that earned autonomy widens or narrows over time. | [`eprouveze/heartbeat`](https://github.com/eprouveze/heartbeat) |
| **The Outcome Ledger** | Falsifiable predictions settled by an independent verifier, feeding a per-model trust meter. | [`eprouveze/rightmodel`](https://github.com/eprouveze/rightmodel) |
| **Memory in Custody** | Knowledge durable across sessions and machines, free of single points of failure. | [`eprouveze/anamnesis`](https://github.com/eprouveze/anamnesis) |
| **Cost-Tiered Loop** | Cheap deterministic gate on every cycle; frontier models invoked only when actionable work exists. | [`eprouveze/heartbeat`](https://github.com/eprouveze/heartbeat) |
| **Model Routing + Council** | Cascade routing per task sensitivity and proven capability; multi-provider council for high-stakes calls. | [`eprouveze/rightmodel`](https://github.com/eprouveze/rightmodel) |
| **State in Git** | The agent's entire operational memory committed as plain files every cycle for instant recovery. | GitOps pattern |

---

## Related Reading

- [Stewardship Engineering: How Agents Earn Autonomy](https://emmanuel.prouveze.fr/writing/stewardship-engineering) — The founding manifesto
- [How I Gave My AI a Memory](https://emmanuel.prouveze.fr/writing/how-i-gave-my-ai-a-memory) — The genesis of Anamnesis
- [Memory as a Single Point of Failure](https://emmanuel.prouveze.fr/writing/memory-single-point-of-failure) — Distributed memory resilience
- [25 Billion Tokens](https://emmanuel.prouveze.fr/writing/25-billion-tokens) — Operating autonomous agent fleets at scale
- [My COO is an AI](https://emmanuel.prouveze.fr/writing/my-coo-is-an-ai) — Multi-model council decision architecture
- [Compound Engineering](https://emmanuel.prouveze.fr/writing/compound-engineering) — Systems that use their own tracking to build their next version
- [Phantom Pipeline & Liar Catcher](https://emmanuel.prouveze.fr/writing/phantom-pipeline-liar-catcher) — Why model self-reporting cannot be trusted

---

## References & Prior Art

- **Harness engineering:** Mitchell Hashimoto, [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey).
- **Levels of autonomy:** Feng, McDonald & Zhang, [Levels of Autonomy for AI Agents](https://knightcolumbia.org/content/levels-of-autonomy-for-ai-agents-1), Knight First Amendment Institute (arXiv:2506.12469).
- **Performance-gated autonomy tiers:** Vibhu Bhatnagar, [Trust-Earned Autonomy for AI Agents](https://arxiv.org/abs/2605.08912) (arXiv:2605.08912).
- **AgentOps:** [AgentOps: Enabling Observability of LLM Agents](https://arxiv.org/abs/2411.05285).
- **Cost-tiered cascades:** Chen, Zaharia & Zou, [FrugalGPT](https://arxiv.org/abs/2305.05176).
- **Multi-agent debate:** Du et al., [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325).
- **Robot self-assessment:** Conlon, Ahmed & Szafir, [Event-triggered robot self-assessment](https://www.frontiersin.org/articles/10.3389/frobt.2023.1294533/full) (ET-GOA).

---

## License

MIT © [Emmanuel Prouvèze](https://emmanuel.prouveze.fr)
