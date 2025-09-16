# Deprecated Components

## ⛔ WARNING: DEPRECATED
Components in this directory are scheduled for removal. They:
- Should not be used in new code
- Will be deleted in the next major version
- May have security vulnerabilities
- Are not receiving updates

## Purpose
Temporary holding area for components being phased out. Provides:
- Grace period for migration
- Reference for replacement components
- Audit trail for removed features

## Deprecation Timeline
1. **Week 1-2**: Move component here, add console warnings
2. **Week 3-4**: Email affected users about deprecation
3. **Month 2**: Remove from UI, keep API endpoints
4. **Month 3**: Remove completely

## Current Deprecated Components
| Component | Deprecated | Remove Date | Replacement | Reason |
|-----------|------------|-------------|-------------|---------|
| _Empty_ | - | - | - | - |

## Migration Guide Template
Each deprecated component must have a `MIGRATION.md` file:
```markdown
# Migration Guide: [Component Name]

## Deprecated
[Date]

## Removal Date
[Date]

## Reason
[Why this is being removed]

## Replacement
[What to use instead]

## Migration Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Breaking Changes
- [List breaking changes]

## Support
[Contact information for help]
```

## Console Warning Implementation
```javascript
useEffect(() => {
  console.warn(
    `DEPRECATED: ${componentName} is deprecated and will be removed in version X.X.X. ` +
    `Please migrate to ${replacement}. ` +
    `See migration guide: /components/deprecated/${componentName}/MIGRATION.md`
  );
}, []);
```

## Rules
- No new features added to deprecated components
- Security fixes only
- Must have migration guide
- Must log usage for impact analysis
- Delete after 3 months maximum