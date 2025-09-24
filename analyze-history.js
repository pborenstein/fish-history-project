#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class FishHistoryAnalyzer {
  constructor(historyFile) {
    this.historyFile = historyFile
    this.commands = []
    this.sessions = []
    this.stats = {
      totalCommands: 0,
      uniqueCommands: 0,
      sessions: 0,
      avgCommandsPerSession: 0
    }
  }

  parseHistory() {
    console.log('Reading history file...')
    const content = fs.readFileSync(this.historyFile, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    
    this.commands = lines.map((line, index) => {
      const command = line.trim()
      if (command) {
        return {
          lineNumber: index + 1,
          command: command,
          baseCommand: command.split(' ')[0],
          fullLine: line
        }
      }
      return null
    }).filter(cmd => cmd !== null)

    // Reverse to get chronological order (oldest first, since file has newest at top)
    this.commands.reverse()
    
    this.stats.totalCommands = this.commands.length
    console.log(`Parsed ${this.stats.totalCommands} commands`)
  }

  detectSessions() {
    console.log('Detecting session boundaries...')
    
    const sessionBoundaries = [
      'exit',
      'tmux',
      'logout',
      'shutdown',
      'reboot'
    ]
    
    let currentSession = []
    let sessionStart = 0
    
    this.commands.forEach((cmd, index) => {
      currentSession.push(cmd)
      
      // Check if this command indicates session end
      const isSessionEnd = sessionBoundaries.some(boundary => 
        cmd.command.startsWith(boundary)
      )
      
      // Also detect potential session breaks by looking for long sequences of cd commands
      // or when we see typical "start of session" patterns
      const isNewSessionStart = (
        cmd.command === 'cd' || 
        cmd.command === 'cd ~' ||
        cmd.command.startsWith('tmux') ||
        cmd.command === 'ls'
      ) && currentSession.length > 50
      
      if (isSessionEnd || isNewSessionStart || index === this.commands.length - 1) {
        this.sessions.push({
          id: this.sessions.length + 1,
          startLine: sessionStart,
          endLine: index,
          commands: [...currentSession],
          commandCount: currentSession.length,
          endedWith: isSessionEnd ? cmd.command : 'unknown'
        })
        
        currentSession = []
        sessionStart = index + 1
      }
    })
    
    this.stats.sessions = this.sessions.length
    this.stats.avgCommandsPerSession = Math.round(this.stats.totalCommands / this.stats.sessions)
    
    console.log(`Detected ${this.stats.sessions} sessions`)
  }

  categorizeCommands() {
    console.log('Categorizing commands...')
    
    const categories = {
      'Version Control': ['git', 'hg', 'svn'],
      'File Operations': ['ls', 'cd', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'find', 'fd', 'locate'],
      'Text Processing': ['more', 'less', 'cat', 'head', 'tail', 'grep', 'sed', 'awk', 'sort', 'uniq', 'wc'],
      'Development': ['npm', 'node', 'python', 'python3', 'make', 'cargo', 'go', 'javac', 'gcc'],
      'Package Management': ['brew', 'apt', 'yum', 'pip', 'gem'],
      'System': ['ps', 'top', 'htop', 'kill', 'sudo', 'chmod', 'chown', 'df', 'du'],
      'Network': ['curl', 'wget', 'ssh', 'scp', 'ping', 'dig', 'nslookup'],
      'Editors': ['vim', 'nano', 'emacs', 'code', 'bbedit', 'subl'],
      'Terminal/Session': ['tmux', 'screen', 'exit', 'logout', 'clear'],
      'Archives': ['tar', 'zip', 'unzip', 'gzip', 'gunzip'],
      'Docker': ['docker', 'docker-compose'],
      'Other': []
    }

    this.commandsByCategory = {}
    Object.keys(categories).forEach(cat => {
      this.commandsByCategory[cat] = []
    })

    this.commands.forEach(cmd => {
      let categorized = false
      
      for (const [category, commands] of Object.entries(categories)) {
        if (commands.includes(cmd.baseCommand)) {
          this.commandsByCategory[category].push(cmd)
          categorized = true
          break
        }
      }
      
      if (!categorized) {
        this.commandsByCategory['Other'].push(cmd)
      }
    })

    console.log('Commands categorized')
  }

  getTopCommands(n = 20) {
    const commandCounts = {}
    
    this.commands.forEach(cmd => {
      commandCounts[cmd.baseCommand] = (commandCounts[cmd.baseCommand] || 0) + 1
    })
    
    return Object.entries(commandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, n)
      .map(([command, count]) => ({ command, count }))
  }

  getFullCommandFrequency(n = 20) {
    const commandCounts = {}
    
    this.commands.forEach(cmd => {
      const cleanCmd = cmd.command.trim()
      commandCounts[cleanCmd] = (commandCounts[cleanCmd] || 0) + 1
    })
    
    return Object.entries(commandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, n)
      .map(([command, count]) => ({ command, count }))
  }

  analyzeGitUsage() {
    const gitCommands = this.commands.filter(cmd => cmd.baseCommand === 'git')
    const gitSubcommands = {}
    
    gitCommands.forEach(cmd => {
      const parts = cmd.command.split(' ')
      const subcommand = parts[1] || 'unknown'
      gitSubcommands[subcommand] = (gitSubcommands[subcommand] || 0) + 1
    })
    
    return Object.entries(gitSubcommands)
      .sort(([,a], [,b]) => b - a)
      .map(([subcommand, count]) => ({ subcommand, count }))
  }

  generateReport() {
    console.log('Generating analysis report...')
    
    const topCommands = this.getTopCommands(15)
    const topFullCommands = this.getFullCommandFrequency(10)
    const gitAnalysis = this.analyzeGitUsage()
    
    let report = `# Fish History Analysis Report
Generated: ${new Date().toISOString()}

## Overview
- **Total Commands**: ${this.stats.totalCommands.toLocaleString()}
- **Detected Sessions**: ${this.stats.sessions}
- **Average Commands per Session**: ${this.stats.avgCommandsPerSession}
- **History Range**: Line ${this.commands[0].lineNumber} to ${this.commands[this.commands.length - 1].lineNumber}

## Top ${topCommands.length} Commands by Frequency
| Rank | Command | Count | Percentage |
|------|---------|-------|------------|
`
    
    topCommands.forEach((item, index) => {
      const percentage = ((item.count / this.stats.totalCommands) * 100).toFixed(1)
      report += `| ${index + 1} | \`${item.command}\` | ${item.count} | ${percentage}% |\n`
    })

    report += `
## Commands by Category
`
    
    Object.entries(this.commandsByCategory).forEach(([category, commands]) => {
      if (commands.length > 0) {
        const percentage = ((commands.length / this.stats.totalCommands) * 100).toFixed(1)
        report += `- **${category}**: ${commands.length} commands (${percentage}%)\n`
      }
    })

    report += `
## Git Usage Analysis
Git commands represent ${((gitAnalysis.reduce((sum, item) => sum + item.count, 0) / this.stats.totalCommands) * 100).toFixed(1)}% of all commands.

### Top Git Subcommands
| Subcommand | Count |
|------------|-------|
`
    
    gitAnalysis.slice(0, 10).forEach(item => {
      report += `| \`git ${item.subcommand}\` | ${item.count} |\n`
    })

    report += `
## Most Repeated Full Commands
| Command | Count |
|---------|-------|
`
    
    topFullCommands.forEach(item => {
      report += `| \`${item.command.length > 60 ? item.command.substring(0, 60) + '...' : item.command}\` | ${item.count} |\n`
    })

    report += `
## Session Analysis
`
    
    this.sessions.slice(0, 5).forEach((session, index) => {
      report += `### Session ${session.id} (Recent Activity)
- Commands: ${session.commandCount}
- Line range: ${session.commands[0]?.lineNumber} - ${session.commands[session.commands.length - 1]?.lineNumber}
- Ended with: \`${session.endedWith}\`

`
    })

    return report
  }

  async run() {
    console.log('Fish History Analyzer Starting...\n')
    
    try {
      this.parseHistory()
      this.detectSessions()
      this.categorizeCommands()
      
      const report = this.generateReport()
      
      // Write report to file
      const reportFile = path.join(path.dirname(this.historyFile), 'fish-history-analysis.md')
      fs.writeFileSync(reportFile, report)
      
      console.log(`\nAnalysis complete! Report saved to: ${reportFile}`)
      
      // Also output a summary to console
      console.log('\n=== QUICK SUMMARY ===')
      console.log(`Total commands: ${this.stats.totalCommands.toLocaleString()}`)
      console.log(`Sessions detected: ${this.stats.sessions}`)
      console.log(`Top command: ${this.getTopCommands(1)[0].command} (${this.getTopCommands(1)[0].count} times)`)
      
    } catch (error) {
      console.error('Error during analysis:', error.message)
      process.exit(1)
    }
  }
}

// Run the analyzer
if (require.main === module) {
  const historyFile = process.argv[2] || './fish-history-sample.txt'
  
  if (!fs.existsSync(historyFile)) {
    console.error(`History file not found: ${historyFile}`)
    console.log('Usage: node analyze-history.js [path-to-fish-history.txt]')
    process.exit(1)
  }
  
  const analyzer = new FishHistoryAnalyzer(historyFile)
  analyzer.run()
}

module.exports = FishHistoryAnalyzer