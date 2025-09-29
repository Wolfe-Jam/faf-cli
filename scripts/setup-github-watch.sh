#!/bin/bash
# 🩵 Setup GitHub Discussions Watching for FAF

echo "🩵 Setting up GitHub Discussions alerts for FAF..."
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install with: brew install gh"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Watch the repository
echo "📺 Watching FAF repository for activity..."
gh api -X PUT repos/Wolfe-Jam/faf/subscription \
    --field subscribed=true \
    --field ignored=false 2>/dev/null && echo "✅ Subscribed to repository notifications"

# Enable web notifications for discussions
echo "🔔 Enabling discussion notifications..."
gh api -X PUT repos/Wolfe-Jam/faf/notifications \
    --field discussions=true 2>/dev/null || echo "ℹ️  Notifications API not available (normal)"

echo ""
echo "🩵 Setup complete! You can now:"
echo "  1. Run ./scripts/watch-discussions.sh to monitor in terminal"
echo "  2. Check https://github.com/Wolfe-Jam/faf/discussions for activity"
echo "  3. View notifications at https://github.com/notifications"
echo ""
echo "💡 For best results, also enable notifications in GitHub web settings:"
echo "   https://github.com/settings/notifications"
echo ""
echo "Thank you for engaging with the FAF community! 🩵⚡"