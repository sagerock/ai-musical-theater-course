# Experimental Components

## ⚠️ WARNING: BETA FEATURES
Components in this directory are experimental and may:
- Be removed without notice
- Have breaking changes
- Contain bugs
- Not be fully documented

## Purpose
Test new ideas and gather user feedback before committing to full development. These components:
- Are only available to opted-in users
- Have limited support
- May be removed after 3 months
- Require explicit user consent

## Rules
1. **Maximum 3 Active Experiments** at any time
2. **Time Limit**: 3 months from creation
3. **Success Criteria**: 20% adoption rate
4. **Auto-removal**: If criteria not met

## What Belongs Here
- Proof of concepts
- New AI integrations being tested
- Innovative features with uncertain value
- High-risk/high-reward features
- Features requested by single instructor

## Implementation Requirements
```javascript
import { isExperimentalFeature } from '../../config/featureFlags';

function ExperimentalFeature() {
  // Must check feature flag
  if (!isExperimentalFeature('MY_EXPERIMENT')) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p>This experimental feature is not enabled for your account.</p>
        <button onClick={optIn}>Join Beta</button>
      </div>
    );
  }

  // Must show beta warning
  return (
    <>
      <BetaWarning feature="MY_EXPERIMENT" />
      {/* Actual feature */}
    </>
  );
}
```

## Current Experiments
| Feature | Start Date | End Date | Adoption | Status |
|---------|------------|----------|----------|---------|
| _Empty_ | - | - | - | - |

## Graduation Criteria
To move to `features/`:
- Adoption rate > 20%
- Positive user feedback
- No critical bugs for 2 weeks
- Documentation complete
- Tests written

## Deprecation Process
1. Email users 2 weeks before removal
2. Export user data if applicable
3. Move to `deprecated/` for 1 month
4. Delete completely

## Monitoring
- Track usage weekly
- Gather feedback actively
- Monitor error rates
- Check performance impact