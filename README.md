# Stewardship Engineering

Operating an AI agent as a **custodian of your work**: running it unattended, accountably, over months. Bounded authority on your behalf, accountable for what it does, preserving what it is entrusted with over time.

Getting an agent to *act* is the solved half (Mitchell Hashimoto named it: harness engineering). Getting one you can *walk away from* is the other half. Everyone is discovering the loop right now; the loop gives you unattended execution. It says nothing about unattended **authority**. Stewardship engineering is the layer that decides what an unattended agent is allowed to do, and earns it more as the record holds.

This is the umbrella. It is a **discipline and a stack, not one binary** — the way SRE is a set of practices and tools, not a single repo. The pieces below are the public components.

## The manifesto

The full argument, the ladder (prompt → context → harness → stewardship), the keystone mechanism, and the honest status:

**[Stewardship Engineering: How Agents Earn Autonomy](https://emmanuel.prouveze.fr/writing/stewardship-engineering)**

## The components

| Piece | Repo | Role |
|---|---|---|
| **heartbeat** | [eprouveze/heartbeat](https://github.com/eprouveze/heartbeat) | The loop. An autonomous work loop for a Claude Code session: wakes itself, checks ground truth, advances one item per tick inside a hard envelope, logs every tick, queues anything irreversible to the human. |
| **rightmodel** | [eprouveze/rightmodel](https://github.com/eprouveze/rightmodel) | The routing-and-trust substrate. A taint → availability → capability → cost cascade, a multi-provider council, and a falsifiable **outcome ledger** that earns autonomy per model and task-class. |

## The core idea

Authority is not granted once. Before any significant action, the agent writes a falsifiable prediction to an append-only **outcome ledger**; a deliberately dumb verifier settles it later. Authority is then a live meter, recomputed from the record, kept per model and per task-class. It widens as predictions hold and narrows the moment they slip. There is no certificate to bank. "Autonomous" and "unsupervised" turn out to be different words, and the distance between them is what gets earned.

## License

MIT.
