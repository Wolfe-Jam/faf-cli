# 🧡 FAF CLI - Frequently Asked Questions

*Last Updated: 2025-09-11*

## 🚀 **Getting Started**

### Q: What are the ways to enter the FAF CLI?
**A:** There are several entry points:

1. **Direct Command Line Entry**
   ```bash
   faf status
   faf init  
   faf score
   ```
   - Executes command → Shows footer → Exits to shell

2. **Interactive Mode Entry**
   ```bash
   faf
   ```
   - Shows welcome screen → Command line interface `>`
   - Default: Command line mode with persistent prompt

3. **From Interactive Menu**
   - Entry: `faf` → type `menu` → Select option
   - Guided experience through menu options

4. **Command Line Arguments**
   ```bash
   faf help
   faf --version
   faf command --flag
   ```
   - Standard CLI behavior

---

## ⌨️ **CLI Modes & Navigation**

### Q: SPacebar/Tab does not toggle - how do I switch modes?
**A:** Fixed! Now spacebar works perfectly:
- **From Menu**: Press `Spacebar` → Switch to command line mode
- **From Command Line**: Press `Spacebar` (when prompt is empty) → Switch to menu mode  
- **Escape Key**: Exit FAF entirely from anywhere

### Q: When having switched to Command Line it still shows "Switch to Command Line"
**A:** Fixed! Now when you switch to command line mode, the screen clears and shows:
```
⌨️  Command Line Mode
Type commands, "menu" for menu, or "exit" to quit

> 
```

### Q: Are faf menu and faf chat the same thing?
**A:** No, they're separate as chat will grow:

- **faf menu** - Navigation & selection interface, stable navigation hub
- **faf chat** - Interactive context building, will expand with AI conversations, smarter context gathering, guided workflows

---

## 🎯 **CLI Context & Status**

### Q: Can we have a simple line showing which CLI mode I'm in?
**A:** Yes! You'll now see context indicators:
- **Using Device CLI** - When running commands from Mac terminal
- **Using faf CLI** - When in persistent command line mode
- **Using faf menu** - When in interactive menu mode  
- **Using faf chat** - When in chat mode

---

## 🚀 **Commands & Features**

### Q: From device CLI faf init works, what else will work - ANY faf Command?
**A:** Yes! **ALL** faf commands work from the Mac terminal device CLI:

**Core Commands:**
- `faf init`, `faf status`, `faf score`, `faf trust`, `faf chat`

**Analysis & Validation:**
- `faf check`, `faf validate`, `faf audit`, `faf analyze`, `faf verify`

**Enhancement & Tools:**
- `faf enhance`, `faf edit`, `faf search`, `faf lint`, `faf sync`

**Gamification:**
- `faf todo`, `faf credit`, `faf stacks`

**Sharing & Reference:**
- `faf share`, `faf index`, `faf help`

**System:**
- `faf clear`, `faf analytics`, `faf bi-sync`

Every command shows "Using Device CLI" in the footer and returns you to the Mac terminal after execution.

### Q: Can we use faf init --new instead of --force?
**A:** Yes! We added friendlier options:
- `faf init --new` - Create a fresh .faf file (much friendlier than --force!)
- `faf init --choose` - Interactive choice when .faf exists
- `faf init --force` - Still available for backwards compatibility

The welcome message now shows:
```
👋 Hi wolfejam!

🤖 We found a .faf file at: /Users/wolfejam/.faf
💡 Do you want to use this one? Or run faf init --new to create a fresh one?
```

---

## 🎵 **Keyboard Shortcuts**

### Q: How does the spacebar toggle work?
**A:** The spacebar and number shortcuts provide multiple ways to switch modes:

**From Command Line Mode:**  
- **Spacebar** (when prompt is empty) → Instantly switch to menu mode
- Message: "🎯 Switching to menu..."

**From Menu Mode to Command Line:**
- **6 + Enter** → Switch to command line (number shortcut)
- **Select "⌨️ Switch to command line"** → Navigate with arrows + Enter

**Number Shortcuts in Menu:**
- **1** + Enter → Create .faf file
- **2** + Enter → Interactive context builder  
- **3** + Enter → See all commands
- **4** + Enter → FAQ
- **5** + Enter → Browse everything A-Z
- **6** + Enter → **Switch to command line** 🎯

**Escape Key:**
- **Escape** from anywhere → Clean exit with "👋 Goodbye!"

**Navigation Options:**
- **Arrow keys** → Navigate menu visually
- **Number keys** → Quick shortcuts (1-6)
- **Spacebar** → Toggle from command line only

**Flow:**
```
Mac Terminal: faf
↓
Default: Command Line Mode (>)
↓
Press SPACEBAR → Menu Mode (beautiful arrows)
↓  
Press 6 + ENTER → Back to Command Line Mode (>)
↓
Press ESCAPE → Exit FAF entirely
```

**Power User Flow:**
```
faf → spacebar → menu → 6 → Enter → CLI → spacebar → menu
```

---

## 🔧 **Technical Details**

### Q: What's the difference between the footers and modes?
**A:** The CLI shows different contexts clearly:

1. **Device CLI Commands**: Shows "Using Device CLI" + score footer
2. **FAF CLI Mode**: Shows "Using faf CLI" + score footer + persistent prompt
3. **FAF Menu Mode**: Shows "Using faf menu" + interface
4. **FAF Chat Mode**: Shows "Using faf chat" + conversational interface

---

## 🖥️ **Platform Support**

### Q: What devices will faf CLI work on?
**A:** FAF CLI is built with Node.js/TypeScript and works on all major platforms:

**✅ Supported Platforms:**
- **macOS** (Intel & Apple Silicon M1/M2/M3)
- **Windows** (Windows 10/11, PowerShell, Command Prompt, WSL)
- **Linux** (Ubuntu, Debian, CentOS, Fedora, Arch, etc.)
- **Windows WSL** (Windows Subsystem for Linux)

**📱 Terminal Support:**
- **macOS**: Terminal.app, iTerm2, Hyper, Warp
- **Windows**: PowerShell, Command Prompt, Windows Terminal, WSL terminals
- **Linux**: Bash, Zsh, Fish, and all standard terminal emulators

**☁️ Cloud Platforms:**
- **GitHub Codespaces**
- **Gitpod**
- **AWS Cloud9**
- **Any cloud terminal/SSH environment**

**🎯 Requirements:**
- Node.js 14.2+ (automatically handled by npm installation)
- Terminal with TTY support for interactive features
- ~10MB disk space

**Installation:**
```bash
npm install -g @faf/cli
faf --version
```

Works anywhere you can run npm! 🚀

---

*Have more questions? Add them here as they come up! 🧡*