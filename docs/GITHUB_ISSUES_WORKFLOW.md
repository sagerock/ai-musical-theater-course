# GitHub Issues Workflow - Quick Guide

## 🚀 Quick Start (5 Minutes)

### Your Role: Feature Request Manager
You're the bridge between instructors and development. When instructors mention features, you capture them in GitHub Issues and manage them through the lifecycle.

## 📋 Step-by-Step Process

### Step 1: Instructor Mentions a Feature
**Instructor says:** "It would be great if students could export their chat history as a PDF"

**You quickly note:**
- What: PDF export
- Who: Students
- Why: Portfolio/documentation

### Step 2: Create GitHub Issue (2 mins)

1. Go to: https://github.com/sagerock/ai-musical-theater-course/issues
2. Click **"New Issue"**
3. Select **"Feature Request"** template
4. Quick fill:

```markdown
Title: [FEATURE] PDF Export for Chat History

Problem Statement:
Students need to export their AI chat conversations for portfolio documentation and assignment submission.

User Story:
As a student, I want to export my chat history as PDF so that I can submit it as part of my coursework.

Proposed Solution:
Add "Export as PDF" button to chat interface that generates formatted PDF with:
- Chat messages
- Timestamps
- Project/course info
- Student name

Affected Users:
- [x] Students
- [x] Instructors

Estimated users: 200+
Frequency: Weekly

Priority:
- [x] 🟡 Important
```

5. Click **"Submit new issue"**

### Step 3: Quick Evaluation (1 min)

Add this as your first comment on the issue:

```markdown
## Evaluation Score

- Mission Alignment (40%): 4/5 - Supports portfolio building and reflection
- User Impact (25%): 4/5 - All students need this for submissions
- Technical Simplicity (20%): 3/5 - PDF generation library needed
- Integration (15%): 5/5 - Simple addition to existing chat

**Total Score: 4.0/5.0 ✅ APPROVED**

Moving to prototype phase. Time budget: 4 hours.
```

### Step 4: Apply Labels

Click the ⚙️ gear next to "Labels" and add:
- `feature-request` (automatic)
- `approved` ✅
- `priority-medium` 🟡

## 🏷️ Label System

### Status Labels (Mutually Exclusive)
- `needs-evaluation` 🔍 - New, not yet scored
- `approved` ✅ - Score ≥ 3.5, ready to build
- `in-progress` 🚧 - Currently being developed
- `experimental` 🧪 - In beta testing
- `completed` ✅ - Done and deployed
- `rejected` ❌ - Didn't meet criteria

### Priority Labels
- `priority-high` 🔴 - Critical/blocking
- `priority-medium` 🟡 - Important
- `priority-low` 🟢 - Nice to have

### Category Labels
- `core-feature` 🎯 - Essential functionality
- `enhancement` ⚡ - Improves existing features
- `experimental` 🧪 - Testing new ideas

## 📊 Weekly Management Routine (10 mins)

### Monday Morning Check:
1. **View all open feature requests:**
   ```
   https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:open+label:feature-request
   ```

2. **Check experimental features (3-month limit):**
   ```
   https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+label:experimental+is:open
   ```
   - If older than 3 months → Close with explanation

3. **Review in-progress items:**
   ```
   https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+label:in-progress+is:open
   ```
   - Add status update comment if needed

## 💬 Templates for Common Scenarios

### Approving a Feature
```markdown
✅ **APPROVED** - Score: X.X/5.0

This feature aligns well with our educational mission and will benefit [X] users.

**Next steps:**
1. Prototype in `/experimental` folder
2. Test with 2-3 users
3. If successful, move to production

Time budget: X hours
Assigned to: @username
```

### Rejecting a Feature
```markdown
❌ **NOT APPROVED** - Score: X.X/5.0

Thank you for this suggestion. After evaluation:
- [Specific reason for rejection]
- [Alternative solution if applicable]

We'll keep this in mind for future roadmap planning.
```

### Moving to Experimental
```markdown
🧪 **EXPERIMENTAL RELEASE**

This feature is now available for beta testing:
- Enable with flag: `REACT_APP_FEATURE_XXX=true`
- Test period: 3 months (until [date])
- Success metric: 20% adoption

Please provide feedback in this thread.
```

### Completing a Feature
```markdown
✅ **COMPLETED**

This feature has been implemented and deployed:
- PR: #[number]
- Documentation: [link]
- How to use: [brief explanation]

Closing this issue. For bugs or improvements, please open a new issue.
```

## 🎯 Real Example: Instructor Request Flow

### Scenario: Tuesday Morning
**Instructor (in hallway):** "My students keep asking if they can see which AI model gives the best feedback on their writing. Could we add some kind of comparison feature?"

### Your Process:

**1. Quick capture (30 seconds):**
```
Note in phone: "AI model comparison for writing feedback - Instructor Smith"
```

**2. Later that day (2 minutes):**
Create issue with title: `[FEATURE] AI Model Comparison Tool for Writing Feedback`

**3. Quick evaluation (1 minute):**
- Mission: 5/5 (critical thinking about AI)
- Impact: 3/5 (subset of students)
- Technical: 2/5 (complex UI)
- Integration: 4/5 (uses existing models)
- **Score: 3.7/5 ✅**

**4. Add comment:**
"Approved for experimental. Will prototype split-screen comparison view."

**5. Thursday update:**
"Prototype complete. Rolling out to Instructor Smith's class for testing."

**6. Two weeks later:**
"15% adoption rate. Students find it confusing. Moving to deprecated."

## 📈 Monthly Reporting

Generate quick report by checking:
- **Completed this month:** Issues closed with `completed` label
- **In progress:** Open issues with `in-progress` label
- **Experimental status:** Open issues with `experimental` label + creation date
- **Rejection rate:** Rejected vs approved ratio

## 🔍 Saved Searches (Bookmark These)

```bash
# All open feature requests
https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:open+label:feature-request

# Needs evaluation
https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:open+label:needs-evaluation

# Approved, ready to build
https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:open+label:approved+-label:in-progress

# Experimental features to check
https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:open+label:experimental

# Recently completed
https://github.com/sagerock/ai-musical-theater-course/issues?q=is:issue+is:closed+label:completed+closed:>2025-01-01
```

## ⚡ Pro Tips

1. **Batch Process**: Collect feature ideas during the week, process them all on Monday
2. **Link PRs**: When coding, reference issue: "Implements #42"
3. **Use Milestones**: Create monthly milestones to group features
4. **Quick Triage**: If unsure, add `needs-discussion` label
5. **Be Transparent**: Rejected features stay visible with explanation

## 🎪 The Magic Formula

```
Instructor idea → GitHub Issue → Score it → Build or Bill (reject)
```

It's that simple. No complex tools, no new software, just GitHub Issues with a bit of structure.

---

*Remember: You're not trying to build everything. You're systematically evaluating ideas and building the ones that truly serve your educational mission.*