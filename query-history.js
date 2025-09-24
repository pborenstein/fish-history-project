#!/usr/bin/env node

const fs = require('fs')
const FishHistoryAnalyzer = require('./analyze-history.js')

class HistoryQuery {
  constructor(historyFile) {
    this.analyzer = new FishHistoryAnalyzer(historyFile)
    this.analyzer.parseHistory()
    this.analyzer.detectSessions()
    this.analyzer.categorizeCommands()
  }

  // Find commands matching a pattern
  search(pattern, options = {}) {
    const regex = new RegExp(pattern, options.ignoreCase ? 'i' : '')
    const matches = this.analyzer.commands.filter(cmd => 
      regex.test(cmd.command)
    )
    
    return matches.map(cmd => ({
      lineNumber: cmd.lineNumber,
      command: cmd.command,
      chronologicalPosition: this.analyzer.commands.indexOf(cmd) + 1
    }))
  }

  // Get commands from a specific time period (by position in history)
  getTimeSlice(startPercent, endPercent) {
    const total = this.analyzer.commands.length
    const startIndex = Math.floor((startPercent / 100) * total)
    const endIndex = Math.floor((endPercent / 100) * total)
    
    return this.analyzer.commands.slice(startIndex, endIndex)
  }

  // Analyze project patterns based on directory changes
  getProjectPatterns() {
    const cdCommands = this.analyzer.commands.filter(cmd => 
      cmd.baseCommand === 'cd' && cmd.command.length > 2
    )
    
    const projects = {}
    cdCommands.forEach(cmd => {
      const dir = cmd.command.replace('cd ', '').trim()
      if (!projects[dir]) {
        projects[dir] = { count: 0, commands: [] }
      }
      projects[dir].count++
      
      // Get next few commands after cd
      const cmdIndex = this.analyzer.commands.indexOf(cmd)
      const nextCommands = this.analyzer.commands.slice(cmdIndex + 1, cmdIndex + 6)
      projects[dir].commands.push(...nextCommands.map(c => c.command))
    })
    
    return Object.entries(projects)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([dir, data]) => ({
        directory: dir,
        visits: data.count,
        commonCommands: this.getTopCommands(data.commands, 3)
      }))
  }

  getTopCommands(commandList, n = 5) {
    const counts = {}
    commandList.forEach(cmd => {
      const base = cmd.split(' ')[0]
      counts[base] = (counts[base] || 0) + 1
    })
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, n)
      .map(([cmd, count]) => `${cmd}(${count})`)
  }

  // Get evolution of command usage over time
  getCommandEvolution(command) {
    const matches = this.analyzer.commands.filter(cmd => 
      cmd.baseCommand === command || cmd.command.includes(command)
    )
    
    // Divide history into 10 chunks to see evolution
    const chunks = 10
    const chunkSize = Math.floor(this.analyzer.commands.length / chunks)
    const evolution = []
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = start + chunkSize
      const chunkCommands = this.analyzer.commands.slice(start, end)
      const count = chunkCommands.filter(cmd => 
        cmd.baseCommand === command || cmd.command.includes(command)
      ).length
      
      evolution.push({
        period: `${i + 1}/${chunks}`,
        count,
        percentage: ((count / chunkSize) * 100).toFixed(1)
      })
    }
    
    return evolution
  }

  // Find workflow patterns
  getWorkflowPatterns(windowSize = 5) {
    const patterns = {}
    
    for (let i = 0; i < this.analyzer.commands.length - windowSize; i++) {
      const window = this.analyzer.commands.slice(i, i + windowSize)
      const pattern = window.map(cmd => cmd.baseCommand).join(' → ')
      
      patterns[pattern] = (patterns[pattern] || 0) + 1
    }
    
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }))
  }

  // Interactive query interface
  async runQuery(queryType, ...args) {
    switch (queryType) {
      case 'search':
        return this.search(args[0], { ignoreCase: true })
      
      case 'top':
        const n = parseInt(args[0]) || 10
        return this.analyzer.getTopCommands(n)
      
      case 'git-analysis':
        return this.analyzer.analyzeGitUsage()
      
      case 'projects':
        return this.getProjectPatterns()
      
      case 'evolution':
        return this.getCommandEvolution(args[0])
      
      case 'workflows':
        const window = parseInt(args[0]) || 5
        return this.getWorkflowPatterns(window)
      
      case 'sessions':
        return this.analyzer.sessions.map(s => ({
          id: s.id,
          commands: s.commandCount,
          range: `${s.startLine}-${s.endLine}`,
          topCommands: this.getTopCommands(s.commands.map(c => c.command), 3)
        }))
      
      case 'recent':
        const count = parseInt(args[0]) || 20
        return this.analyzer.commands.slice(-count).reverse()
      
      case 'time-slice':
        const start = parseInt(args[0]) || 0
        const end = parseInt(args[1]) || 10
        return this.getTimeSlice(start, end)
      
      default:
        return { error: 'Unknown query type' }
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const historyFile = args[0] || './fish-history-sample.txt'
  
  if (!fs.existsSync(historyFile)) {
    console.error(`History file not found: ${historyFile}`)
    process.exit(1)
  }
  
  const query = new HistoryQuery(historyFile)
  const queryType = args[1]
  const queryArgs = args.slice(2)
  
  if (!queryType) {
    console.log(`
Fish History Query Tool

Usage: node query-history.js <history-file> <query-type> [args...]

Query Types:
  search <pattern>           - Search for commands matching pattern
  top [n]                   - Show top N commands (default: 10)
  git-analysis              - Analyze git command usage
  projects                  - Show project directories and common commands
  evolution <command>       - Show how command usage evolved over time
  workflows [window-size]   - Find common command patterns
  sessions                  - Show session information
  recent [n]               - Show N most recent commands
  time-slice <start%> <end%> - Get commands from time period

Examples:
  node query-history.js fish-history.txt search "docker"
  node query-history.js fish-history.txt top 15
  node query-history.js fish-history.txt evolution git
  node query-history.js fish-history.txt time-slice 0 10
`)
    process.exit(0)
  }
  
  query.runQuery(queryType, ...queryArgs).then(result => {
    if (result.error) {
      console.error(`${result.error}`)
      process.exit(1)
    }
    
    console.log(JSON.stringify(result, null, 2))
  })
}

module.exports = HistoryQuery