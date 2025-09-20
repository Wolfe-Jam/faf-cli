# Security Policy

## 🔒 Security First Philosophy

FAF CLI is designed with security as a foundational principle. We follow industry best practices and maintain a transparent security posture aligned with McLaren Performance Center precision and Anthropic's safety standards.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          | End of Life |
| ------- | ------------------ | ----------- |
| 2.0.x   | :white_check_mark: | Active      |
| 1.9.x   | :white_check_mark: | Dec 2025    |
| < 1.9   | :x:                | Unsupported |

## 🛡️ Security Features

### Data Protection
- **No credential storage**: FAF never stores passwords, API keys, or tokens
- **Local processing only**: All operations happen on your machine
- **No telemetry**: Zero data collection or phone-home features
- **Explicit ignores**: `.fafignore` prevents sensitive file exposure

### Safe Operations
- **Read-only by default**: No modifications without explicit flags
- **Sandboxed discovery**: File scanning respects system permissions
- **Pattern validation**: All glob patterns are sanitized
- **Path traversal prevention**: Cannot access files outside project root

### Secure Practices
```yaml
# FAF automatically ignores:
- .env files (uses .env.example only)
- Private keys (*.key, *.pem)
- Credentials (*.credentials, *.secret)
- Password files
- SSH keys
- Cloud credentials
```

## 🚨 Reporting Vulnerabilities

We take security seriously and appreciate responsible disclosure.

### How to Report

1. **DO NOT** create public GitHub issues for security vulnerabilities
2. Email: security@fafdev.tools
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Our Commitment

- **First response**: Within 24 hours
- **Status update**: Within 48 hours
- **Resolution target**: Within 72 hours (F1 standard)
- **Credit**: Security researchers will be acknowledged (unless anonymity requested)

### Severity Levels

| Level | Response Time | Resolution Target |
|-------|--------------|-------------------|
| Critical | 2 hours | 24 hours |
| High | 8 hours | 48 hours |
| Medium | 24 hours | 72 hours |
| Low | 48 hours | 1 week |

## 🔍 Security Audit

FAF undergoes regular security reviews:

- **Automated scanning**: Every commit via GitHub Actions
- **Dependency audits**: Weekly npm audit checks
- **Code review**: All PRs require security review
- **Penetration testing**: Quarterly third-party assessment

## 🛠️ Secure Development

### For Contributors

All code contributions must:
1. Pass security linting (ESLint security plugin)
2. Include tests for security-sensitive features
3. Document any security implications
4. Follow OWASP guidelines

### Security Checklist

Before each release:
- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Path traversal impossible
- [ ] No eval() or dynamic code execution
- [ ] Dependencies updated and audited
- [ ] Security tests passing

## 📋 Security Best Practices for Users

### Recommended Usage

1. **Use .fafignore**
   ```
   # Always exclude sensitive files
   .env
   *.key
   *.pem
   secrets/
   credentials/
   ```

2. **Review before sharing**
   - Check .faf contents before committing
   - Ensure no sensitive data included
   - Use `faf validate --security` to scan

3. **Keep updated**
   ```bash
   npm update -g @faf/cli  # Regular updates
   faf --version          # Check version
   ```

### What FAF Never Does

- ❌ Never uploads files to external servers
- ❌ Never stores credentials or secrets
- ❌ Never modifies files without explicit permission
- ❌ Never executes arbitrary code
- ❌ Never collects usage analytics

## 🏆 Security Achievements

- **Zero security incidents** since launch
- **100% local processing** - no cloud dependencies
- **SOC 2 principles** followed (though not certified)
- **GDPR compliant** - no personal data processing

## 📞 Security Contacts

- **Primary**: security@fafdev.tools
- **Backup**: github.com/Wolfe-Jam/faf-cli/security
- **PGP Key**: Available at fafdev.tools/security.asc

## 🔐 Cryptographic Details

### File Hashing
- Algorithm: SHA-256
- Used for: Cache validation, file integrity

### No Encryption Required
FAF doesn't encrypt data because:
- All processing is local
- No sensitive data is stored
- Output is meant to be shared

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Guidelines](https://docs.npmjs.com/security-best-practices)

## 🚦 Security Status

Current Security Status: **🟢 ALL SYSTEMS SECURE**

Last Security Audit: 2025-09-20
Next Scheduled Audit: 2025-10-20

---

## Commitment

> "Security isn't a feature, it's a foundation. Like McLaren's safety systems and Anthropic's AI safety research, we build security into every line of code."

*— FAF Security Team*

---

**Questions?** Contact security@fafdev.tools

**Found a vulnerability?** Please report responsibly. We appreciate your help in keeping FAF secure.

---

*This security policy is updated quarterly or as needed for critical updates.*

*Last Updated: 2025-09-20*