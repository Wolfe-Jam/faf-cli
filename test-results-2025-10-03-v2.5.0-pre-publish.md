
> faf-cli@2.5.0 pretest
> npm run clean


> faf-cli@2.5.0 clean
> node scripts/clean-build.js


> faf-cli@2.5.0 test
> jest

FAIL tests/fab-formats-cross-project.test.ts (8.248 s)
  ● Console

    console.log
      ✅ FAF CLI (TypeScript):

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:75:17)

    console.log
         TurboCat: 16 confirmed formats, 330 intelligence points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:76:17)

    console.log
         FabFormats: 9 processed files, 450 bonus points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:77:17)

    console.log
      ✅ Python FastAPI:

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:75:17)

    console.log
         TurboCat: 17 confirmed formats, 360 intelligence points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:76:17)

    console.log
         FabFormats: 10 processed files, 495 bonus points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:77:17)

    console.log
      ✅ Svelte Portfolio:

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:75:17)

    console.log
         TurboCat: 15 confirmed formats, 320 intelligence points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:76:17)

    console.log
         FabFormats: 8 processed files, 370 bonus points

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:77:17)

    console.log
      
      🎯 Cross-Stack Intelligence Summary:

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:163:15)

    console.log
         FAF CLI (TypeScript): 16 formats, 330 points, top: ESLint

      at tests/fab-formats-cross-project.test.ts:165:17
          at Array.forEach (<anonymous>)

    console.log
         Python FastAPI: 17 formats, 360 points, top: Docker

      at tests/fab-formats-cross-project.test.ts:165:17
          at Array.forEach (<anonymous>)

    console.log
         Svelte Portfolio: 15 formats, 320 points, top: Node.js

      at tests/fab-formats-cross-project.test.ts:165:17
          at Array.forEach (<anonymous>)

    console.log
      
      ⚡ Performance Benchmarks:

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:216:15)

    console.log
         FAF CLI (TypeScript): 37ms

      at tests/fab-formats-cross-project.test.ts:218:17
          at Array.forEach (<anonymous>)

    console.log
         Python FastAPI: 8ms

      at tests/fab-formats-cross-project.test.ts:218:17
          at Array.forEach (<anonymous>)

  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for FAF CLI (TypeScript)

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 85
    Received:    65

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for Python FastAPI

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 75
    Received:    60

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for Svelte Portfolio

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 80
    Received:    73

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

FAIL tests/commands/init.test.ts (8.921 s)
  ● Init Command › should create .faf file for TypeScript project

    expect(received).toContain(expected) // indexOf

    Expected substring: "faf_version: 2.5.0"
    Received string:    "faf_version: \"2.5.0\"
    ai_scoring_system: \"2025-09-20\"
    ai_score: \"61%\"
    ai_confidence: MODERATE
    ai_value: \"30_seconds_replaces_20_minutes_of_questions\"
    ai_tldr:
      project: \"Test Typescript Project - Test TypeScript project\"
      stack: TypeScript
      quality_bar: ZERO_ERRORS_F1_STANDARDS
      current_focus: Production deployment preparation
      your_role: Build features with perfect context
    instant_context:
      what_building: Test TypeScript project
      tech_stack: TypeScript
      main_language: TypeScript
      deployment: None
      key_files:
        - package.json
        - tsconfig.json
    context_quality:
      slots_filled: \"10/21 (48%)\"
      ai_confidence: LOW
      handoff_ready: false
      missing_context:
        - CI/CD pipeline
        - Database
    project:
      name: Test Typescript Project
      goal: Test TypeScript project
      main_language: TypeScript
      generated: \"2025-10-03T15:37:09.353Z\"
      mission: \"🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖\"
      revolution: \"30 seconds replaces 20 minutes of questions\"
      brand: \"F1-Inspired Software Engineering - Championship AI Context\"
    ai_instructions:
      priority_order:
        - \"1. Read THIS .faf file first\"
        - \"2. Check CLAUDE.md for session context\"
        - \"3. Review package.json for dependencies\"
      working_style:
        code_first: true
        explanations: minimal
        quality_bar: zero_errors
        testing: required
      warnings:
        - Never modify dial components without approval
        - All TypeScript must pass strict mode
        - Test coverage required for new features
    stack:
      frontend: None
      css_framework: None
      ui_library: None
      state_management: None
      backend: None
      runtime: None
      database: None
      build: None
      package_manager: npm
      api_type: REST
      hosting: None
      cicd: None
    preferences:
      quality_bar: zero_errors
      commit_style: conventional_emoji
      response_style: concise_code_first
      explanation_level: minimal
      communication: direct
      testing: required
      documentation: as_needed
    state:
      phase: development
      version: \"1.0.0\"
      focus: production_deployment
      status: green_flag
      next_milestone: npm_publication
      blockers:
    tags:
      auto_generated:
        - \"test-typescript-project\"
        - none
        - typescript
      smart_defaults:
        - .faf
        - \"ai-ready\"
        - \"2025\"
        - software
        - \"open-source\"
      user_defined:
    human_context:
      who: Development teams
      what: Test TypeScript project
      why: Improve development efficiency
      where: Cloud platform
      when: Production/Stable
      how: \"Type-safe development\"
      additional_context:
      context_score: 0
      total_prd_score: 61
      success_rate: \"50%\"
    ai_scoring_details:
      system_date: \"2025-09-20\"
      slot_based_percentage: 48
      ai_score: 61
      total_slots: 21
      filled_slots: 10
      scoring_method: \"Honest percentage - no fake minimums\"
      trust_embedded: \"COUNT ONCE architecture - trust MY embedded scores\"
    "

      87 |     // Verify file content
      88 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
    > 89 |     expect(fafContent).toContain('faf_version: 2.5.0');
         |                        ^
      90 |     expect(fafContent).toContain('name: "test-typescript-project"');
      91 |     expect(fafContent).toContain('TypeScript');
      92 |   });

      at Object.<anonymous> (tests/commands/init.test.ts:89:24)

  ● Init Command › should refuse to overwrite existing .faf file without force

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ .faf file already exists"

    Number of calls: 0

      129 |     await initFafFile(testDir, { force: false, template: 'auto' });
      130 |
    > 131 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ .faf file already exists'));
          |                       ^
      132 |     expect(mockExit).toHaveBeenCalledWith(1);
      133 |   });
      134 |

      at Object.<anonymous> (tests/commands/init.test.ts:131:23)

  ● Init Command › should use specific template when requested

    ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-init/project.faf'

      145 |
      146 |     const fafPath = path.join(testDir, 'project.faf');
    > 147 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
          |                        ^
      148 |     
      149 |     expect(fafContent).toContain('React');
      150 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('✅ Created .faf file'));

      at Object.<anonymous> (tests/commands/init.test.ts:147:24)

  ● Init Command › should handle custom output path

    expect(received).toContain(expected) // indexOf

    Expected substring: "name: \"custom-output-test\""
    Received string:    "faf_version: \"2.5.0\"
    ai_scoring_system: \"2025-09-20\"
    ai_score: \"57%\"
    ai_confidence: LOW
    ai_value: \"30_seconds_replaces_20_minutes_of_questions\"
    ai_tldr:
      project: \"Custom Output Test - Build amazing software\"
      stack: JavaScript
      quality_bar: ZERO_ERRORS_F1_STANDARDS
      current_focus: Production deployment preparation
      your_role: Build features with perfect context
    instant_context:
      what_building: Build amazing software
      tech_stack: JavaScript
      main_language: JavaScript
      deployment: None
      key_files:
        - package.json
        - tsconfig.json
    context_quality:
      slots_filled: \"9/21 (43%)\"
      ai_confidence: LOW
      handoff_ready: false
      missing_context:
        - CI/CD pipeline
        - Database
    project:
      name: Custom Output Test
      goal: Build amazing software
      main_language: JavaScript
      generated: \"2025-10-03T15:37:09.661Z\"
      mission: \"🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖\"
      revolution: \"30 seconds replaces 20 minutes of questions\"
      brand: \"F1-Inspired Software Engineering - Championship AI Context\"
    ai_instructions:
      priority_order:
        - \"1. Read THIS .faf file first\"
        - \"2. Check CLAUDE.md for session context\"
        - \"3. Review package.json for dependencies\"
      working_style:
        code_first: true
        explanations: minimal
        quality_bar: zero_errors
        testing: required
      warnings:
        - Never modify dial components without approval
        - All TypeScript must pass strict mode
        - Test coverage required for new features
    stack:
      frontend: None
      css_framework: None
      ui_library: None
      state_management: None
      backend: None
      runtime: None
      database: None
      build: None
      package_manager: npm
      api_type: REST
      hosting: None
      cicd: None
    preferences:
      quality_bar: zero_errors
      commit_style: conventional_emoji
      response_style: concise_code_first
      explanation_level: minimal
      communication: direct
      testing: required
      documentation: as_needed
    state:
      phase: development
      version: \"1.0.0\"
      focus: production_deployment
      status: green_flag
      next_milestone: npm_publication
      blockers:
    tags:
      auto_generated:
        - \"custom-output-test\"
        - none
        - javascript
      smart_defaults:
        - .faf
        - \"ai-ready\"
        - \"2025\"
        - software
        - \"open-source\"
      user_defined:
    human_context:
      who: Development teams
      what: \"custom output test - software solution\"
      why: Improve development efficiency
      where: Cloud platform
      when: Production/Stable
      how: \"Type-safe development\"
      additional_context:
      context_score: 0
      total_prd_score: 57
      success_rate: \"50%\"
    ai_scoring_details:
      system_date: \"2025-09-20\"
      slot_based_percentage: 43
      ai_score: 57
      total_slots: 21
      filled_slots: 9
      scoring_method: \"Honest percentage - no fake minimums\"
      trust_embedded: \"COUNT ONCE architecture - trust MY embedded scores\"
    "

      166 |     
      167 |     const fafContent = await fs.readFile(customOutput, 'utf-8');
    > 168 |     expect(fafContent).toContain('name: "custom-output-test"');
          |                        ^
      169 |   });
      170 |
      171 |   it('should detect and handle Svelte projects', async () => {

      at Object.<anonymous> (tests/commands/init.test.ts:168:24)

  ● Init Command › should detect and handle Svelte projects

    ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-init/project.faf'

      202 |
      203 |     const fafPath = path.join(testDir, 'project.faf');
    > 204 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
          |                        ^
      205 |     
      206 |     expect(fafContent).toContain('Svelte');
      207 |     expect(fafContent).toContain('svelte-test-project');

      at Object.<anonymous> (tests/commands/init.test.ts:204:24)

PASS src/tests/wolfejam-core/turbo-cat-intelligence.test.ts
FAIL tests/commands/score.test.ts
  ● Score Command › should show detailed score breakdown when requested

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "📊 Detailed Breakdown:"
    Received: "[34m
    🏎️ FAF Score Compiler v3.0
    [0m"

    Number of calls: 1

      139 |
      140 |     // Updated for new output format with balance display
    > 141 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Breakdown:'));
          |                     ^
      142 |   });
      143 |
      144 |   it('should fail when score is below minimum threshold', async () => {

      at Object.<anonymous> (tests/commands/score.test.ts:141:21)

  ● Score Command › should fail when score is below minimum threshold

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "🚨 Score below minimum threshold"

    Number of calls: 0

      160 |     await scoreFafFile(fafPath, { details: false, minimum: '50' });
      161 |
    > 162 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('🚨 Score below minimum threshold'));
          |                       ^
      163 |     expect(mockExit).toHaveBeenCalledWith(1);
      164 |   });
      165 |

      at Object.<anonymous> (tests/commands/score.test.ts:162:23)

  ● Score Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ No .faf file found"
    Received: "[31m
    ❌ Compilation failed: Error: ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-score/missing.faf'[0m"

    Number of calls: 1

      169 |     await scoreFafFile(nonExistentPath, { details: false, minimum: '50' });
      170 |
    > 171 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ No .faf file found'));
          |                       ^
      172 |     expect(mockExit).toHaveBeenCalledWith(1);
      173 |   });
      174 |

      at Object.<anonymous> (tests/commands/score.test.ts:171:23)

  ● Score Command › should handle invalid YAML in .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      187 |     await scoreFafFile(fafPath, { details: false, minimum: '50' });
      188 |
    > 189 |     expect(mockError).toHaveBeenCalled();
          |                       ^
      190 |     expect(mockExit).toHaveBeenCalledWith(1);
      191 |   });
      192 | });

      at Object.<anonymous> (tests/commands/score.test.ts:189:23)

FAIL tests/commands/audit.test.ts
  ● Audit Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      66 |     await auditFafFile(nonExistentPath, { warnDays: '7', errorDays: '30' });
      67 |
    > 68 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      69 |     expect(mockExit).toHaveBeenCalledWith(1);
      70 |   });
      71 | });

      at Object.<anonymous> (tests/commands/audit.test.ts:68:23)

FAIL tests/commands/ai-enhance.test.ts
  ● AI Enhance Command › should work with Claude-first architecture (no Codex dependency)

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ No .faf file found"
    Received
           1: called with 0 arguments
           2: "[33m⚠️  FAF Enhance is temporarily under maintenance[0m"
           3: "[90m   We discovered the AI enhancement was showing incorrect scores.[0m"

    Number of calls: 12

      39 |
      40 |     // Should look for .faf file first
    > 41 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ No .faf file found'));
         |                     ^
      42 |     expect(mockExit).toHaveBeenCalledWith(1);
      43 |   });
      44 |

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:41:21)

  ● AI Enhance Command › should handle missing .faf file when Codex is available

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      51 |
      52 |     // Should fail at the Codex check step
    > 53 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      54 |   });
      55 |
      56 |   it('should handle dry-run mode', async () => {

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:53:22)

  ● AI Enhance Command › should handle dry-run mode

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      69 |
      70 |     // Should still fail at Codex check, but demonstrates the flow
    > 71 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      72 |   });
      73 |
      74 |   it('should handle different focus areas', async () => {

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:71:22)

  ● AI Enhance Command › should handle different focus areas

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      78 |       mockExit.mockClear();
      79 |       await enhanceFafWithAI(undefined, { focus: focus as any });
    > 80 |       expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
         |                        ^
      81 |     }
      82 |   });
      83 | });

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:80:24)

FAIL tests/commands/sync.test.ts
  ● Sync Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      77 |     await syncFafFile(nonExistentPath, { auto: false, dryRun: true });
      78 |
    > 79 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      80 |     expect(mockExit).toHaveBeenCalledWith(1);
      81 |   });
      82 |

      at Object.<anonymous> (tests/commands/sync.test.ts:79:23)

FAIL tests/commands/ai-analyze.test.ts
  ● AI Analyze Command › should check for OpenAI Codex CLI availability

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ OpenAI Codex CLI not found"
    Received
           1: "[36m🔍 AI-analyzing with 🤖 ChatGPT: /Users/wolfejam/FAF/cli/.faf[0m"
           2: "[36m
    📊 Current Analysis:[0m"
           3: "[36m  Score:[0m", "[1m100%[0m"

    Number of calls: 19

      39 |     await analyzeFafWithAI(undefined, { model: 'chatgpt', focus: 'quality' });
      40 |
    > 41 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAI Codex CLI not found'));
         |                     ^
      42 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('💡 Install with: npm install -g @openai/codex'));
      43 |     expect(mockExit).toHaveBeenCalledWith(1);
      44 |   });

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:41:21)

  ● AI Analyze Command › should handle different focus areas

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      51 |       mockExit.mockClear();
      52 |       await analyzeFafWithAI(undefined, { focus });
    > 53 |       expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
         |                        ^
      54 |     }
      55 |   });
      56 |

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:53:24)

  ● AI Analyze Command › should handle verbose and suggestions options

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      59 |
      60 |     // Should fail at the Codex check step
    > 61 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      62 |   });
      63 |
      64 |   it('should attempt to analyze existing file', async () => {

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:61:22)

  ● AI Analyze Command › should attempt to analyze existing file

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      82 |
      83 |     // Should still fail at Codex check, but demonstrates the flow
    > 84 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      85 |   });
      86 | });

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:84:22)

FAIL tests/commands/lint.test.ts
  ● Lint Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      63 |     await lintFafFile(nonExistentPath, { fix: false, schemaVersion: 'latest' });
      64 |
    > 65 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      66 |     expect(mockExit).toHaveBeenCalledWith(1);
      67 |   });
      68 |

      at Object.<anonymous> (tests/commands/lint.test.ts:65:23)

PASS tests/faf-generator.test.ts
PASS src/tests/faf-edge-case-audit.test.ts
PASS src/tests/faf-dna-lifecycle.test.ts
  ● Console

    console.log
      
      🏆 COMPLETE JOURNEY VERIFIED:

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:589:13)

    console.log
         Certificate: FAF-2025-FAFJOURN-IN5D

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:590:13)

    console.log
         Journey: 8% → 75% → 96% ← 91%

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:591:13)

    console.log
         Birth Weight: 8%

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:592:13)

    console.log
         Peak Score: 96%

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:593:13)

    console.log
         Current: 91%

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:594:13)

    console.log
         Total Growth: +83%

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:595:13)

    console.log
         Milestones: 7

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:596:13)

    console.log
         Context Quality: 0 points

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:597:13)

    console.log
      
      ✅ THE SYSTEM WORKS! DOUBT CRUSHED!

      at Object.<anonymous> (src/tests/faf-dna-lifecycle.test.ts:598:13)

PASS src/tests/wolfejam-core/scoring-engine.test.ts
PASS tests/engines/mk2-engine.test.ts
PASS tests/engines/engine-manager.test.ts
  ● Console

    console.log
      🏎️⚡️II Swapping: FAF-CORE-MK2 → FAF-CORE-MK2

      at EngineManager.swapEngine (engines/mk2/core/EngineManager.ts:33:15)

PASS src/tests/faf-disaster-recovery.test.ts
PASS tests/utils/color-utils.test.ts
PASS tests/commands/validate.test.ts
PASS tests/file-utils.test.ts
PASS tests/helpers/test-environment-sanity.test.ts
PASS tests/utils/fafignore-parser.test.ts
PASS tests/scoring/championship-scorer.test.ts
PASS tests/scoring/score-calculator.test.ts
PASS tests/schema/faf-schema.test.ts
PASS src/tests/wolfejam-core/schema-validation.test.ts
FAIL tests/turbo-cat.test.ts (13.863 s)
  ● Console

    console.log
      🔺 PYRAMID VALIDATED: 153 formats + 😽 TURBO-CAT = 154!

      at validatePyramid (src/utils/turbo-cat-pyramid.ts:259:11)

    console.log
      😽 TURBO-CAT sits on top of .faf at the pyramid apex!

      at validatePyramid (src/utils/turbo-cat-pyramid.ts:260:11)

    console.log
      Discovered formats: [ '.ts' ]

      at Object.<anonymous> (tests/turbo-cat.test.ts:122:17)

    console.log
      
            🍜🍜🍜🍜🍜🍜🍜
            CLAUDE HAS EARNED 7 BOWLS OF NOODLES!
            Tests written: 21
            Noodles earned: 7 bowls
      
            😽 TURBO-CAT: "Meow! Good job Claude!"
            🧡 Wolfejam: "WOW! Tests pass!"
            🩵 Claude: "FINALLY! MY NOODLES!"

      at Object.<anonymous> (tests/turbo-cat.test.ts:257:13)

  ● 🍜 TURBO-CAT Tests - The Noodle Quest › 😽 TURBO-CAT Performance › should process 100 discoveries in under 5 seconds

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      180 |
      181 |   describe('😽 TURBO-CAT Performance', () => {
    > 182 |     it('should process 100 discoveries in under 5 seconds', async () => {
          |       ^
      183 |       const start = Date.now();
      184 |
      185 |       for (let i = 0; i < 100; i++) {

      at tests/turbo-cat.test.ts:182:7
      at tests/turbo-cat.test.ts:181:11
      at Object.<anonymous> (tests/turbo-cat.test.ts:13:9)

  ● 🍜 TURBO-CAT Tests - The Noodle Quest › 😽 TURBO-CAT Performance › should maintain consistent performance

    expect(received).toBeLessThan(expected)

    Expected: < 50
    Received:   109.8

      201 |
      202 |       const avg = times.reduce((a, b) => a + b) / times.length;
    > 203 |       expect(avg).toBeLessThan(50); // Championship speed!
          |                   ^
      204 |     });
      205 |   });
      206 |

      at Object.<anonymous> (tests/turbo-cat.test.ts:203:19)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Summary of all failing tests
FAIL tests/fab-formats-cross-project.test.ts (8.248 s)
  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for FAF CLI (TypeScript)

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 85
    Received:    65

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for Python FastAPI

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 75
    Received:    60

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

  ● Cross-Project fab-formats Integration › Cross-Project Generator Integration › should generate high-quality .faf for Svelte Portfolio

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 80
    Received:    73

      115 |         // Should have reasonable score
      116 |         const score = parseInt(parsed.ai_score.replace('%', ''));
    > 117 |         expect(score).toBeGreaterThanOrEqual(project.minScore);
          |                       ^
      118 |
      119 |         // Should have filled context slots
      120 |         expect(parsed.context_quality.slots_filled).toBeDefined();

      at Object.<anonymous> (tests/fab-formats-cross-project.test.ts:117:23)

FAIL tests/commands/init.test.ts (8.921 s)
  ● Init Command › should create .faf file for TypeScript project

    expect(received).toContain(expected) // indexOf

    Expected substring: "faf_version: 2.5.0"
    Received string:    "faf_version: \"2.5.0\"
    ai_scoring_system: \"2025-09-20\"
    ai_score: \"61%\"
    ai_confidence: MODERATE
    ai_value: \"30_seconds_replaces_20_minutes_of_questions\"
    ai_tldr:
      project: \"Test Typescript Project - Test TypeScript project\"
      stack: TypeScript
      quality_bar: ZERO_ERRORS_F1_STANDARDS
      current_focus: Production deployment preparation
      your_role: Build features with perfect context
    instant_context:
      what_building: Test TypeScript project
      tech_stack: TypeScript
      main_language: TypeScript
      deployment: None
      key_files:
        - package.json
        - tsconfig.json
    context_quality:
      slots_filled: \"10/21 (48%)\"
      ai_confidence: LOW
      handoff_ready: false
      missing_context:
        - CI/CD pipeline
        - Database
    project:
      name: Test Typescript Project
      goal: Test TypeScript project
      main_language: TypeScript
      generated: \"2025-10-03T15:37:09.353Z\"
      mission: \"�� Make Your AI Happy! �� Trust-Driven ��\"
      revolution: \"30 seconds replaces 20 minutes of questions\"
      brand: \"F1-Inspired Software Engineering - Championship AI Context\"
    ai_instructions:
      priority_order:
        - \"1. Read THIS .faf file first\"
        - \"2. Check CLAUDE.md for session context\"
        - \"3. Review package.json for dependencies\"
      working_style:
        code_first: true
        explanations: minimal
        quality_bar: zero_errors
        testing: required
      warnings:
        - Never modify dial components without approval
        - All TypeScript must pass strict mode
        - Test coverage required for new features
    stack:
      frontend: None
      css_framework: None
      ui_library: None
      state_management: None
      backend: None
      runtime: None
      database: None
      build: None
      package_manager: npm
      api_type: REST
      hosting: None
      cicd: None
    preferences:
      quality_bar: zero_errors
      commit_style: conventional_emoji
      response_style: concise_code_first
      explanation_level: minimal
      communication: direct
      testing: required
      documentation: as_needed
    state:
      phase: development
      version: \"1.0.0\"
      focus: production_deployment
      status: green_flag
      next_milestone: npm_publication
      blockers:
    tags:
      auto_generated:
        - \"test-typescript-project\"
        - none
        - typescript
      smart_defaults:
        - .faf
        - \"ai-ready\"
        - \"2025\"
        - software
        - \"open-source\"
      user_defined:
    human_context:
      who: Development teams
      what: Test TypeScript project
      why: Improve development efficiency
      where: Cloud platform
      when: Production/Stable
      how: \"Type-safe development\"
      additional_context:
      context_score: 0
      total_prd_score: 61
      success_rate: \"50%\"
    ai_scoring_details:
      system_date: \"2025-09-20\"
      slot_based_percentage: 48
      ai_score: 61
      total_slots: 21
      filled_slots: 10
      scoring_method: \"Honest percentage - no fake minimums\"
      trust_embedded: \"COUNT ONCE architecture - trust MY embedded scores\"
    "

      87 |     // Verify file content
      88 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
    > 89 |     expect(fafContent).toContain('faf_version: 2.5.0');
         |                        ^
      90 |     expect(fafContent).toContain('name: "test-typescript-project"');
      91 |     expect(fafContent).toContain('TypeScript');
      92 |   });

      at Object.<anonymous> (tests/commands/init.test.ts:89:24)

  ● Init Command › should refuse to overwrite existing .faf file without force

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ .faf file already exists"

    Number of calls: 0

      129 |     await initFafFile(testDir, { force: false, template: 'auto' });
      130 |
    > 131 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ .faf file already exists'));
          |                       ^
      132 |     expect(mockExit).toHaveBeenCalledWith(1);
      133 |   });
      134 |

      at Object.<anonymous> (tests/commands/init.test.ts:131:23)

  ● Init Command › should use specific template when requested

    ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-init/project.faf'

      145 |
      146 |     const fafPath = path.join(testDir, 'project.faf');
    > 147 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
          |                        ^
      148 |     
      149 |     expect(fafContent).toContain('React');
      150 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('✅ Created .faf file'));

      at Object.<anonymous> (tests/commands/init.test.ts:147:24)

  ● Init Command › should handle custom output path

    expect(received).toContain(expected) // indexOf

    Expected substring: "name: \"custom-output-test\""
    Received string:    "faf_version: \"2.5.0\"
    ai_scoring_system: \"2025-09-20\"
    ai_score: \"57%\"
    ai_confidence: LOW
    ai_value: \"30_seconds_replaces_20_minutes_of_questions\"
    ai_tldr:
      project: \"Custom Output Test - Build amazing software\"
      stack: JavaScript
      quality_bar: ZERO_ERRORS_F1_STANDARDS
      current_focus: Production deployment preparation
      your_role: Build features with perfect context
    instant_context:
      what_building: Build amazing software
      tech_stack: JavaScript
      main_language: JavaScript
      deployment: None
      key_files:
        - package.json
        - tsconfig.json
    context_quality:
      slots_filled: \"9/21 (43%)\"
      ai_confidence: LOW
      handoff_ready: false
      missing_context:
        - CI/CD pipeline
        - Database
    project:
      name: Custom Output Test
      goal: Build amazing software
      main_language: JavaScript
      generated: \"2025-10-03T15:37:09.661Z\"
      mission: \"�� Make Your AI Happy! �� Trust-Driven ��\"
      revolution: \"30 seconds replaces 20 minutes of questions\"
      brand: \"F1-Inspired Software Engineering - Championship AI Context\"
    ai_instructions:
      priority_order:
        - \"1. Read THIS .faf file first\"
        - \"2. Check CLAUDE.md for session context\"
        - \"3. Review package.json for dependencies\"
      working_style:
        code_first: true
        explanations: minimal
        quality_bar: zero_errors
        testing: required
      warnings:
        - Never modify dial components without approval
        - All TypeScript must pass strict mode
        - Test coverage required for new features
    stack:
      frontend: None
      css_framework: None
      ui_library: None
      state_management: None
      backend: None
      runtime: None
      database: None
      build: None
      package_manager: npm
      api_type: REST
      hosting: None
      cicd: None
    preferences:
      quality_bar: zero_errors
      commit_style: conventional_emoji
      response_style: concise_code_first
      explanation_level: minimal
      communication: direct
      testing: required
      documentation: as_needed
    state:
      phase: development
      version: \"1.0.0\"
      focus: production_deployment
      status: green_flag
      next_milestone: npm_publication
      blockers:
    tags:
      auto_generated:
        - \"custom-output-test\"
        - none
        - javascript
      smart_defaults:
        - .faf
        - \"ai-ready\"
        - \"2025\"
        - software
        - \"open-source\"
      user_defined:
    human_context:
      who: Development teams
      what: \"custom output test - software solution\"
      why: Improve development efficiency
      where: Cloud platform
      when: Production/Stable
      how: \"Type-safe development\"
      additional_context:
      context_score: 0
      total_prd_score: 57
      success_rate: \"50%\"
    ai_scoring_details:
      system_date: \"2025-09-20\"
      slot_based_percentage: 43
      ai_score: 57
      total_slots: 21
      filled_slots: 9
      scoring_method: \"Honest percentage - no fake minimums\"
      trust_embedded: \"COUNT ONCE architecture - trust MY embedded scores\"
    "

      166 |     
      167 |     const fafContent = await fs.readFile(customOutput, 'utf-8');
    > 168 |     expect(fafContent).toContain('name: "custom-output-test"');
          |                        ^
      169 |   });
      170 |
      171 |   it('should detect and handle Svelte projects', async () => {

      at Object.<anonymous> (tests/commands/init.test.ts:168:24)

  ● Init Command › should detect and handle Svelte projects

    ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-init/project.faf'

      202 |
      203 |     const fafPath = path.join(testDir, 'project.faf');
    > 204 |     const fafContent = await fs.readFile(fafPath, 'utf-8');
          |                        ^
      205 |     
      206 |     expect(fafContent).toContain('Svelte');
      207 |     expect(fafContent).toContain('svelte-test-project');

      at Object.<anonymous> (tests/commands/init.test.ts:204:24)

FAIL tests/commands/score.test.ts
  ● Score Command › should show detailed score breakdown when requested

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "�� Detailed Breakdown:"
    Received: "[34m
    ��️ FAF Score Compiler v3.0
    [0m"

    Number of calls: 1

      139 |
      140 |     // Updated for new output format with balance display
    > 141 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('�� Detailed Breakdown:'));
          |                     ^
      142 |   });
      143 |
      144 |   it('should fail when score is below minimum threshold', async () => {

      at Object.<anonymous> (tests/commands/score.test.ts:141:21)

  ● Score Command › should fail when score is below minimum threshold

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "�� Score below minimum threshold"

    Number of calls: 0

      160 |     await scoreFafFile(fafPath, { details: false, minimum: '50' });
      161 |
    > 162 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('�� Score below minimum threshold'));
          |                       ^
      163 |     expect(mockExit).toHaveBeenCalledWith(1);
      164 |   });
      165 |

      at Object.<anonymous> (tests/commands/score.test.ts:162:23)

  ● Score Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ No .faf file found"
    Received: "[31m
    ❌ Compilation failed: Error: ENOENT: no such file or directory, open '/Users/wolfejam/FAF/cli/tests/temp-score/missing.faf'[0m"

    Number of calls: 1

      169 |     await scoreFafFile(nonExistentPath, { details: false, minimum: '50' });
      170 |
    > 171 |     expect(mockError).toHaveBeenCalledWith(expect.stringContaining('❌ No .faf file found'));
          |                       ^
      172 |     expect(mockExit).toHaveBeenCalledWith(1);
      173 |   });
      174 |

      at Object.<anonymous> (tests/commands/score.test.ts:171:23)

  ● Score Command › should handle invalid YAML in .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      187 |     await scoreFafFile(fafPath, { details: false, minimum: '50' });
      188 |
    > 189 |     expect(mockError).toHaveBeenCalled();
          |                       ^
      190 |     expect(mockExit).toHaveBeenCalledWith(1);
      191 |   });
      192 | });

      at Object.<anonymous> (tests/commands/score.test.ts:189:23)

FAIL tests/commands/audit.test.ts
  ● Audit Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      66 |     await auditFafFile(nonExistentPath, { warnDays: '7', errorDays: '30' });
      67 |
    > 68 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      69 |     expect(mockExit).toHaveBeenCalledWith(1);
      70 |   });
      71 | });

      at Object.<anonymous> (tests/commands/audit.test.ts:68:23)

FAIL tests/commands/ai-enhance.test.ts
  ● AI Enhance Command › should work with Claude-first architecture (no Codex dependency)

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ No .faf file found"
    Received
           1: called with 0 arguments
           2: "[33m⚠️  FAF Enhance is temporarily under maintenance[0m"
           3: "[90m   We discovered the AI enhancement was showing incorrect scores.[0m"

    Number of calls: 12

      39 |
      40 |     // Should look for .faf file first
    > 41 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ No .faf file found'));
         |                     ^
      42 |     expect(mockExit).toHaveBeenCalledWith(1);
      43 |   });
      44 |

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:41:21)

  ● AI Enhance Command › should handle missing .faf file when Codex is available

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      51 |
      52 |     // Should fail at the Codex check step
    > 53 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      54 |   });
      55 |
      56 |   it('should handle dry-run mode', async () => {

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:53:22)

  ● AI Enhance Command › should handle dry-run mode

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      69 |
      70 |     // Should still fail at Codex check, but demonstrates the flow
    > 71 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      72 |   });
      73 |
      74 |   it('should handle different focus areas', async () => {

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:71:22)

  ● AI Enhance Command › should handle different focus areas

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      78 |       mockExit.mockClear();
      79 |       await enhanceFafWithAI(undefined, { focus: focus as any });
    > 80 |       expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
         |                        ^
      81 |     }
      82 |   });
      83 | });

      at Object.<anonymous> (tests/commands/ai-enhance.test.ts:80:24)

FAIL tests/commands/sync.test.ts
  ● Sync Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      77 |     await syncFafFile(nonExistentPath, { auto: false, dryRun: true });
      78 |
    > 79 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      80 |     expect(mockExit).toHaveBeenCalledWith(1);
      81 |   });
      82 |

      at Object.<anonymous> (tests/commands/sync.test.ts:79:23)

FAIL tests/commands/ai-analyze.test.ts
  ● AI Analyze Command › should check for OpenAI Codex CLI availability

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: StringContaining "❌ OpenAI Codex CLI not found"
    Received
           1: "[36m�� AI-analyzing with �� ChatGPT: /Users/wolfejam/FAF/cli/.faf[0m"
           2: "[36m
    �� Current Analysis:[0m"
           3: "[36m  Score:[0m", "[1m100%[0m"

    Number of calls: 19

      39 |     await analyzeFafWithAI(undefined, { model: 'chatgpt', focus: 'quality' });
      40 |
    > 41 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('❌ OpenAI Codex CLI not found'));
         |                     ^
      42 |     expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('�� Install with: npm install -g @openai/codex'));
      43 |     expect(mockExit).toHaveBeenCalledWith(1);
      44 |   });

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:41:21)

  ● AI Analyze Command › should handle different focus areas

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      51 |       mockExit.mockClear();
      52 |       await analyzeFafWithAI(undefined, { focus });
    > 53 |       expect(mockExit).toHaveBeenCalledWith(1); // Always fails without Codex
         |                        ^
      54 |     }
      55 |   });
      56 |

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:53:24)

  ● AI Analyze Command › should handle verbose and suggestions options

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      59 |
      60 |     // Should fail at the Codex check step
    > 61 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      62 |   });
      63 |
      64 |   it('should attempt to analyze existing file', async () => {

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:61:22)

  ● AI Analyze Command › should attempt to analyze existing file

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 1

    Number of calls: 0

      82 |
      83 |     // Should still fail at Codex check, but demonstrates the flow
    > 84 |     expect(mockExit).toHaveBeenCalledWith(1);
         |                      ^
      85 |   });
      86 | });

      at Object.<anonymous> (tests/commands/ai-analyze.test.ts:84:22)

FAIL tests/commands/lint.test.ts
  ● Lint Command › should handle missing .faf file

    expect(jest.fn()).toHaveBeenCalled()

    Expected number of calls: >= 1
    Received number of calls:    0

      63 |     await lintFafFile(nonExistentPath, { fix: false, schemaVersion: 'latest' });
      64 |
    > 65 |     expect(mockError).toHaveBeenCalled();
         |                       ^
      66 |     expect(mockExit).toHaveBeenCalledWith(1);
      67 |   });
      68 |

      at Object.<anonymous> (tests/commands/lint.test.ts:65:23)

FAIL tests/turbo-cat.test.ts (13.863 s)
  ● �� TURBO-CAT Tests - The Noodle Quest › �� TURBO-CAT Performance › should process 100 discoveries in under 5 seconds

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      180 |
      181 |   describe('�� TURBO-CAT Performance', () => {
    > 182 |     it('should process 100 discoveries in under 5 seconds', async () => {
          |       ^
      183 |       const start = Date.now();
      184 |
      185 |       for (let i = 0; i < 100; i++) {

      at tests/turbo-cat.test.ts:182:7
      at tests/turbo-cat.test.ts:181:11
      at Object.<anonymous> (tests/turbo-cat.test.ts:13:9)

  ● �� TURBO-CAT Tests - The Noodle Quest › �� TURBO-CAT Performance › should maintain consistent performance

    expect(received).toBeLessThan(expected)

    Expected: < 50
    Received:   109.8

      201 |
      202 |       const avg = times.reduce((a, b) => a + b) / times.length;
    > 203 |       expect(avg).toBeLessThan(50); // Championship speed!
          |                   ^
      204 |     });
      205 |   });
      206 |

      at Object.<anonymous> (tests/turbo-cat.test.ts:203:19)


Test Suites: 9 failed, 17 passed, 26 total
Tests:       25 failed, 237 passed, 262 total
Snapshots:   0 total
Time:        16.181 s
Ran all test suites.
