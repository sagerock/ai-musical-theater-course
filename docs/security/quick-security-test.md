# 🧪 Quick Security Test Plan

## **Step 1: Test App Still Works**

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Basic functionality test:**
   - [ ] App loads without errors
   - [ ] Can log in with existing account
   - [ ] Dashboard loads
   - [ ] Can view your courses

## **Step 2: Test Course Joining (Our Recent Fix)**

3. **Test instructor registration fix:**
   - [ ] Go to `/join` while logged out
   - [ ] Enter a course code
   - [ ] Select "Instructor" role
   - [ ] Login when prompted
   - [ ] Should say "pending admin approval"
   - [ ] Check admin panel - should appear as instructor, not student

## **Step 3: Test Student Privacy (Critical)**

4. **Create test scenario:**
   - Use two different student accounts (or one student + instructor)
   - Have each create a chat conversation
   - Try to access the other's chat directly

5. **Test data isolation:**
   - [ ] Student A cannot see Student B's chats
   - [ ] Student A cannot see Student B's projects
   - [ ] Students only see their own data in lists

## **Step 4: Test File Security**

6. **PDF Upload test:**
   - [ ] Student can upload PDF to their chat
   - [ ] PDF appears in their chat
   - [ ] Try accessing PDF URL from different account (should fail)

## **Step 5: Check for Errors**

7. **Monitor browser console:**
   - [ ] No Firebase permission errors
   - [ ] No 403 (forbidden) errors during normal use
   - [ ] App functions normally

## **🚨 Red Flags (Stop if you see these):**
- Students can see other students' conversations
- Error messages like "insufficient permissions" during normal use
- App breaks or won't load after rules deployment
- Users can access admin functions they shouldn't have

## **✅ Good Signs:**
- App works normally for authorized users
- Data is properly isolated between users
- Course joining works (especially instructor registration)
- No security errors in normal use