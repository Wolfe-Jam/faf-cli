# ⌨️ Vi-Like ASCII Editor - Design Specification
**"The Power of Vi Meets the Art of ASCII"**

## 🎯 Core Philosophy

Vi's modal editing is PERFECT for ASCII art because:
- **Precision**: Every keystroke is intentional
- **Speed**: No mouse needed, pure keyboard flow
- **Patterns**: Repeat commands for patterns (`.` command!)
- **Muscle Memory**: Vi users already know the commands
- **Composable**: Combine movements with actions

---

## 🎮 Modal Architecture

### The Four Modes

```
┌─────────────┐
│ NORMAL MODE │ ← ESC from anywhere
└─────┬───────┘
      │
      ├──[i]──→ INSERT MODE (draw characters)
      ├──[v]──→ VISUAL MODE (select regions)
      └──[:]──→ COMMAND MODE (advanced operations)
```

---

## 🎨 NORMAL MODE - Navigation & Control

### Movement Commands
```
h j k l    - Move cursor left/down/up/right
H M L      - Jump to top/middle/bottom of canvas
gg         - Go to first line
G          - Go to last line
0 $        - Start/end of current line
w b        - Word forward/backward (jump over ASCII blocks)
W B        - WORD forward/backward (jump over spaces)
f<char>    - Find next <char> in line
F<char>    - Find previous <char> in line
t<char>    - Till before next <char>
T<char>    - Till after previous <char>
; ,        - Repeat last f/F/t/T forward/backward
```

### Jump Commands
```
5j         - Move down 5 lines
10l        - Move right 10 characters
20G        - Go to line 20
50|        - Go to column 50
%          - Jump to matching bracket/parenthesis
```

### Canvas Navigation
```
Ctrl-f     - Page down
Ctrl-b     - Page up
Ctrl-d     - Half page down
Ctrl-u     - Half page up
zz         - Center canvas on cursor
zt         - Cursor to top of view
zb         - Cursor to bottom of view
```

---

## ✏️ INSERT MODE - Drawing Characters

### Entering Insert Mode
```
i          - Insert at cursor
I          - Insert at start of line
a          - Append after cursor
A          - Append at end of line
o          - Open line below
O          - Open line above
s          - Substitute character (delete + insert)
S          - Substitute line
c          - Change (delete + insert)
C          - Change to end of line
```

### While in Insert Mode
```
<char>     - Place character at cursor
Backspace  - Delete previous character
Del        - Delete current character
Tab        - Insert 4 spaces (or jump to next tab stop)
Enter      - New line
Ctrl-t     - Indent line
Ctrl-d     - Dedent line
ESC        - Return to Normal mode
```

### Smart Insert Features
```
Ctrl-n     - Auto-complete from patterns
Ctrl-p     - Previous auto-complete suggestion
Ctrl-r=    - Insert calculated value (e.g., =80-10)
Ctrl-v<code> - Insert Unicode character by code
Ctrl-k<digraph> - Insert special character
```

---

## 👁️ VISUAL MODE - Selection & Manipulation

### Entering Visual Mode
```
v          - Character-wise visual mode
V          - Line-wise visual mode
Ctrl-v     - Block visual mode (PERFECT for ASCII!)
gv         - Reselect last visual selection
```

### Visual Mode Operations
```
d          - Delete selection
y          - Yank (copy) selection
c          - Change selection
r<char>    - Replace all selected with <char>
I          - Insert before each line (block mode)
A          - Append after each line (block mode)
~          - Toggle case
U          - Uppercase
u          - Lowercase
>          - Indent
<          - Dedent
```

### Block Mode Magic (Ctrl-v)
```
1. Ctrl-v  - Enter block mode
2. 10j5l   - Select 10 lines down, 5 chars right
3. r█      - Replace entire block with █

Or:
1. Ctrl-v  - Enter block mode
2. 20j     - Select 20 lines down
3. I║      - Insert ║ at start of each line
4. ESC     - Apply to all lines
```

---

## 💻 COMMAND MODE - Advanced Operations

### Basic Commands
```
:w              - Write (save) file
:w filename     - Save as filename
:q              - Quit
:q!             - Quit without saving
:wq             - Write and quit
:x              - Write if changed and quit
:e filename     - Edit (open) file
:new            - New canvas
:size 80x24     - Set canvas size
```

### ASCII-Specific Commands
```
:line x1,y1 x2,y2 [char]      - Draw line
:rect x1,y1 x2,y2 [char]      - Draw rectangle
:circle x,y radius [char]     - Draw circle
:fill [char]                  - Fill selection/region
:border [style]               - Add border (single/double/custom)
:center                       - Center current line/selection
:align left|right|center      - Align text/art
```

### Pattern Commands
```
:pattern checkerboard         - Fill with checkerboard
:pattern gradient █▓▒░        - Create gradient
:pattern dots                 - Fill with dot pattern
:pattern random █▓▒░          - Random fill from chars
```

### Transform Commands
```
:flip horizontal|vertical     - Flip selection
:rotate 90|180|270           - Rotate selection
:mirror                      - Mirror horizontally
:scale 2x                    - Double size
:shift up|down|left|right n - Shift by n positions
```

### Text Integration
```
:text "Hello World"          - Insert text at cursor
:figlet "FAF"               - ASCII art text
:font <fontname>            - Change figlet font
:banner "Message"           - Create banner
```

### Import/Export
```
:import image.png           - Convert image to ASCII
:export png                 - Export as PNG
:export svg                 - Export as SVG
:export faf-art            - Export for FAF
:share                     - Generate shareable code
```

---

## 🔄 Operators & Motions

### Operators (Actions)
```
d          - Delete
y          - Yank (copy)
c          - Change (delete + insert)
=          - Format/align
~          - Toggle case
gu         - Lowercase
gU         - Uppercase
!          - Filter through command
>          - Indent
<          - Dedent
```

### Combining Operators with Motions
```
dw         - Delete word
d$         - Delete to end of line
d0         - Delete to start of line
dG         - Delete to end of file
dd         - Delete entire line
3dd        - Delete 3 lines
dap        - Delete a paragraph
diB        - Delete inside Block {}
dt;        - Delete till semicolon
df│        - Delete to next │
```

### Text Objects (ASCII Aware)
```
iw         - Inner word (ASCII block)
aw         - A word (block + space)
iB         - Inner Block {}
aB         - A Block
i"         - Inner quotes
a"         - A quotes (including quotes)
it         - Inner tag (for ASCII boxes)
at         - A tag
ib         - Inner box (custom for ASCII)
ab         - A box (including border)
```

---

## 🎯 Registers & Macros

### Registers
```
"a         - Use register a
"ay        - Yank to register a
"ap        - Paste from register a
"A         - Append to register a
"+         - System clipboard
"*         - Primary selection
".         - Last inserted text
"%         - Current filename
":         - Last command
"/         - Last search
```

### Macros for ASCII Patterns
```
qa         - Start recording macro to register a
[actions]  - Perform your pattern
q          - Stop recording
@a         - Play macro from register a
@@         - Repeat last macro
10@a       - Play macro 10 times
```

#### Example: Create Checkerboard
```
1. qa          - Start recording to 'a'
2. i█ ESC      - Insert █ and space
3. q           - Stop recording
4. 40@a        - Create 40 checker squares
```

---

## 🎨 ASCII-Specific Features

### Character Palette
```
:pal       - Open character palette
1-9        - Quick select from palette
<Space>    - Toggle palette visibility

Default Palette:
1: ░  2: ▒  3: ▓  4: █  5: ─
6: ═  7: │  8: ║  9: ·
```

### Brush Modes
```
:brush char [char]    - Single character
:brush line           - Line drawing mode
:brush box            - Box drawing mode
:brush shade          - Shading mode
:brush erase          - Eraser mode
```

### Smart Line Drawing
```
In line mode:
- Horizontal movement draws ─ or ═
- Vertical movement draws │ or ║
- Corners auto-connect: ┌ ┐ └ ┘
- Junctions auto-detect: ├ ┤ ┬ ┴ ┼
```

### Templates
```
:template scoreboard  - Insert scoreboard
:template racing      - Insert racing telemetry
:template border      - Insert border template
:template list        - List all templates
:template save name   - Save selection as template
```

---

## ⚡ Power User Features

### Split Windows
```
:split              - Horizontal split
:vsplit             - Vertical split
Ctrl-w h/j/k/l      - Navigate windows
Ctrl-w H/J/K/L      - Move windows
Ctrl-w =            - Equal size windows
Ctrl-w _            - Maximize height
Ctrl-w |            - Maximize width
Ctrl-w c            - Close window
```

### Layers
```
:layer new          - Create new layer
:layer 1            - Switch to layer 1
:layer hide 2       - Hide layer 2
:layer merge        - Merge visible layers
:layer opacity 50   - Set layer opacity
```

### Undo/Redo Tree
```
u                   - Undo
Ctrl-r              - Redo
g-                  - Go to older change
g+                  - Go to newer change
:undolist           - Show undo tree
:earlier 5m         - Go back 5 minutes
:later 10           - Go forward 10 changes
```

### Marks & Bookmarks
```
ma                  - Set mark 'a'
'a                  - Jump to mark 'a' (line)
`a                  - Jump to mark 'a' (exact position)
''                  - Jump to previous position
`.                  - Jump to last change
:marks              - List all marks
```

---

## 🚀 Quick Reference Card

### Most Used ASCII Commands
```
== DRAWING ==
i[char]    - Insert character
r[char]    - Replace with character
R          - Replace mode (overwrite)
x          - Delete character
dd         - Delete line
yy         - Yank (copy) line
p          - Paste
.          - Repeat last change

== VISUAL BLOCK ==
Ctrl-v     - Block select
I          - Insert at block start
A          - Append at block end
r          - Replace block
d          - Delete block

== SHAPES ==
:line      - Draw line
:rect      - Draw rectangle
:circle    - Draw circle
:fill      - Fill area

== FILES ==
:w         - Save
:q         - Quit
:wq        - Save and quit
```

---

## 🎓 Learning Path

### Week 1: Basics
- Movement: h j k l
- Insert: i a o
- Delete: x dd
- Save: :w :q

### Week 2: Visual Mode
- Selection: v V Ctrl-v
- Operations: d y c
- Block editing

### Week 3: Advanced
- Macros: q @ 
- Registers: "
- Text objects: iw ib

### Week 4: ASCII Master
- Templates
- Layers
- Custom commands

---

## 💡 Why Vi-Like is PERFECT for ASCII

1. **No Context Switching**: Hands stay on keyboard
2. **Precise Control**: Every pixel matters in ASCII
3. **Repeatability**: Patterns are one keystroke away (.)
4. **Composability**: Build complex operations from simple ones
5. **Speed**: Experienced Vi users are FAST
6. **Memory**: Commands become muscle memory
7. **Power**: Macros can create entire artworks

---

## 🔧 Implementation Notes

### State Machine
```typescript
enum Mode {
  NORMAL = 'NORMAL',
  INSERT = 'INSERT',
  VISUAL = 'VISUAL',
  VISUAL_LINE = 'VISUAL LINE',
  VISUAL_BLOCK = 'VISUAL BLOCK',
  COMMAND = 'COMMAND',
  REPLACE = 'REPLACE'
}

interface EditorState {
  mode: Mode;
  cursor: { x: number; y: number };
  canvas: string[][];
  registers: Map<string, string[][]>;
  marks: Map<string, Position>;
  undoTree: UndoNode;
  macroRecording: string | null;
  lastCommand: string;
  count: number;  // For 10j, 5dd, etc.
}
```

### Key Binding System
```typescript
interface KeyBinding {
  mode: Mode;
  keys: string;
  action: (state: EditorState) => EditorState;
  description: string;
}

const bindings: KeyBinding[] = [
  {
    mode: Mode.NORMAL,
    keys: 'dd',
    action: deleteLine,
    description: 'Delete current line'
  },
  // ... hundreds more
];
```

### Command Parser
```typescript
function parseCommand(cmd: string): Command {
  // :line 0,0 79,23 ═
  const match = cmd.match(/^:(\w+)\s+(.*)$/);
  return {
    name: match[1],
    args: parseArgs(match[2])
  };
}
```

---

## 🏆 Killer Features

### 1. ASCII-Aware Text Objects
```
ibox       - Inside ASCII box
abox       - Around ASCII box (with border)
iframe     - Inside frame
aframe     - Around frame
```

### 2. Smart Character Replacement
```
:smart on
- Typing ─ near └ auto-converts to ┴
- Typing │ near ─ auto-creates ┼
- Corners auto-adjust
```

### 3. Pattern Macros Library
```
:macro load checkerboard
:macro load gradient
:macro load zigzag
:macro save mypattern
:macro share mypattern
```

### 4. Live Preview Integration
```
:preview on        - Show live preview
:preview terminal  - Preview as terminal
:preview markdown  - Preview in markdown
:preview slack     - Preview for Slack
```

---

*"Vi is not just an editor, it's a language for editing. Now it's a language for ASCII art."*

**FAF ASCII Editor - Where Every Keystroke is a Brushstroke**