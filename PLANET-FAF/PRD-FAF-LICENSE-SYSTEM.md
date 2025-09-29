# Product Requirements Document: FAF License System

## 1. Executive Summary

### 1.1 Purpose
Implement a license control system for FAF CLI that enables monetization while maintaining an open-source distribution model. The system controls access to engine capabilities (MK-1 vs MK-2) and feature limits based on license tiers.

### 1.2 Goals
- Protect intellectual property while using free npm distribution
- Enable multiple revenue tiers without requiring private packages
- Provide seamless upgrade path from free to paid
- Maintain offline functionality without network validation

## 2. Product Overview

### 2.1 Core Concept
FAF CLI ships with both MK-1 (basic) and MK-2 (championship) engines. The license system determines which engine runs and what capabilities are available. The MK-2 engine is obfuscated but included in the package.

### 2.2 Key Principles
- **No Network Dependency**: License validation works offline
- **Progressive Enhancement**: Higher tiers unlock more capabilities
- **Single Package**: One npm package serves all tiers
- **Backward Compatible**: Existing users default to free tier

## 3. License Tiers

### 3.1 Free Tier
- **Engine**: MK-1
- **Score Cap**: 70%
- **Features**: Basic context generation, standard formats
- **Target Users**: Open source projects, hobbyists
- **Price**: $0

### 3.2 Developer Tier
- **Engine**: MK-1 Enhanced
- **Score Cap**: 85%
- **Features**: Free + cache warming, Chrome extension
- **Target Users**: Individual developers
- **Price**: $9/month (future)

### 3.3 Professional Tier
- **Engine**: MK-2
- **Score Cap**: 95%
- **Features**: Developer + advanced scoring, compiler mode
- **Target Users**: Small teams, freelancers
- **Price**: $49/month (future)

### 3.4 Enterprise Tier
- **Engine**: MK-2
- **Score Cap**: 100%
- **Features**: All features
- **Target Users**: Companies, teams
- **Price**: $899/month (future)

### 3.5 Championship Tier
- **Engine**: MK-2
- **Score Cap**: 100%
- **Features**: All + priority support, custom features
- **Target Users**: Mission-critical deployments
- **Price**: Custom

## 4. Technical Architecture

### 4.1 Components

```
┌─────────────────────────────────────┐
│           FAF CLI (npm)             │
├─────────────────────────────────────┤
│      License Controller             │
│  ┌─────────────┬─────────────┐     │
│  │  Validate   │   Store      │     │
│  └─────────────┴─────────────┘     │
├─────────────────────────────────────┤
│        Engine Loader                │
│  ┌──────────────────────────┐      │
│  │ License → Engine Selection│      │
│  └──────────────────────────┘      │
├─────────────────────────────────────┤
│  ┌─────────────┬─────────────┐     │
│  │   MK-1      │    MK-2     │     │
│  │  (Basic)    │ (Obfuscated)│     │
│  └─────────────┴─────────────┘     │
└─────────────────────────────────────┘
```

### 4.2 License Key Format
```
TYPE-ENGINE-EXPIRY-SIGNATURE
```

Examples:
- `FREE-MK1-NEVER-000000`
- `DEVELOPER-MK1-1735689600-abc123`
- `PROFESSIONAL-MK2-NEVER-def456`
- `TRIAL-MK2-1734567890-xyz789`

### 4.3 License Storage Hierarchy
1. Environment variable (`FAF_LICENSE_KEY`)
2. Project directory (`.faf-license`)
3. User home (`~/.faf/license`)
4. System-wide (`/etc/faf/license`)

## 5. User Experience

### 5.1 First Run (No License)
```bash
$ faf init
Loading MK-1 engine (free license)
✅ Created .faf file
Score: 68% (capped at 70% - free tier)

💡 Upgrade to unlock more capabilities:
Run: faf license trial <email>
```

### 5.2 License Activation
```bash
$ faf license set PROFESSIONAL-MK2-NEVER-abc123
🔑 Setting license...
✅ License activated successfully!

License Type: PROFESSIONAL
Engine: MK-2
Score Limit: 95%
Features: basic, cache, chrome-extension, advanced-scoring, compiler
```

### 5.3 Trial Flow
```bash
$ faf license trial john@example.com
✅ Trial license generated!

Your 14-day trial key:
TRIAL-MK2-1734567890-a1b2c3d4

Activate with: faf license set TRIAL-MK2-1734567890-a1b2c3d4
```

## 6. Implementation Phases

### Phase 1: Core System (Current)
- [x] License controller
- [x] Engine loader
- [x] License CLI commands
- [x] Basic MK-1/MK-2 selection

### Phase 2: Engine Protection
- [ ] Webpack bundling for MK-2
- [ ] Obfuscation pipeline
- [ ] Build verification
- [ ] Size optimization

### Phase 3: License Distribution
- [ ] License generation tool
- [ ] Key signing system
- [ ] Batch key generation
- [ ] Revocation list

### Phase 4: Monetization
- [ ] Payment integration
- [ ] License server
- [ ] Usage analytics
- [ ] Auto-renewal

## 7. Security Considerations

### 7.1 Protection Layers
1. **Code Obfuscation**: MK-2 engine is heavily obfuscated
2. **License Validation**: Keys are cryptographically signed
3. **Tamper Detection**: Self-defending code in MK-2
4. **No Source Maps**: Production builds exclude maps
5. **String Encryption**: Sensitive strings are encrypted

### 7.2 Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Key sharing | Usage analytics to detect abuse |
| Reverse engineering | Multiple obfuscation layers |
| Offline bypass | Core value in updates, not just access |
| License tampering | Signed keys with checksum |

## 8. Success Metrics

### 8.1 Technical Metrics
- License validation time: <10ms
- Engine load time: <100ms
- Obfuscated size: <500KB
- Zero network calls required

### 8.2 Business Metrics
- Free → Trial conversion: Target 10%
- Trial → Paid conversion: Target 30%
- License activation success rate: >99%
- Support tickets related to licensing: <5%

## 9. Testing Requirements

### 9.1 Unit Tests
- License validation logic
- Engine selection logic
- Key generation/validation
- Storage hierarchy

### 9.2 Integration Tests
- Full license activation flow
- Engine switching
- Score capping
- Feature gating

### 9.3 Security Tests
- Attempt to bypass license
- Tamper with obfuscated code
- Invalid key formats
- Expired licenses

## 10. Documentation Requirements

### 10.1 User Documentation
- License activation guide
- Tier comparison table
- FAQ
- Troubleshooting guide

### 10.2 Internal Documentation
- Key generation process
- Obfuscation build process
- License server API (future)
- Support runbook

## 11. Future Enhancements

### 11.1 Near Term (3 months)
- Online license validation option
- Team licenses
- License transfer mechanism
- Usage dashboard

### 11.2 Long Term (12 months)
- MK-3 engine
- Floating licenses
- API access tokens
- White-label options

## 12. Dependencies

### 12.1 Technical Dependencies
- Node.js crypto module
- Webpack (for bundling)
- Terser (for minification)
- JavaScript-obfuscator

### 12.2 Business Dependencies
- Pricing finalized
- Terms of service updated
- Support process defined
- Payment processing (Phase 4)

## 13. Launch Criteria

### 13.1 Must Have (MVP)
- [x] License tiers implemented
- [x] MK-1/MK-2 selection working
- [ ] MK-2 obfuscated
- [ ] License CLI commands
- [ ] Basic documentation

### 13.2 Should Have
- [ ] Trial key generation
- [ ] License expiry handling
- [ ] Upgrade prompts
- [ ] Analytics hooks

### 13.3 Nice to Have
- [ ] Web-based activation
- [ ] License dashboard
- [ ] Auto-upgrade flow
- [ ] Team management

## 14. Rollout Plan

### 14.1 Internal Testing
1. Test all license tiers internally
2. Verify obfuscation effectiveness
3. Performance benchmarks
4. Security audit

### 14.2 Beta Release
1. Release to select users
2. Gather feedback on UX
3. Monitor for bypass attempts
4. Refine based on feedback

### 14.3 General Availability
1. Update documentation
2. Announce in release notes
3. Enable trial generation
4. Monitor adoption metrics

## 15. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Users reject licensing | Medium | High | Strong free tier, clear value prop |
| Technical bypass found | Low | High | Multiple protection layers |
| Poor conversion rates | Medium | Medium | A/B test messaging, improve onboarding |
| Obfuscation breaks code | Low | High | Extensive testing, gradual rollout |

---

## Approval

**Product Owner**: ___________________ Date: ___________

**Engineering Lead**: ___________________ Date: ___________

**Security Review**: ___________________ Date: ___________

---

*Last Updated: 2025-09-26*
*Version: 1.0*
*Status: DRAFT*