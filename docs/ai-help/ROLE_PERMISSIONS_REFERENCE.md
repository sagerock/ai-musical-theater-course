# Role Permissions Quick Reference

## Permission Matrix

| Feature/Action | Student | Student Assistant | Teaching Assistant | Instructor | School Admin | Global Admin |
|----------------|---------|-------------------|-------------------|------------|--------------|--------------|
| **Projects** |
| Create own projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View peer projects | ❌ | ✅ (read-only) | ✅ | ✅ | ✅ | ✅ |
| Edit peer projects | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Chat** |
| Use AI models | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own chats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View peer chats | ❌ | ✅ (read-only) | ✅ | ✅ | ✅ | ✅ |
| Add reflections | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Course Management** |
| View course info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View course members | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit course details | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Delete course | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create new course | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Member Management** |
| Approve enrollments | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Reject enrollments | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Remove members | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Assign roles | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Add members | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Analytics** |
| View own analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View course analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View student analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View school analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Instructor Tools** |
| Add instructor notes | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View all reflections | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage tags | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Download data | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **School Management** |
| View all school courses | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Access any school course | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View school dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign school admins | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Platform Admin** |
| Access admin panel | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage all users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create schools | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System diagnostics | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Data repair tools | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Navigation Access by Role

### Student Navigation
```
📚 Dashboard
📁 Projects (own only)
💬 AI Chat
📊 Analytics (personal)
❓ Help
```

### Student Assistant Navigation  
```
📚 Dashboard
📁 Projects (own + peer view)
  └─ Course Members link
💬 AI Chat
📊 Analytics (personal)
❓ Help
```

### Teaching Assistant Navigation
```
📚 Dashboard
🎓 Instructor Dashboard
  ├─ Overview
  ├─ Students
  ├─ Student Activity
  └─ AI Assistant
📁 Projects (all in course)
💬 AI Chat
📊 Analytics (course + personal)
❓ Help
```

### Instructor Navigation
```
📚 Dashboard
🎓 Instructor Dashboard
  ├─ Overview
  ├─ Students
  ├─ Student Activity
  ├─ AI Assistant
  └─ File Management
📁 Projects (all in course)
💬 AI Chat
📊 Analytics (course + personal)
⚙️ Course Settings
❓ Help
```

### School Administrator Navigation
```
📚 Dashboard
🏫 School Dashboard
🎓 Instructor Dashboard (per course)
📁 Projects (all in school)
💬 AI Chat
📊 Analytics (school-wide)
❓ Help
```

### Global Administrator Navigation
```
📚 Dashboard
👤 Admin Panel
  ├─ Users
  ├─ Courses
  ├─ Schools
  ├─ Approvals
  ├─ Messaging
  └─ Analytics
🏫 School Dashboard (any school)
🎓 Instructor Dashboard (any course)
📁 Projects (all)
💬 AI Chat
📊 Analytics (platform-wide)
🔧 System Tools
❓ Help
```

## Special Permissions Notes

### Course Context
- Roles can be course-specific
- Course role overrides global role within that course
- Example: Global instructor can be enrolled as student in another's course

### Data Access Philosophy
- **Students**: Own data only
- **Student Assistants**: Read peer data for helping
- **Teaching Assistants**: Read all course data for support
- **Instructors**: Full course control
- **School Admins**: Cross-course visibility in school
- **Global Admins**: Complete platform access

### Security Boundaries
1. Students cannot see other students' work (privacy)
2. Student Assistants cannot modify peer work (integrity)
3. Teaching Assistants cannot delete courses (safety)
4. Instructors cannot access other instructors' courses (isolation)
5. School Admins cannot modify courses (oversight only)
6. Only Global Admins can assign School Admin role (control)

### Email Notifications
- All role changes trigger email to affected user
- Email includes: old role, new role, who changed it
- Users can't opt out (audit trail requirement)

### Progressive Permissions
Each role builds on the previous:
```
Student 
  + peer viewing = Student Assistant
  + course analytics = Teaching Assistant  
  + course control = Instructor
  + school visibility = School Administrator
  + platform control = Global Administrator
```

## Common Permission Questions

**Q: Can a Teaching Assistant become an Instructor mid-course?**
A: Yes, any Instructor can promote them immediately.

**Q: Can Student Assistants see private reflections?**
A: No, only Teaching Assistants and above can view reflections.

**Q: Can two Instructors manage the same course?**
A: Yes, multiple co-instructors are supported.

**Q: Can School Admins change student grades?**
A: No, School Admins have view-only access to maintain academic integrity.

**Q: What happens to permissions when someone leaves a course?**
A: All course-specific permissions are immediately revoked.

---

**Remember**: Permissions are enforced at multiple levels (UI, API, and database) for security. If you can't see something, you don't have permission to access it.