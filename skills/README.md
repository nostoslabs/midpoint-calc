# Agent Skills

Pre-built skill definitions for AI agents to use the Midpoint Calculator API.

## Installation

### OpenClaw

Copy or symlink `skills/openclaw/` into your OpenClaw skills directory:

```bash
# Project-level
cp -r skills/openclaw /path/to/your/project/skills/midpoint

# Global
cp -r skills/openclaw ~/.openclaw/skills/midpoint
```

Then use `/midpoint` in your OpenClaw session.

### Claude Code

Copy or symlink `skills/claude/` into your Claude Code skills directory:

```bash
# Project-level
cp -r skills/claude /path/to/your/project/.claude/skills/midpoint

# Global (all projects)
cp -r skills/claude ~/.claude/skills/midpoint
```

Then use `/midpoint` in Claude Code.

### Other agents

The `AGENT_README.md` in the project root has the full API reference. Any agent that can make HTTP GET requests can use the API directly at:

```
https://midpointcalc.vercel.app/api/midpoint?a=ADDRESS_A&b=ADDRESS_B&mode=drivetime&radius=3000
```
