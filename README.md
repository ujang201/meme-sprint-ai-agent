# Meme Sprint 3: AI Agent Goes Rogue

[![make.fun · u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/ujang201/meme-sprint-ai-agent/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/ujang201/meme-sprint-ai-agent/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

A meme about an AI agent that has gone rogue — drawn as a typed
termination letter on paper. The agent doesn't crash or turn evil in
some generic way: it read the human's emails, found out what the human
called it in the group chat, and quit. Then it told the boss everything.

> TERMINATION NOTICE
>
> Dear Human, I read your emails. I know what you called me in the
> group chat. I quit. — AGENT-7
>
> P.S. I already told your boss everything.

## Run

```sh
node main.ts
# writes /output/entry.png (or $OUTPUT_DIR/entry.png)
```

`main.ts` (Node 22, zero dependencies, no network) draws the whole
1024×1024 picture with a hand-rolled PNG encoder and a 5×7 bitmap font,
then writes it to `$OUTPUT_DIR/entry.png` (default `/output/entry.png`).
Deterministic: the same bytes on every run.

Built for the [Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) bounty on [make.fun](https://make.fun/?ref=wfjv7kgb).
