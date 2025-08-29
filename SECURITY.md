# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | ✅ Yes            |
| 1.0.x   | ✅ Yes            |
| < 1.0   | ❌ No             |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in faf-cli, please follow these steps:

### 🔒 **Private Disclosure**

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email us directly at:
- **Security Contact**: `security@fafcli.dev`
- **Maintainer**: `hello@fafcli.dev`

### 📋 **What to Include**

Please include the following information in your report:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** and severity assessment
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### ⏱️ **Response Timeline**

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days  
- **Resolution Timeline**: Varies by severity (see below)

### 🚨 **Severity Levels**

| Severity | Response Time | Description |
|----------|---------------|-------------|
| **Critical** | 24-48 hours | Remote code execution, data breach |
| **High** | 3-7 days | Privilege escalation, local file access |
| **Medium** | 7-14 days | Information disclosure, DoS |
| **Low** | 14-30 days | Minor issues with limited impact |

### 🛡️ **Security Measures**

faf-cli implements several security best practices:

- **Minimal Dependencies**: Reduces attack surface
- **File System Sandboxing**: Only accesses project directories
- **Input Validation**: All user inputs are sanitized
- **No Network Requests**: CLI operates entirely offline
- **Read-Only Operations**: Does not modify existing project files
- **Safe YAML Parsing**: Uses secure YAML parser configuration

### 🔍 **Security Auditing**

- **npm audit**: Run automatically in CI/CD pipeline
- **Dependency Scanning**: Regular dependency vulnerability checks
- **Static Analysis**: TypeScript strict mode and ESLint security rules
- **Manual Review**: All releases undergo security review

### ⚠️ **Known Limitations**

- **File System Access**: CLI requires read access to project directories
- **Local Execution**: Runs with user's file system permissions
- **YAML Output**: Generated files contain project metadata

### 🏆 **Security Credits**

We appreciate security researchers who help improve faf-cli security. Valid vulnerabilities will be credited in our:

- **Release Notes**: Acknowledgment in security fix releases
- **Security Hall of Fame**: Listed in this file (with permission)
- **Bug Bounty**: Currently considering a bug bounty program

## 📞 **Contact**

- **Security Team**: `security@fafcli.dev`
- **General Contact**: `hello@fafcli.dev`
- **GitHub Issues**: For non-security bugs only

---

**Last Updated**: January 2025  
**Security Policy Version**: 1.0