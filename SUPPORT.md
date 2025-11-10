# Getting Support

Thank you for using faf-cli. This document explains how to get help with the command-line tool for .faf format.

## Documentation

Before seeking help, check our documentation:

- **README.md** - Installation, commands, quick start
- **faf.one** - Official website with guides
- **CHANGELOG.md** - Version history and updates
- **Command help** - Run `faf help` or `faf <command> --help`

## Quick Help

Get help directly in terminal:

```bash
# General help
faf --help

# Command-specific help
faf init --help
faf score --help
faf enhance --help

# Version info
faf --version

# About faf-cli
faf about
```

## Common Issues

### Installation Problems

**Issue**: `command not found: faf`

**Solution**: Ensure global install completed:
```bash
npm install -g faf-cli
which faf  # Should show: /usr/local/bin/faf or similar

# If not found, add to PATH or reinstall
```

**Issue**: Permission denied during install

**Solution**: Use correct permissions:
```bash
# macOS/Linux
sudo npm install -g faf-cli

# Or use npm prefix to install without sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g faf-cli
```

**Issue**: Old version installed

**Solution**: Update to latest:
```bash
npm update -g faf-cli
faf --version  # Verify updated
```

### Command Issues

**Issue**: `faf init` not generating .faf file

**Solution**:
```bash
# Ensure you're in project root
pwd

# Check permissions
ls -la

# Try with verbose output
faf init --verbose

# Manually specify output
faf init --output project.faf
```

**Issue**: Low context scores (below 85%)

**Solution**:
```bash
# Check what's missing
faf status

# Run enhancement
faf enhance

# Focus on specific areas
faf enhance --focus dependencies
faf enhance --focus documentation

# Check score again
faf score
```

**Issue**: `faf auto` not detecting project type

**Solution**:
```bash
# Verify characteristic files exist
ls package.json  # Node.js
ls requirements.txt  # Python
ls Cargo.toml  # Rust

# Try manual init instead
faf init --type nodejs

# Check supported types
faf help auto
```

**Issue**: Terminal output garbled or missing colors

**Solution**:
```bash
# Check terminal supports ANSI colors
echo $TERM

# Force color output
faf score --color=always

# Or disable colors
faf score --no-color

# For Windows, use Windows Terminal or WSL
```

### Sync Issues

**Issue**: `faf sync` not working

**Solution**:
```bash
# Verify .faf file exists and is valid
faf read project.faf

# Check CLAUDE.md location
ls CLAUDE.md

# Try bi-directional sync
faf bi-sync

# Check sync status
faf status --sync
```

**Issue**: C-MIRROR live sync not starting

**Solution**:
```bash
# Check Node.js version (needs 18+)
node --version

# Try manual trigger
faf c-mirror

# Check if files are writable
ls -la project.faf CLAUDE.md
```

## Getting Help

### GitHub Issues

For bugs and feature requests:

[github.com/Wolfe-Jam/faf-cli/issues](https://github.com/Wolfe-Jam/faf-cli/issues)

**For bugs, include**:
- faf-cli version (`faf --version`)
- Operating system and version
- Node.js version (`node --version`)
- Command that failed
- Full error message
- Expected vs actual behavior

**Example bug report**:
```markdown
**faf-cli version**: 3.1.1
**OS**: macOS 14.2
**Node**: v20.10.0

**Command**: faf enhance --focus all
**Error**: "Cannot read property 'score' of undefined"

**Expected**: Enhancement to complete successfully
**Actual**: Command crashes with error

**Steps to reproduce**:
1. Run faf init in empty directory
2. Run faf enhance --focus all
3. Error occurs
```

**For feature requests**:
```markdown
**Feature**: Add support for Go project detection

**Use case**: Many projects use Go and need .faf context

**Proposal**: Detect go.mod file and extract module info

**Implementation idea**: Parse go.mod for dependencies
```

### GitHub Discussions

For questions and community support:

[github.com/Wolfe-Jam/faf/discussions](https://github.com/Wolfe-Jam/faf/discussions)

**Use discussions for**:
- "How do I...?" questions
- Best practices
- Tips and tricks
- Sharing your workflows
- General feedback

### Email Support

For private inquiries:

**team@faf.one**

Allow 1-3 business days for response.

**Use email for**:
- Security issues (see [SECURITY.md](SECURITY.md))
- Partnership inquiries
- Private matters
- Media requests

**Do not use email for**:
- General questions (use discussions)
- Bug reports (use issues)
- Feature requests (use issues)

## Self-Help Resources

### Debug Mode

Enable verbose logging:
```bash
# Set debug mode
export DEBUG=faf:*

# Run command
faf score

# Or inline
DEBUG=faf:* faf score
```

### Check Installation Health

```bash
# Verify installation
npm list -g faf-cli

# Check for updates
npm outdated -g faf-cli

# Reinstall if needed
npm uninstall -g faf-cli
npm install -g faf-cli

# Verify working
faf --version
faf help
```

### Performance Troubleshooting

If commands are slow:

```bash
# Check project size
du -sh .

# Profile command execution
time faf score

# Check system resources
top  # or htop

# Clear any caches
faf clear-cache
```

## Command Reference

### Core Commands

```bash
faf init          # Initialize .faf file
faf auto          # Auto-detect and populate
faf score         # Calculate AI readiness
faf status        # Project health check
```

### Enhancement Commands

```bash
faf enhance       # Optimize context
faf trust         # Validate integrity
faf podium        # Championship scoring
```

### Sync Commands

```bash
faf sync          # Sync files
faf bi-sync       # Bidirectional sync
faf c-mirror      # Live continuous sync
```

### File Operations

```bash
faf read <path>   # Read files
faf write <path>  # Write files
faf list          # List directory
faf search <term> # Search content
```

## Performance Expectations

Expected command times:

- `faf init`: <50ms
- `faf score`: <50ms
- `faf auto`: <200ms (varies by project size)
- `faf enhance`: <500ms
- `faf bi-sync`: <100ms

If commands are significantly slower, check:
- Project size (very large projects take longer)
- Disk I/O performance
- Available system resources

## Version Support

- **Current version (3.x)**: Full support
- **Previous minor (3.x-1)**: Security fixes only
- **Versions < 3.0**: No longer supported

Always update to latest:
```bash
npm update -g faf-cli
```

## Community Guidelines

When seeking help:

- Be respectful and patient
- Provide clear, detailed information
- Include version numbers and system info
- Share full error messages
- Follow up if you solve your issue
- Help others when you can

Read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Contributing

Want to help improve faf-cli?

- Fix bugs and submit PRs
- Improve documentation
- Add test coverage
- Share use cases
- Answer questions in discussions

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Related Projects

- **.faf format** - Specification ([github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf))
- **claude-faf-mcp** - Claude Desktop integration ([github.com/Wolfe-Jam/claude-faf-mcp](https://github.com/Wolfe-Jam/claude-faf-mcp))
- **Chrome Extension** - Browser integration

## Stay Updated

- **Watch the repository** for notifications
- **Star the project** to show support
- **Follow releases** on GitHub
- **Check CHANGELOG.md** for updates

## Response Times

Expected response times:

- **Critical bugs**: 24-48 hours
- **Bug reports**: 2-5 business days
- **Feature requests**: Reviewed in planning cycles
- **Questions**: 24-48 hours (community-driven)
- **Email**: 1-3 business days

## License

faf-cli is MIT licensed. See [LICENSE](LICENSE) for details.

Note: faf-engine-mk3 (the core engine) is proprietary and available under separate license.

---

**Project created by Wolfe James**  
ORCID: [0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841)

**6,000+ downloads. Sub-50ms performance. Championship support.**

🧡 Made with care for developers worldwide
