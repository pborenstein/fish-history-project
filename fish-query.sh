#!/bin/bash

# Fish History Quick Query Utilities
HISTORY_FILE="fish-history-sample.txt"

show_help() {
    echo "Fish History Quick Query"
    echo ""
    echo "Usage: ./fish-query.sh <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  stats           - Show basic statistics"
    echo "  search <term>   - Search for commands containing term"
    echo "  top [n]        - Show top N commands (default: 10)"
    echo "  recent [n]     - Show N most recent commands (default: 20)"
    echo "  git-stats      - Show git command statistics"
    echo "  count <term>   - Count occurrences of term"
    echo "  unique         - Show unique command count"
    echo "  longest        - Show longest commands"
    echo ""
}

if [ ! -f "$HISTORY_FILE" ]; then
    echo "History file not found: $HISTORY_FILE"
    exit 1
fi

case "$1" in
    "stats")
        echo "Fish History Statistics"
        echo "========================"
        echo "Total commands: $(wc -l < "$HISTORY_FILE")"
        echo "Unique commands: $(sort "$HISTORY_FILE" | uniq | wc -l)"
        echo "Most common command: $(cut -d' ' -f1 "$HISTORY_FILE" | sort | uniq -c | sort -nr | head -1 | awk '{print $2 " (" $1 " times)"}')"
        echo "File size: $(du -h "$HISTORY_FILE" | cut -f1)"
        ;;
    
    "search")
        if [ -z "$2" ]; then
            echo "Please provide search term"
            exit 1
        fi
        echo "Commands containing '$2':"
        grep -n "$2" "$HISTORY_FILE" | head -20
        echo ""
        echo "Total matches: $(grep -c "$2" "$HISTORY_FILE")"
        ;;
    
    "top")
        n=${2:-10}
        echo "Top $n commands:"
        cut -d' ' -f1 "$HISTORY_FILE" | sort | uniq -c | sort -nr | head -$n | nl
        ;;
    
    "recent")
        n=${2:-20}
        echo "$n most recent commands:"
        head -$n "$HISTORY_FILE" | nl
        ;;
    
    "git-stats")
        echo "Git Command Statistics"
        echo "========================"
        echo "Total git commands: $(grep -c '^git' "$HISTORY_FILE")"
        echo ""
        echo "Top git subcommands:"
        grep '^git ' "$HISTORY_FILE" | cut -d' ' -f2 | sort | uniq -c | sort -nr | head -10 | nl
        ;;
    
    "count")
        if [ -z "$2" ]; then
            echo "Please provide term to count"
            exit 1
        fi
        count=$(grep -c "$2" "$HISTORY_FILE")
        echo "'$2' appears $count times"
        ;;
    
    "unique")
        unique_count=$(sort "$HISTORY_FILE" | uniq | wc -l)
        total_count=$(wc -l < "$HISTORY_FILE")
        echo "Unique vs Total Commands"
        echo "=========================="
        echo "Unique commands: $unique_count"
        echo "Total commands: $total_count"
        echo "Repetition rate: $(echo "scale=1; ($total_count - $unique_count) * 100 / $total_count" | bc)%"
        ;;
    
    "longest")
        echo "Longest commands:"
        awk '{print length, $0}' "$HISTORY_FILE" | sort -nr | head -10 | cut -d' ' -f2-
        ;;
    
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    
    *)
        echo "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac