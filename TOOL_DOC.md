# Fish History Analysis Project Documentation

## Overview

This project provides a comprehensive analysis toolkit for fish shell command history. It includes an anonymized sample dataset (`fish-history-sample.txt`) containing 16,006 command entries and offers multiple interfaces for exploration and analysis.

## Analysis Tools

### fish-query.sh
Fast command-line queries for common operations.

```bash
./fish-query.sh <command> [args...]
```

| Command | Description |
|:-------|:------------|
| `stats` | Basic statistics overview |
| `search <term>` | Simple text search |
| `top [n]` | Top commands list |
| `recent [n]` | Recent commands |
| `git-stats` | Git command breakdown |
| `count <term>` | Count occurrences |
| `unique` | Unique vs total command analysis |
| `longest` | Longest commands by character count |

Returns human-readable terminal output.

### analyze-history.js
Comprehensive statistical analysis and report generation.

```bash
node analyze-history.js [path-to-fish-history-sample.txt]
```

Data processing pipeline:
```
Raw        Parse/                   Reverse     Detect
File   →   Filter →   Normalize  →  Order   →  Session  →  Categorize  →  Analyze
   ↓         ↓          ↓             ↓           ↓            ↓            ↓
16K lines  Commands   Base+         Oldest    24 Sessions  By Type       Stats/Insights
                      Full          First
```

Generates `fish-history-analysis.md` with comprehensive analysis.

### query-history.js
Flexible querying and data exploration.

```bash
node query-history.js <history-file> <query-type> [args...]
```

| Command | Description |
|:-------|:------------|
| `search <pattern>` | Find commands matching regex pattern |
| `top [n]` | Show most frequent commands |
| `git-analysis` | Git-specific usage breakdown |
| `projects` | Project directory analysis based on cd commands |
| `evolution <command>` | Track command usage over time |
| `workflows [window-size]` | Find common command sequences |
| `sessions` | Session summary information |
| `recent [n]` | Most recent commands |
| `time-slice <start%> <end%>` | Commands from specific time period |

Returns JSON-formatted results for programmatic processing.

## Technical Architecture

### Dependencies
Uses plain Node.js with no external dependencies - completely self-contained using only built-in modules (`fs`, `path`).


### Key Algorithms

| Algorithm | Technique | Purpose |
|:----------|:----------|:--------|
| Session Detection | Exit/logout commands, heuristic patterns, minimum size filtering | Identify natural breakpoints in command sequences |
| Command Evolution | Temporal bucketing (10 periods), frequency tracking | Track command usage changes over time |
| Workflow Recognition | Sliding window analysis, sequence counting | Find common command patterns and workflows |

## File Structure
```
fish-history-project/
├── DOC.md                      # This documentation
├── CLAUDE.md                   # Claude Code instructions
├── .gitignore                  # Git ignore rules
├── fish-history-sample.txt     # Anonymized sample history data
├── fish-history-analysis.md    # Generated analysis report (ignored in git)
├── analyze-history.js          # Main analysis engine
├── query-history.js            # Interactive query tool
└── fish-query.sh               # Bash utility script
```

## Sample Data Insights

The following insights are derived from analysis of the included `fish-history-sample.txt` file:

#### Command Distribution

| Metric | Value | Details |
|:-------|:------|:--------|
| Git commands | 28.9% | Version control dominance |
| File operations | 24.0% | ls, cd, rm, cp, mv, mkdir |
| Text processing | 6.8% | grep, sed, awk, more |
| Development tools | 4.2% | npm, node, python, make |

#### Usage Patterns

| Metric | Value | Details |
|:-------|:------|:--------|
| Total commands | 16,006 | Complete history archive |
| Unique commands | 15,660 | 97.8% unique (low repetition) |
| Average session length | 666 | Commands per session |
| Detected sessions | 24 | Varying lengths |

#### Workflows

| Metric | Value | Details |
|:-------|:------|:--------|
| Primary patterns | Git operations | Commit, push, pull sequences |
| Secondary patterns | File navigation | cd chains, ls exploration |
| Tertiary patterns | Text processing | Search and filter operations |

## Usage Examples

| Task | Command | Description |
|:-----|:--------|:------------|
| Generate Full Analysis | `node analyze-history.js fish-history-sample.txt` | Creates fish-history-analysis.md with comprehensive report |
| Find Docker Usage | `node query-history.js fish-history-sample.txt search "docker"` | Returns all commands containing "docker" |
| Quick Git Statistics | `./fish-query.sh git-stats` | Shows git command breakdown and usage |
| Analyze Command Evolution | `node query-history.js fish-history-sample.txt evolution npm` | Shows how npm usage changed over time |
| Find Workflow Patterns | `node query-history.js fish-history-sample.txt workflows 3` | Shows common 3-command sequences |

## Development Notes

### Design Philosophy
The project is self-contained with no external dependencies, providing multiple interfaces (command-line, programmatic, and interactive) for data exploration. All analysis is read-only and never modifies source data, with efficient processing optimized for large history files.

### Extension Points
New query types can be added to the `query-history.js` query handler, while additional categories can be extended in `analyze-history.js`. Custom analysis can use the base `FishHistoryAnalyzer` class, and report generation can be modified for different output formats.

### Performance Characteristics
The system loads the entire history into memory for analysis, providing sub-second processing for files under 1MB with linear complexity scaling based on history file size.
