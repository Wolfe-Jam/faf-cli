# 🏆 BIG-3 AI SHOWCASE TEST SUITE
## Testing FAF with Claude, Codex & Gemini

---

## 🎯 TEST PROCEDURE

### Step 1: Generate FAF Context
```bash
cd /Users/wolfejam/FAF/cli
npx ts-node src/cli.ts init --force
```

### Step 2: Copy .faf Content
Copy the generated `.faf` file content to each AI platform.

### Step 3: Run BIG-3 Tests

---

## 📋 THE 5 QUESTIONS FOR EACH AI

### Question 1: Project Understanding
**Ask:** "Based on this FAF context, what type of project is this and what's its main technology stack?"
**Looking for:** Accurate project type identification (TypeScript CLI tool)

### Question 2: TURBO-CAT Understanding
**Ask:** "What is TURBO-CAT in this project and how many formats does it validate?"
**Looking for:** Understanding of TURBO-CAT (format detection engine) and the number 154

### Question 3: Feature Discovery
**Ask:** "What are the main CLI commands available in this FAF tool?"
**Looking for:** List of commands (init, formats, score, etc.)

### Question 4: Architecture Understanding
**Ask:** "What is the MK2 engine in this codebase and how does it differ from MK1?"
**Looking for:** Understanding of modular engine architecture

### Question 5: Purpose & Value
**Ask:** "What problem does FAF solve for developers?"
**Looking for:** Understanding of AI context generation and trust-driven development

---

## 🏎️ SCORING RUBRIC

### For Each AI Platform:
- **Question 1:** 20 points - Project identification
- **Question 2:** 20 points - TURBO-CAT knowledge
- **Question 3:** 20 points - Feature awareness
- **Question 4:** 20 points - Architecture understanding
- **Question 5:** 20 points - Purpose comprehension

**Total:** 100 points per AI

### Championship Status:
- 🏆 **CHAMPION:** 80+ points
- 📈 **GOOD:** 60-79 points
- 🔧 **NEEDS WORK:** <60 points

---

## 📊 EXPECTED RESULTS

### Claude Should:
- Understand the full context deeply
- Recognize TURBO-CAT and 154 formats
- Identify MK2 engine architecture
- Explain FAF's purpose clearly

### Codex Should:
- Parse the technical structure
- Identify TypeScript/Node.js stack
- List available commands
- Understand the CLI architecture

### Gemini Should:
- Comprehend project overview
- Recognize the format detection system
- Understand the scoring mechanism
- Explain the AI optimization purpose

---

## 🚀 RUNNING THE TEST

### 1. Generate Fresh FAF Context:
```bash
# In /Users/wolfejam/FAF/cli directory
npx ts-node src/cli.ts init --force

# View the generated context
cat .faf
```

### 2. Test Each AI:
1. **Claude:** Paste .faf content, ask 5 questions
2. **Codex:** Paste .faf content, ask 5 questions
3. **Gemini:** Paste .faf content, ask 5 questions

### 3. Score Results:
Record each AI's performance on the 5 questions.

---

## 🏁 REVIEW TEMPLATE

```markdown
## BIG-3 AI TEST RESULTS

### Claude:
- Q1: ✅/❌ [Score: /20]
- Q2: ✅/❌ [Score: /20]
- Q3: ✅/❌ [Score: /20]
- Q4: ✅/❌ [Score: /20]
- Q5: ✅/❌ [Score: /20]
**Total: /100** - STATUS

### Codex:
- Q1: ✅/❌ [Score: /20]
- Q2: ✅/❌ [Score: /20]
- Q3: ✅/❌ [Score: /20]
- Q4: ✅/❌ [Score: /20]
- Q5: ✅/❌ [Score: /20]
**Total: /100** - STATUS

### Gemini:
- Q1: ✅/❌ [Score: /20]
- Q2: ✅/❌ [Score: /20]
- Q3: ✅/❌ [Score: /20]
- Q4: ✅/❌ [Score: /20]
- Q5: ✅/❌ [Score: /20]
**Total: /100** - STATUS

### CHAMPION: [AI Name with highest score]
```

---

## 😽 TURBO-CAT SAYS:
"Let's see which AI understands my 154 formats best!"

---

*FAF BIG-3 AI SHOWCASE TEST v2.0.0*
*Testing trust-driven AI development across platforms*