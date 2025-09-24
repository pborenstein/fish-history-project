# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a fish shell history archive with 16,006 command entries stored in `fish-history-sample.txt`. The file contains a chronological record with the newest commands at the top and oldest at the bottom (reverse chronological order). The data has been anonymized to remove personal information.

## File Structure

- `fish-history-sample.txt` - Anonymized fish shell history archive (459KB, 16,006 lines)
- `analyze-history.js` - Main JavaScript analyzer for comprehensive analysis
- `query-history.js` - Interactive query tool for specific searches
- `fish-query.sh` - Quick bash utility for common queries
- `fish-history-analysis.md` - Generated analysis report

## Key Statistics

- Total commands: 16,006
- Unique commands: 15,660
- Most frequent command: `git` (4,622 times, 28.9%)
- Detected sessions: 24
- Average commands per session: 666

## Analysis Tools

### 1. Main Analyzer (Node.js)
```bash
node analyze-history.js fish-history-sample.txt
```
Generates comprehensive analysis report including:
- Command frequency analysis
- Session detection
- Category breakdowns
- Git usage patterns
- Workflow analysis

### 2. Interactive Query Tool (Node.js)
```bash
# Search for specific patterns
node query-history.js fish-history-sample.txt search "docker"

# Show top N commands
node query-history.js fish-history-sample.txt top 15

# Analyze command evolution over time
node query-history.js fish-history-sample.txt evolution git

# Find project patterns
node query-history.js fish-history-sample.txt projects

# Show workflow patterns
node query-history.js fish-history-sample.txt workflows

# Get recent commands
node query-history.js fish-history-sample.txt recent 50
```

### 3. Quick Bash Utility
```bash
# Basic statistics
./fish-query.sh stats

# Search for commands
./fish-query.sh search "npm"

# Top commands
./fish-query.sh top 10

# Recent commands  
./fish-query.sh recent 20

# Git-specific analysis
./fish-query.sh git-stats

# Count occurrences
./fish-query.sh count "docker"
```

## Key Insights

- **Git dominance**: Git commands represent 28.9% of all usage
- **File operations**: 24% of commands are file operations (ls, cd, rm, etc.)
- **Development focus**: Heavy use of npm, brew, and development tools
- **Session patterns**: Long-running sessions with 600+ commands on average
- **Workflow patterns**: Frequent git command chains and file manipulation sequences

## Command Categories

1. **Version Control** (28.9%): git, hg, svn
2. **File Operations** (24.0%): ls, cd, rm, cp, mv, mkdir
3. **Text Processing** (6.8%): more, grep, sed, awk
4. **Development** (4.2%): npm, node, python, make
5. **Package Management** (3.0%): brew, apt, pip
6. **Network** (2.9%): curl, ssh, dig
7. **Editors** (1.8%): bbedit, vim, code