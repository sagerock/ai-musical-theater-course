# AI Engagement Hub — Permissions Matrix

This document is the authoritative spec for all data access rules.
It was derived from `firestore.rules` and will be used to write Supabase RLS policies.

---

## Role Definitions

### Global Roles (stored on user record)
| Role | Description |
|------|-------------|
| `admin` | Full system access. Auto-assigned to `sage+admin@sagerock.com`. |
| `school_administrator` | Oversight of all courses within their school. Read-only on student data. |
| `student` | Default role for all new accounts. |

### Course Roles (stored in course_memberships, per course)
| Role | Description |
|------|-------------|
| `instructor` | Full course management. Can read all student work. |
| `teaching_assistant` | Same as instructor except cannot promote members above TA. |
| `student_assistant` | Can view peer projects to support mentoring. Cannot read chats. |
| `student` | Standard course participant. |

**Teaching permissions** = `instructor` OR `teaching_assistant` OR `school_administrator`
**Approved membership required** for all course content access (`status = 'approved'`).

---

## Helper Concepts (RLS policy building blocks)

These map to Supabase RLS helper functions:

- `is_admin()` — user has global role = 'admin'
- `is_school_admin_for_course(course_id)` — user is school_administrator AND user.school_id = course.school_id
- `has_teaching_role_in_course(course_id)` — approved membership with role IN (instructor, teaching_assistant) OR is_school_admin_for_course
- `is_member_of_course(course_id)` — approved membership with ANY role in that course
- `has_student_assistant_role_in_course(course_id)` — approved membership with role IN (student_assistant, teaching_assistant, instructor) OR is_school_admin_for_course
- `owns(user_id)` — row's user_id = auth.uid()

---

## Permissions by Table

### users
| Operation | Who |
|-----------|-----|
| CREATE | Nobody via client (Supabase Auth handles user creation) |
| READ | Any authenticated user can read any user record |
| LIST | `admin`, `instructor`, `teaching_assistant` only |
| UPDATE | Own record only (all roles); admin can update any |
| DELETE | Own record only; admin can delete any |

---

### courses
| Operation | Who |
|-----------|-----|
| CREATE | `admin`, or any user with global `instructor` designation |
| READ | Any authenticated user (needed for join flow) |
| LIST | Any authenticated user |
| UPDATE | `admin`; `instructor` or `teaching_assistant` in that course; `school_administrator` for their school's courses |
| DELETE | `admin`; `instructor` who created it; `school_administrator` for their school |

---

### course_memberships
| Operation | Who |
|-----------|-----|
| CREATE | `admin`; `instructor` in course (to add students directly); any authenticated user (own pending membership only — joining a course) |
| READ | Own membership; `admin`; anyone with teaching role in course |
| LIST | Own memberships; `admin`; teaching role in course |
| UPDATE | Teaching role in course (approve/reject/change role); `admin`; student can change own rejected → pending only |
| DELETE | Teaching role in course; `admin` |

**Special:** Membership ID format changes from `userId_courseId` to a standard UUID with a UNIQUE constraint on (user_id, course_id).

---

### projects
| Operation | Who |
|-----------|-----|
| CREATE | Any authenticated user who is an approved member of the course (or no course for personal projects) |
| READ | Owner; `admin`; teaching role in course; `student_assistant` in course; `school_administrator` for their school |
| LIST | All authenticated users (filtered client-side by what they have access to) |
| UPDATE | Owner only |
| DELETE | Owner only; `admin` |

**Note:** Supports both `created_by` field. Use single consistent field name going forward.

---

### chats ⚠️ Most sensitive
| Operation | Who |
|-----------|-----|
| CREATE | Owner only, must be approved member of course (or personal chat with no course) |
| READ | Owner; `admin`; teaching role in course only (NOT school_admin, NOT student_assistant) |
| LIST | Owner; `admin`; teaching role in course |
| UPDATE | Owner (own chats); `admin`; teaching role in course (can fix orphaned chats only) |
| DELETE | Owner only; `admin` |

**Critical:** School administrators and student assistants explicitly CANNOT read chats. This is intentional and must be enforced.

---

### pdf_attachments
| Operation | Who |
|-----------|-----|
| CREATE | Owner only |
| READ | Owner only; `admin` |
| LIST | Owner only; `admin` |
| UPDATE | Owner only; `admin` |
| DELETE | Owner only; `admin` |

**Note:** Future enhancement — add instructor read access via chat lookup.

---

### instructor_notes
| Operation | Who |
|-----------|-----|
| CREATE | Teaching role in course only (author_id must = auth.uid()) |
| READ | `admin`; teaching role in course; project owner (student can read notes on their own project) |
| LIST | `admin`; teaching role in course; authenticated users (filtered) |
| UPDATE | Author only (own notes) |
| DELETE | Author only; `admin` |

---

### reflections
| Operation | Who |
|-----------|-----|
| CREATE | Student, in own name (user_id = auth.uid()), must be approved course member |
| READ | Owner; `admin`; teaching role in course |
| LIST | Owner; `admin`; teaching role in course |
| UPDATE | Owner only; `admin` |
| DELETE | Owner only; `admin` |

---

### tags
| Operation | Who |
|-----------|-----|
| CREATE | Teaching role in course (course-scoped tags) |
| READ | Any authenticated course member; `admin` |
| LIST | Any authenticated user |
| UPDATE | Teaching role in course or global; `admin` |
| DELETE | Teaching role in course or global; `admin` |

---

### chat_tags
| Operation | Who |
|-----------|-----|
| CREATE | Owner of the chat; teaching role in course |
| READ | Owner of linked chat; teaching role in course; `admin` |
| LIST | Owner; teaching role in course; `admin` |
| UPDATE | Owner of linked chat; teaching role in course; `admin` |
| DELETE | Owner of linked chat; teaching role in course; `admin` |

---

### course_analytics
| Operation | Who |
|-----------|-----|
| CREATE | Server-side only (backend API with service role key) |
| READ | `admin`; teaching role in course; `school_administrator` for their school |
| LIST | `admin`; teaching role in course; `school_administrator` |
| UPDATE | Server-side only |
| DELETE | `admin` only |

**Note:** In Supabase this becomes a SQL view or materialized view — no manual caching needed.

---

### contact_requests
| Operation | Who |
|-----------|-----|
| CREATE | Public (unauthenticated) — lead gen form |
| READ | `admin` only |
| LIST | `admin` only |
| UPDATE | `admin` only |
| DELETE | `admin` only |

---

### schools
| Operation | Who |
|-----------|-----|
| CREATE | `admin` only |
| READ | Any authenticated user (active schools only); `admin` (all) |
| LIST | Any authenticated user |
| UPDATE | `admin` only |
| DELETE | `admin` only |

---

### payments
| Operation | Who |
|-----------|-----|
| CREATE | **Server-side only** (Stripe webhook via service key). NO client writes ever. |
| READ | Owner; `admin` |
| LIST | Owner; `admin` |
| UPDATE | **Server-side only** |
| DELETE | **Server-side only** |

---

### help_requests
| Operation | Who |
|-----------|-----|
| CREATE | Any authenticated user (own, user_id = auth.uid()) |
| READ | Owner; `admin` |
| LIST | Owner; `admin` |
| UPDATE | `admin` only (status management) |
| DELETE | `admin` only |

---

### course_materials
| Operation | Who |
|-----------|-----|
| CREATE | Teaching role in course |
| READ | Teaching role (all materials); course member (visible materials only) |
| LIST | Any authenticated user (filtered) |
| UPDATE | Teaching role in course |
| DELETE | Teaching role in course |

**visibility field:** `'visible'` or `'hidden'`. Students cannot see hidden materials.

---

### announcements
| Operation | Who |
|-----------|-----|
| CREATE | Teaching role (any type); course members (type='discussion' only, author_id = auth.uid()) |
| READ | Any approved course member; `admin` |
| LIST | Any authenticated user (filtered) |
| UPDATE | Teaching role in course; author of own post; any member (commentCount field only) |
| DELETE | Teaching role in course; author of own post; `admin` |

**type field:** `'announcement'` (instructor-only creation) or `'discussion'` (all members).
Students cannot change type or pin posts.

---

### announcement_comments
| Operation | Who |
|-----------|-----|
| CREATE | Any approved course member (author_id = auth.uid()) |
| READ | Any approved course member |
| LIST | Any authenticated user (filtered) |
| UPDATE | Author only |
| DELETE | Author; teaching role in course (moderation); `admin` |

---

### tutorials
| Operation | Who |
|-----------|-----|
| CREATE | `admin` only |
| READ | **Public** (unauthenticated) |
| LIST | **Public** (unauthenticated) |
| UPDATE | `admin` only |
| DELETE | `admin` only |

---

### modules
| Operation | Who |
|-----------|-----|
| CREATE | Teaching role in course |
| READ | Any authenticated user |
| LIST | Any authenticated user |
| UPDATE | Teaching role in course |
| DELETE | Teaching role in course |

---

### module_progress
| Operation | Who |
|-----------|-----|
| CREATE | Owner only (user_id = auth.uid()) |
| READ | Any authenticated user |
| LIST | Any authenticated user |
| UPDATE | Owner only |
| DELETE | `admin` only |

---

## Critical Security Rules (must test explicitly)

These are the cases most likely to cause security incidents if implemented incorrectly:

1. **Student A cannot read Student B's chats** — even in the same course
2. **Student assistants cannot read any chats** — only projects
3. **School administrators cannot read chats** — only analytics and membership management
4. **Students cannot read instructor notes on other students' projects**
5. **Pending course members cannot access course content** — status must be 'approved'
6. **Students cannot create 'announcement' type posts** — only 'discussion'
7. **Payment records cannot be created or modified by any client** — service role only
8. **Contact requests are write-only for the public** — cannot be read back by submitter

---

## Test Cases to Write Before Launch

For each rule above, write:
- A test that PASSES (legitimate access works)
- A test that FAILS (unauthorized access is blocked)

Example for rule #1:
```sql
-- Student A's chat: should return 1 row when queried as Student A
-- Student A's chat: should return 0 rows when queried as Student B
-- Student A's chat: should return 1 row when queried as Instructor
```
