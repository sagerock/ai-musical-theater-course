# Manual Security Testing Checklist

## 🧪 **Manual Testing Guide**

Use this checklist to manually verify that security rules work correctly in your app.

## **Setup Required:**
1. Deploy updated rules to Firebase project
2. Create test accounts for each role:
   - **Student A:** `student-a@test.com`
   - **Student B:** `student-b@test.com` 
   - **Instructor:** `instructor@test.com`
   - **Admin:** `admin@test.com`
3. Create test course: "Security Test Course" with access code "SECURE123"

---

## **🎓 Student Access Tests**

### **✅ What Students SHOULD Be Able To Do:**

**Own Profile & Data:**
- [ ] View their own profile in settings
- [ ] Update their own profile information
- [ ] Create new projects
- [ ] View their own projects list
- [ ] Access their own AI chat conversations
- [ ] Upload PDFs to their own chats
- [ ] Add tags to their own chats
- [ ] Create reflections on their own work
- [ ] Join courses with valid access codes

**Course Participation:**
- [ ] View course information for courses they're enrolled in
- [ ] See other students in their courses (roster)
- [ ] Access course-specific projects and chats
- [ ] Request to join new courses

### **❌ What Students SHOULD NOT Be Able To Do:**

**Other Students' Data:**
- [ ] ❌ View other students' profiles (test by manually navigating to URL)
- [ ] ❌ Access other students' chat conversations
- [ ] ❌ View other students' projects
- [ ] ❌ Download other students' PDF attachments
- [ ] ❌ Modify other students' tags or reflections

**Course Administration:**
- [ ] ❌ View courses they're not enrolled in
- [ ] ❌ Access instructor analytics or dashboards
- [ ] ❌ Approve other students' course join requests
- [ ] ❌ Create or modify courses
- [ ] ❌ View admin panels or user management

---

## **👨‍🏫 Instructor Access Tests**

### **✅ What Instructors SHOULD Be Able To Do:**

**Own Courses:**
- [ ] View all students in their courses
- [ ] Access student chat conversations within their courses
- [ ] View student projects within their courses
- [ ] Add instructor notes to student work
- [ ] View course analytics and engagement data
- [ ] Approve/deny student join requests for their courses
- [ ] Create and manage tags for their courses
- [ ] Update course information

**Student Oversight:**
- [ ] Add tags to student chats in their courses
- [ ] View student reflections in their courses
- [ ] Export or analyze student data from their courses

### **❌ What Instructors SHOULD NOT Be Able To Do:**

**Other Courses:**
- [ ] ❌ Access student data from courses they don't teach
- [ ] ❌ View chats/projects from other instructors' courses
- [ ] ❌ Approve memberships for courses they don't teach

**Global Administration:**
- [ ] ❌ Delete users from the system
- [ ] ❌ Access global admin panels
- [ ] ❌ Modify other instructors' courses

---

## **👑 Admin Access Tests**

### **✅ What Admins SHOULD Be Able To Do:**

**Global Access:**
- [ ] View any user's profile
- [ ] Access any course information
- [ ] View any student's chats and projects
- [ ] Access global analytics across all courses
- [ ] Manage course approvals and memberships
- [ ] Delete or modify any content
- [ ] Access admin dashboard
- [ ] Manage user roles and permissions

---

## **🔐 Authentication & Course Joining Tests**

### **Course Joining Flow:**
1. **As Unauthenticated User:**
   - [ ] Can access public pages (home, pricing, FAQ)
   - [ ] Can access course join page
   - [ ] Gets redirected to login when trying to join
   - [ ] Course info is stored and continues after login

2. **As Student (joining new course):**
   - [ ] Can enter course access code
   - [ ] Can select "Student" role
   - [ ] Gets "pending approval" message
   - [ ] Cannot access course content until approved

3. **As Instructor (joining as instructor):**
   - [ ] Can enter course access code
   - [ ] Can select "Instructor" role
   - [ ] Gets "pending admin approval" message
   - [ ] Appears as instructor (not student) in admin panel

---

## **📁 File Upload & Storage Tests**

### **PDF Attachments:**
1. **As Student A:**
   - [ ] Upload PDF to their own chat
   - [ ] Can view/download their own uploaded PDF
   - [ ] Cannot access Student B's uploaded PDFs (test direct URL access)

2. **As Instructor:**
   - [ ] Can view PDFs uploaded by students in their courses
   - [ ] Cannot access PDFs from other courses

---

## **🏷️ Tag System Tests**

### **Chat Tags:**
1. **As Student:**
   - [ ] Can add tags to their own chats
   - [ ] Can view tags on their own chats
   - [ ] Cannot add tags to other students' chats

2. **As Instructor:**
   - [ ] Can add tags to any student chat in their courses
   - [ ] Can view all tagged chats in their courses
   - [ ] Cannot tag chats in other instructors' courses

---

## **⚠️ Error Testing**

### **Test Error Handling:**
- [ ] Try accessing URLs directly (e.g., `/users/other-user-id`)
- [ ] Try modifying API calls in browser dev tools
- [ ] Test with expired authentication tokens
- [ ] Test with malformed data submissions

---

## **🚨 Red Flag Indicators**

**Immediately investigate if you see:**
- Students can see other students' private conversations
- Users can access data from courses they're not in
- File uploads are accessible by unauthorized users
- Error messages reveal sensitive information
- Any user can perform admin actions

---

## **📊 Performance & Quota Tests**

### **Check for Rule Efficiency:**
- [ ] Course lists load quickly (no excessive queries)
- [ ] Chat loading doesn't trigger multiple security rule evaluations
- [ ] File uploads work within reasonable time limits
- [ ] No Firebase quota warnings in console

---

## **✅ Final Verification**

Once all tests pass:
- [ ] Rules protect student privacy ✅
- [ ] Instructors have appropriate course access ✅
- [ ] Course isolation works properly ✅
- [ ] File security is enforced ✅
- [ ] Authentication is required for all sensitive operations ✅
- [ ] No unauthorized cross-course data access ✅

**Status:** Ready for production deployment 🚀