# Contributing to faf-cli

Thank you for your interest in contributing to faf-cli, the command-line tool for .faf (Foundational AI-context Format). This document provides guidelines for contributing to the project.

## Development Philosophy

faf-cli follows F1-inspired engineering standards:

- **Championship-grade quality** - Zero compromises on reliability
- **Sub-50ms performance** - Every command must be fast
- **100% TypeScript strict mode** - Type safety everywhere
- **WJTTC testing** - F1-inspired test methodology
- **Zero errors** - Clean builds, always
- **Terminal excellence** - Beautiful, informative output

## Before You Start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md)
- Check [existing issues](https://github.com/Wolfe-Jam/faf-cli/issues)
- Understand the .faf format specification
- For major changes, open a discussion first

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Terminal that supports ANSI colors

### Setup

```bash
# Clone the repository
git clone https://github.com/Wolfe-Jam/faf-cli.git
cd faf-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link for local testing
npm link

# Test globally
faf --version
```

### Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following our standards

3. **Test thoroughly**:
   ```bash
   npm test
   npm run build
   faf init  # Test the actual command
   ```

4. **Commit your changes**:
   ```
   <type>: <what changed>
   
   - <specific detail>
   - <specific detail>
   ```
   
   Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`
   
   Example:
   ```
   feat: add faf podium command for championship scoring
   
   - Implements 7-tier medal system
   - Adds visual progress bars
   - Includes scoring algorithm tests
   - Updates command documentation
   ```

5. **Push and create PR**

## Code Standards

### TypeScript

- Use TypeScript strict mode (configured)
- All functions must have explicit return types
- No `any` types (use `unknown` if needed)
- Prefer interfaces over types for object shapes
- Document complex type interactions

### CLI Design

faf-cli has 41 commands organized into categories:

**Core Commands** (context management):
- `faf init`, `faf auto`, `faf score`, `faf status`

**Enhancement Commands** (optimization):
- `faf enhance`, `faf trust`, `faf podium`

**Sync Commands** (bi-directional):
- `faf sync`, `faf bi-sync`, `faf c-mirror`

**File Operations** (CRUD):
- `faf read`, `faf write`, `faf list`, `faf search`

New commands should:
- Have clear, single-word names when possible
- Follow existing patterns
- Include help text and examples
- Support both interactive and scriptable modes

### Terminal Output

faf-cli is known for beautiful terminal output:

```typescript
// Use chalk for colors
import chalk from 'chalk';

console.log(chalk.cyan('🧡 FAF CLI v3.1.1'));
console.log(chalk.green('✓ Context generated'));

// Use box-drawing characters for structure
console.log('┌─────────────────┐');
console.log('│ Score: 95/100   │');
console.log('└─────────────────┘');

// Use progress indicators
console.log('██████████░░░░░ 70%');
```

Guidelines:
- Use 🧡 (orange heart) as primary emoji
- Cyan for titles, green for success, red for errors
- Box-drawing characters for structure
- Progress bars for long operations
- Clear, scannable output

### Performance

Every command must be fast:

- Target sub-50ms for simple operations
- Profile commands with performance monitoring
- Optimize hot paths
- Use async operations appropriately
- Cache when beneficial

```bash
# Performance testing
time faf score  # Should be <50ms on typical projects
```

### Testing

faf-cli uses WJTTC (F1-inspired) testing:

**Test tiers**:
1. **Unit tests** - Individual functions
2. **Integration tests** - Command execution
3. **E2E tests** - Full workflow scenarios
4. **Performance tests** - Speed benchmarks
5. **Edge cases** - Boundary conditions

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- score.test.ts

# Watch mode
npm test -- --watch
```

All new features require:
- Unit test coverage
- Integration test
- Performance benchmark
- Edge case tests

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for exported functions
- Update CHANGELOG.md (keep a changelog format)
- Include command examples
- Document performance characteristics

## Command Development

### Adding a New Command

1. **Create command file** in `src/commands/`:
   ```typescript
   // src/commands/yourcommand.ts
   import { Command } from 'commander';
   
   export function registerYourCommand(program: Command): void {
     program
       .command('yourcommand')
       .description('What your command does')
       .option('-f, --flag', 'Description')
       .action(async (options) => {
         // Implementation
       });
   }
   ```

2. **Register in main CLI**:
   ```typescript
   // src/cli.ts
   import { registerYourCommand } from './commands/yourcommand';
   
   registerYourCommand(program);
   ```

3. **Add tests**:
   ```typescript
   // tests/commands/yourcommand.test.ts
   describe('yourcommand', () => {
     it('should do the thing', async () => {
       // Test implementation
     });
   });
   ```

4. **Update documentation**:
   - Add to README.md command list
   - Include usage examples
   - Document options and flags

### Using faf-engine-mk3

faf-cli is powered by the proprietary faf-engine-mk3:

```typescript
import { FafEngine } from '@faf/engine-mk3';

const engine = new FafEngine();
const result = await engine.analyze(projectPath);
```

**Note**: The engine is proprietary. Contributors work with the CLI interface layer, not the engine internals.

## Pull Request Process

1. **Ensure tests pass**:
   ```bash
   npm test
   npm run build
   npm run lint
   ```

2. **Update documentation**

3. **Add CHANGELOG.md entry**

4. **Fill out PR template**

5. **Request review**

### PR Guidelines

- One feature or fix per PR
- Keep PRs focused
- Link related issues
- Include terminal output examples for CLI changes
- Respond to feedback promptly

## Testing Locally

```bash
# Build and link
npm run build
npm link

# Test commands
faf --version
faf init
faf score
faf help

# Test with different project types
cd ~/test-projects/react-app
faf auto

cd ~/test-projects/python-project
faf auto
```

## What We're Looking For

### High Priority

- New command implementations
- Performance improvements
- Bug fixes with tests
- Terminal output enhancements
- Project type detection improvements

### Welcome Contributions

- Additional project type support
- Enhanced scoring algorithms
- Test coverage improvements
- Documentation improvements
- Example projects

### Not Accepting

- Breaking changes to existing commands
- Performance regressions
- Dependencies without strong justification
- Changes violating TypeScript strict mode

## Getting Help

- **Issues**: Bug reports and feature requests
- **Discussions**: [github.com/Wolfe-Jam/faf/discussions](https://github.com/Wolfe-Jam/faf/discussions)
- **Email**: team@faf.one for private inquiries

## Recognition

Contributors are recognized:

- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to package.json contributors

## Development Tools

Useful commands:

```bash
# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build
npm run build

# Clean build
npm run clean && npm run build
```

## Architecture Notes

### Project Structure

```
faf-cli/
├── src/
│   ├── cli.ts           # Main CLI entry
│   ├── commands/        # Command implementations
│   ├── utils/           # Shared utilities
│   └── types/           # TypeScript types
├── tests/               # Test suite
└── dist/                # Built output
```

### Key Patterns

- **Commander.js** for CLI framework
- **Chalk** for terminal colors
- **Inquirer** for interactive prompts
- **ora** for spinners
- **faf-engine-mk3** for core logic

## Performance Benchmarks

Expected performance targets:

- `faf init`: <50ms
- `faf score`: <50ms
- `faf auto`: <200ms (depends on project size)
- `faf enhance`: <500ms
- `faf bi-sync`: <100ms

## License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Related Projects

- **.faf format** - Specification ([github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf))
- **claude-faf-mcp** - MCP server ([github.com/Wolfe-Jam/claude-faf-mcp](https://github.com/Wolfe-Jam/claude-faf-mcp))
- **Chrome Extension** - Browser integration

---

**Built with championship standards**

*Created by Wolfe James ([ORCID: 0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841))*

**6,000+ downloads. Sub-50ms performance. Zero faff.**
