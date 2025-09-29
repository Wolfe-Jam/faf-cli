# 🎨 FAF ASCII Art Platform - User Guide
**"From Zero to ASCII Hero in 30 Seconds"**

---

## 🚀 Quick Start (30 Seconds to Your First Art!)

### Step 1: View the Gallery (10 seconds)
```bash
faf art
```
See all 9 built-in styles: classic, v1, v2, retro, minimal, big, racing, neon, ascii

### Step 2: Create Your First Art (15 seconds)
```bash
faf submit-art
```
Follow the interactive wizard:
1. Name your art
2. Paste or type your ASCII
3. Save!

### Step 3: Use Your Art (5 seconds)
```bash
faf score --art-style user:yourartname
```

**🏆 Congratulations! You're an ASCII Artist!**

---

## 📚 Complete Command Reference

### Viewing Art

#### See All Styles
```bash
faf art                    # View all art styles
faf art -i                 # Interactive style selector
faf art gallery            # View user submissions
faf art gallery racing     # Filter gallery by keyword
```

#### Use Specific Styles
```bash
faf --art-style classic    # Classic 3D FAF
faf --art-style racing     # F1 racing theme
faf --art-style big        # BIG ORANGE (99%+ scores)
faf --art-style random     # Surprise me!
faf --art-style user:myart # Your custom art
```

### Creating Art

#### Submit New Art
```bash
faf submit-art
```

**Input Methods**:
1. **Type/Paste**: Enter directly in terminal
2. **Load from File**: Point to existing .txt file
3. **Use Editor**: Opens system editor (vim/nano/etc)

**Pro Tips**:
- Use `{version}` as placeholder for version number
- Press Enter twice to finish inline input
- Set score requirements to unlock at certain levels

#### ASCII Editor (Coming Soon)
```bash
faf ascii-edit            # Launch interactive editor
faf ascii-new --size 80x24 # Create new canvas
faf ascii-templates        # Browse starter templates
```

### Sharing Art

#### Export Your Art
```bash
faf art share myartname    # Generate shareable code
```
Creates a base64-encoded string others can import

#### Import Shared Art
```bash
faf art import <code>      # Import someone's art
```
Paste the shared code to add to your gallery

---

## 🎨 Design Principles

### The Open-Ended Revolution

**❌ NEVER USE VERTICAL LINES IN FRAMES**
```
BAD:  ║ Text ║    # Causes misalignment
GOOD: 🏁 Text 🏁  # Open-ended, no misalignment
```

### Approved Characters

#### Horizontal Lines
```
═══  Double lines (strong)
───  Single lines (standard)
━━━  Heavy lines (emphasis)
╌╌╌  Dashed lines (subtle)
```

#### Blocks & Shading
```
███  Full blocks
▓▓▓  Dark shade (75%)
▒▒▒  Medium shade (50%)
░░░  Light shade (25%)
```

#### Edge Markers (Bookends)
```
🏁 ... 🏁  Racing flags (99%+ scores)
🍊 ... 🍊  Oranges (105% Big Orange)
✨ ... ✨  Sparkles (85%+ trust)
☑️ ... ☑️  Checkmarks (70%+ progress)
🚀 ... 🚀  Rockets (starting)
```

---

## 🎯 Score-Based Art System

Your FAF score determines which art style displays:

| Score | Art Style | Description |
|-------|-----------|-------------|
| 105%+ | 🍊 BIG ORANGE | Maximum achievement |
| 99%+ | 🏁 RACING | Championship mode |
| 90%+ | 🏎️ RACING | F1 telemetry |
| 80%+ | ✨ NEON | Cyberpunk vibes |
| 70%+ | ☑️ CLASSIC | 3D FAF logo |
| 60%+ | V2 | Gradient style |
| 50%+ | V1 | Simple boxes |
| <50% | MINIMAL | Clean & simple |

---

## 📝 Creating Perfect ASCII Art

### Template: Basic Score Card
```
☑️ ══════════════════════════════ ☑️
    Your Score: 85%
    Status: Trust Achieved
☑️ ══════════════════════════════ ☑️
```

### Template: Racing Telemetry
```
🏁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🏁
    LAP TIME: <50ms
    SECTOR 1: ✅  SECTOR 2: ✅
    DRS: ENABLED
🏁 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🏁
```

### Template: Big Orange Achievement
```
🍊 ═════════════════════════════ 🍊
    ███ 105% BIG ORANGE ███
    MAXIMUM OVERDRIVE!
🍊 ═════════════════════════════ 🍊
```

---

## 🎮 Interactive Features

### ASCII Art Gateway

Access the gateway through:
```bash
faf about -i
```

Menu Options:
- 👀 View all art styles
- 🎨 Submit new ASCII art  
- 🏦 Browse community gallery
- 🎮 Interactive style selector
- 📤 Share your art
- 📥 Import shared art

### Score Requirements

When submitting art, set minimum scores:
- **0%**: Available to everyone
- **50%**: Halfway milestone
- **70%**: Good progress
- **85%**: Trust achieved
- **99%**: Champions only
- **105%**: BIG ORANGE exclusive

---

## 💡 Pro Tips

### 1. Perfect Alignment
- Use monospace fonts only
- Count characters carefully
- Test in different terminals
- Avoid tabs, use spaces

### 2. Version Placeholders
```
FAF v{version}  →  FAF v2.4.0
```

### 3. Testing Your Art
```bash
# Preview in different contexts
faf --art-style user:myart
faf score --art-style user:myart
faf init --art-style user:myart
```

### 4. Batch Operations
```bash
# Apply art to multiple commands
export FAF_ART_STYLE=user:myart
faf score  # Uses your art
faf init   # Uses your art
```

---

## 🏆 Achievements (Coming Soon)

### Unlock Badges
- **First Lap**: Create first ASCII art
- **Open-Ended Master**: Art with no verticals
- **Gallery Famous**: 10+ likes on your art
- **ASCII Champion**: 50+ creations
- **Big Orange Artist**: Art at 105% score

---

## 🔧 Troubleshooting

### Common Issues

#### Art Not Displaying
```bash
# Check if art exists
faf art gallery | grep yourartname

# Verify art name
faf art share yourartname
```

#### Alignment Problems
- Remove ALL vertical lines (| │ ║)
- Use open-ended design
- Check for mixed tabs/spaces
- Ensure monospace font

#### Import Failing
- Verify base64 code is complete
- No extra spaces/newlines
- Use quotes around code

---

## 🚀 Advanced Techniques

### Layered Compositions
```
Background: ░░░░░░░░░░░░░
Midground:  ▒▒▒▒▒▒▒▒▒
Foreground: █████
```

### Gradient Effects
```
░▒▓█ Light to dark
█▓▒░ Dark to light
```

### Pattern Library
```
Checkerboard: █ █ █
              █ █ 
              █ █ █

Dots: ········
Stars: ✩✩✩✩✩
Waves: ∽∽∽∽∽
```

---

## 🌐 Community & Support

### Share Your Creations
1. Submit to gallery: `faf submit-art`
2. Share on social: #FafAsciiArt
3. Join discussions: github.com/faf/ascii

### Get Help
- GitHub Issues: Report bugs
- Discord: Real-time chat
- Gallery: Learn from others

### Contributing
- Submit templates
- Improve documentation  
- Report alignment issues
- Suggest features

---

## 🎆 What's Coming Next

### CLI Editor (v2.5.0)
- Terminal-based drawing
- Mouse support
- Layers & undo
- Macro recording

### Web App (v3.0.0)
- Browser-based editor
- Live collaboration
- Cloud storage
- Mobile support

### AI Integration (Future)
- Text-to-ASCII
- Style transfer
- Auto-completion
- Pattern suggestions

---

## 🏁 Final Words

**Remember the Golden Rule:**
> "No vertical lines = No misalignment = Happy ASCII"

Every character you place is intentional. Every design is valid. You literally cannot make a mistake in the FAF ASCII Platform.

Now go create something amazing! 🎨✨

---

## 📦 Appendix: Complete Character Reference

### Box Drawing (Approved)
```
Horizontal: ─ ━ ╌ ╍ ═
Corners: ┌ ┐ └ ┘ ╔ ╗ ╚ ╝
Junctions: ┬ ┴ ┼ ╠ ╣ ╦ ╩
```

### Blocks
```
Solid: █ ▉ ▊ ▋ ▌ ▍ ▎ ▏
Shade: ░ ▒ ▓
```

### Symbols
```
Arrows: ← ↑ → ↓ ↔ ↕ ⇐ ⇒
Shapes: ■ □ ● ○ ◆ ◇ ☆ ★
```

### Emojis (Platform Safe)
```
Flags: 🏁 🏳️ 🏴
Items: 🍊 ✨ 🚀 🏎️ 🏆 📈
Checks: ✅ ☑️ ❌ ⭕
```

---

*FAF ASCII User Guide v1.0*
*"Where Every Line is the Finish Line"* 🏁