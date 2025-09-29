#!/bin/bash
# 🩵 FAF Discussions Monitor - Real-time alerts for community engagement

set -e

# FAF cyan color
CYAN='\033[36m'
RESET='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}🩵 FAF Discussions Monitor${RESET}"
echo -e "${CYAN}Watching for new comments on GitHub Discussions...${RESET}"
echo ""

# Store last known comment count
LAST_COUNT_FILE="/tmp/.faf-discussions-count"

# Initialize count file if doesn't exist
if [ ! -f "$LAST_COUNT_FILE" ]; then
    echo "0" > "$LAST_COUNT_FILE"
fi

while true; do
    # Use gh's built-in formatting instead of jq
        DISCUSSIONS=$(gh api graphql -f query='
        query {
          repository(owner: "Wolfe-Jam", name: "faf") {
            discussions(first: 10, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                number
                title
                updatedAt
                comments {
                  totalCount
                }
              }
            }
          }
        }' --jq '.data.repository.discussions.nodes[] | "\(.number)|\(.title)|\(.comments.totalCount)|\(.updatedAt)"' 2>/dev/null)

    if [ -n "$DISCUSSIONS" ]; then
        # Count total comments
        TOTAL_COMMENTS=0
        while IFS='|' read -r num title count updated; do
            TOTAL_COMMENTS=$((TOTAL_COMMENTS + count))
        done <<< "$DISCUSSIONS"

        LAST_COUNT=$(cat "$LAST_COUNT_FILE")

        # Check for new comments
        if [ "$TOTAL_COMMENTS" -gt "$LAST_COUNT" ]; then
            echo -e "${CYAN}${BOLD}🔔 New Activity Detected!${RESET}"

            # Show recent discussions with comments
            while IFS='|' read -r num title count updated; do
                if [ "$count" -gt 0 ]; then
                    echo "Discussion #$num: $title"
                    echo "  💬 $count comments (updated: $updated)"
                    echo ""
                fi
            done <<< "$DISCUSSIONS"

            # Play system notification sound if available
            if command -v afplay &> /dev/null; then
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
            fi

            # Send macOS notification if available
            if command -v osascript &> /dev/null; then
                osascript -e "display notification \"New comments in FAF discussions!\" with title \"🩵 FAF Community\" subtitle \"Check GitHub Discussions\""
            fi

            echo "$TOTAL_COMMENTS" > "$LAST_COUNT_FILE"
            echo -e "${CYAN}─────────────────────────────${RESET}"
        fi

        # Show summary every 5 minutes
        if [ $(($(date +%s) % 300)) -lt 30 ]; then
            DISCUSSION_COUNT=$(echo "$DISCUSSIONS" | wc -l | tr -d ' ')
            echo -e "${CYAN}📊 Status: $DISCUSSION_COUNT discussions tracked, $TOTAL_COMMENTS total comments${RESET}"
        fi
    fi

    # Wait 30 seconds before next check
    sleep 30
done