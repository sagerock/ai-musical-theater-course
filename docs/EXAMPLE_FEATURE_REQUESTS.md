# Example Feature Requests

## Real Examples Based on Common Instructor Needs

Here are three example feature requests based on the types of things instructors typically ask for. Copy and adapt these when creating issues.

---

## Example 1: Export Functionality

**Instructor says:** "Students need to submit their AI work for grades"

### GitHub Issue:

**Title:** `[FEATURE] Export Chat History as PDF/Word Document`

**Body:**
```markdown
## 📋 Feature Request

### Problem Statement
Students currently have no way to export their AI chat conversations for assignment submission or portfolio documentation. They resort to taking screenshots which is time-consuming and unprofessional.

### User Story
As a student, I want to export my chat history as a formatted document so that I can submit it as part of my coursework or include it in my portfolio.

### Proposed Solution
Add an "Export" button to the chat interface with options for:
- PDF export (formatted with headers, timestamps, proper formatting)
- Word document export (.docx)
- Plain text export (.txt)
- Include metadata: course name, project title, student name, date range

### Affected Users
- [x] Students
- [x] Instructors

**Estimated number of users affected:** 200+
**Frequency of use:** Weekly (at assignment deadlines)

### Success Metrics
- [x] Adoption rate > 50% (most students need this)
- [x] Reduces support tickets about "how to submit work"
- [x] Time saved: 10 minutes per submission

### Alignment with Mission
- [x] **Creativity** - Showcases creative AI interactions
- [x] **Judgment** - Documents critical thinking process
- [x] **Reflection** - Enables portfolio building

### Priority
- [x] 🔴 Critical - Currently blocking student submissions

### Additional Context
Multiple instructors have requested this. Current workaround of screenshots is inadequate for longer conversations.

### Evaluation Score (Team Use Only)
- Mission Alignment (40%): 4/5
- User Impact (25%): 5/5
- Technical Simplicity (20%): 3/5
- Integration (15%): 4/5
- **Total Score:** 4.1/5.0 ✅ APPROVED
```

---

## Example 2: Analytics Enhancement

**Instructor says:** "I can't tell which students are actually engaging vs just clicking around"

### GitHub Issue:

**Title:** `[FEATURE] Engagement Quality Metrics for Instructors`

**Body:**
```markdown
## 📋 Feature Request

### Problem Statement
Instructors can see quantity of interactions but not quality. They can't distinguish between meaningful engagement and superficial clicking. This makes it hard to identify students who need help.

### User Story
As an instructor, I want to see quality metrics for student engagement so that I can identify which students are truly learning and which need intervention.

### Proposed Solution
Add "Engagement Quality Score" to instructor dashboard showing:
- Average prompt length (longer = more thoughtful)
- Conversation depth (number of follow-up questions)
- Time between interactions (rushed vs thoughtful)
- Variety of AI tools used
- Use of advanced features (tags, reflections, notes)

Visual indicators:
- 🟢 High engagement (thoughtful, sustained interactions)
- 🟡 Medium engagement (some good interactions)
- 🔴 Low engagement (minimal or superficial use)

### Affected Users
- [x] Instructors
- [ ] Students (indirectly benefit from better support)

**Estimated number of users affected:** 20 instructors
**Frequency of use:** Daily

### Success Metrics
- [x] Instructors report better understanding of student needs
- [x] Early intervention rate increases by 30%
- [x] Student success metrics improve

### Alignment with Mission
- [x] **Empathy** - Helps instructors understand student struggles
- [x] **Discernment** - Identifies quality vs quantity
- [x] **Adaptability** - Enables responsive teaching

### Priority
- [x] 🟡 Important - Significantly improves instructor effectiveness

### Additional Context
Requested by 3 different instructors in the past month. This is a key differentiator from basic analytics tools.

### Evaluation Score (Team Use Only)
- Mission Alignment (40%): 5/5
- User Impact (25%): 3/5
- Technical Simplicity (20%): 3/5
- Integration (15%): 4/5
- **Total Score:** 3.9/5.0 ✅ APPROVED
```

---

## Example 3: Experimental Feature

**Instructor says:** "What if students could talk to the AI instead of typing?"

### GitHub Issue:

**Title:** `[FEATURE] Voice Input for AI Chat`

**Body:**
```markdown
## 📋 Feature Request

### Problem Statement
Some students struggle with typing or prefer verbal communication. Voice input could make the tool more accessible and natural for certain learning styles.

### User Story
As a student with dyslexia, I want to speak my questions to the AI so that I can focus on thinking rather than typing.

### Proposed Solution
Add microphone button to chat interface:
- Click to start recording
- Speech-to-text conversion
- Show transcription before sending
- Edit transcription if needed
- Send to AI as normal text

Technical approach:
- Use browser's Web Speech API
- No server-side processing needed
- Privacy-focused (local processing)

### Affected Users
- [x] Students
- [ ] Instructors

**Estimated number of users affected:** Unknown (accessibility need)
**Frequency of use:** Varies by user

### Success Metrics
- [x] Adoption rate > 20% in test group
- [x] Accessibility improvement for affected students
- [x] No performance degradation

### Alignment with Mission
- [x] **Empathy** - Inclusive design for all learners
- [x] **Adaptability** - Multiple input methods
- [x] **Creativity** - Enables stream-of-consciousness input

### Priority
- [x] 🟢 Nice to have - Good for accessibility but not critical

### Technical Considerations
- Browser compatibility varies
- Need fallback for unsupported browsers
- Privacy concerns with voice data

### Additional Context
This is experimental. Suggest testing with 1-2 classes first to gauge actual need and usage.

### Evaluation Score (Team Use Only)
- Mission Alignment (40%): 4/5
- User Impact (25%): 2/5 (small subset of users)
- Technical Simplicity (20%): 4/5 (Web API exists)
- Integration (15%): 3/5
- **Total Score:** 3.3/5.0 ❌ BELOW THRESHOLD

### Decision
- [x] Rejected (score below 3.5)
- Reason: Limited user impact doesn't justify development time
- Alternative: Suggest students use OS-level voice-to-text tools
```

---

## Quick Templates for Common Requests

### 🎯 Quick Win Template (< 2 hours)
```
Title: [FEATURE] Add [simple thing]
Problem: Users can't [basic action]
Solution: Add [simple UI element]
Impact: All users, daily use
Score: Usually 4.0+ (high impact, low effort)
```

### 🧪 Experimental Template
```
Title: [EXPERIMENTAL] Test [new concept]
Problem: We don't know if [hypothesis] would help
Solution: Simple prototype to test with 3-5 users
Impact: Unknown, need to validate
Score: Usually 3.5-3.8 (uncertain impact)
```

### ⚡ Enhancement Template
```
Title: [ENHANCEMENT] Improve [existing feature]
Problem: Current [feature] is [limitation]
Solution: Enhance by adding [improvement]
Impact: Existing users of [feature]
Score: Usually 3.8-4.2 (improves proven feature)
```

---

## Scoring Quick Reference

### High Scores (4.0+) Usually Have:
- Clear problem affecting many users
- Strong mission alignment
- Reasonable technical complexity
- Instructor specifically requested

### Low Scores (<3.5) Usually Have:
- Vague problem statement
- Benefits < 20% of users
- High complexity/maintenance
- "Nice to have" but not needed

### Automatic Approvals (Fast Track):
- Security fixes
- Accessibility improvements
- Bug fixes (not features)
- Instructor-blocking issues

---

*Use these examples as templates. Adapt based on actual instructor feedback and needs.*