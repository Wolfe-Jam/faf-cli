# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take the security of faf-cli seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before we have had a chance to address it
- Exploit the vulnerability beyond what is necessary to demonstrate it

### Please Do

**Report security issues via email to: team@faf.one**

Include the following information:

- Type of issue (e.g., command injection, path traversal, arbitrary file access)
- Full paths of affected command(s)
- Version of faf-cli (`faf --version`)
- Operating system and Node.js version
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment

### What to Expect

1. **Acknowledgment within 24 hours** - Confirmation of receipt
2. **Initial assessment within 72 hours** - Our evaluation
3. **Regular updates** - Progress reports as we develop fixes
4. **Coordinated disclosure** - Work together on disclosure timing
5. **Credit** - Acknowledgment in security advisory (unless you prefer anonymity)

### Our Commitment

- Respond promptly to your report
- Keep you informed of progress
- Treat your report confidentially
- Credit you for responsible disclosure (if desired)
- Issue a fix as quickly as possible

## Security Best Practices

When using faf-cli:

### For Users

- Install only from official sources:
  ```bash
  npm install -g faf-cli  # Official npm registry
  ```
- Verify package integrity when possible
- Keep faf-cli updated to latest version
- Review file paths when using file operations
- Be cautious with untrusted .faf files
- Use appropriate file permissions for sensitive projects

### For Contributors

- Follow secure coding practices
- Never commit sensitive data (API keys, tokens, credentials)
- Validate all user inputs
- Sanitize file paths
- Use environment variables for configuration
- Run security audits before submitting PRs:
  ```bash
  npm audit
  npm run build
  npm test
  ```

## Known Security Considerations

### File System Access

faf-cli requires filesystem access for its core functionality:

**What faf-cli accesses**:
- Project root directory (for .faf files)
- Files specified in commands
- User's home directory for global config (optional)

**Security measures**:
- Path validation to prevent directory traversal
- Read-only operations by default (except explicit write commands)
- No arbitrary code execution
- User consent required for modifications

### Command Injection

faf-cli does NOT:
- Execute shell commands from .faf files
- Run arbitrary code from user input
- Eval or interpret code from file contents

All operations are pure data processing.

### YAML Parsing

faf-cli uses safe YAML parsing:
- Disables dangerous YAML features
- No custom tag evaluation
- No arbitrary object instantiation
- Strict schema validation

```typescript
// Safe YAML parsing approach
const yaml = YAML.parse(content, {
  schema: 'core',  // Safe subset only
  strict: true
});
```

### Input Validation

All user inputs are validated:

```typescript
// Path validation example
function validatePath(inputPath: string): string {
  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);
  
  // Prevent directory traversal
  if (!resolved.startsWith(process.cwd())) {
    throw new SecurityError('Invalid path');
  }
  
  return resolved;
}
```

## Vulnerability Response Process

Our typical timeline:

1. **Day 0**: Report received
2. **Day 1**: Acknowledgment sent
3. **Day 3**: Initial assessment completed
4. **Day 7-30**: Fix developed and tested
5. **Day 30**: Coordinated disclosure
6. **Day 90**: Public disclosure if fix is delayed

Critical vulnerabilities receive immediate attention.

## Security Updates

- Security updates released as soon as fixes are available
- Critical vulnerabilities marked in release notes
- All security updates documented in CHANGELOG.md
- Users notified via npm advisory system

## Dependencies

faf-cli maintains minimal dependencies:

**Current dependencies** (see package.json for versions):
- commander (CLI framework)
- chalk (terminal colors)
- yaml (safe YAML parsing)
- inquirer (interactive prompts)
- ora (spinners)

**Security practices**:
- Regular dependency audits (`npm audit`)
- Automated security updates via Dependabot
- Review all dependency updates for security implications
- No deprecated or unmaintained dependencies

## Specific Security Features

### Path Traversal Protection

```typescript
// Validated in all file operations
const safePath = validateProjectPath(userInput);
```

### Read-Only by Default

Most commands are read-only:
- `faf score`, `faf status`, `faf read`, `faf list`

Write operations require explicit commands:
- `faf init`, `faf write`, `faf sync`

### No Remote Execution

faf-cli operates entirely locally:
- No network requests
- No external data transmission
- No phone-home functionality
- All operations on local filesystem

### Config File Security

Global config (if used):
- Located in user's home directory
- User-specific permissions
- No sensitive data stored
- Optional feature

## Common Vulnerabilities - Status

| Vulnerability Type | Status | Notes |
|-------------------|--------|-------|
| Command Injection | ✓ Not vulnerable | No shell command execution |
| Path Traversal | ✓ Protected | Path validation on all operations |
| Arbitrary File Access | ✓ Protected | Scoped to project directory |
| Code Injection | ✓ Not vulnerable | No code evaluation |
| YAML Bombs | ✓ Protected | Safe parsing, size limits |
| Dependency Vulnerabilities | ✓ Monitored | Automated scanning |

## Responsible Disclosure

We appreciate security researchers who:
- Report issues privately first
- Allow time for fixes before disclosure
- Provide detailed reproduction steps
- Suggest potential fixes
- Help verify patches

## Security Hall of Fame

*No vulnerabilities reported yet*

If you report a vulnerability, we will list you here (with your permission).

## Additional Resources

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Path Traversal Prevention](https://owasp.org/www-community/attacks/Path_Traversal)
- [YAML Security](https://yaml.org/spec/1.2/spec.html#id2761803)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Contact

- **Security issues**: team@faf.one
- **General questions**: [GitHub Discussions](https://github.com/Wolfe-Jam/faf/discussions)
- **Project maintainer**: Wolfe James ([ORCID: 0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841))

## Audit History

faf-cli undergoes regular security reviews:

- **v3.1.1**: No known vulnerabilities
- **v3.0.0**: Major security review completed
- **Continuous**: Automated npm audit checks

---

**Last updated**: November 2025

Thank you for helping keep faf-cli and its users safe.

**6,000+ downloads. Championship security standards.**
