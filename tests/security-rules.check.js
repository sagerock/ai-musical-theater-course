/**
 * Security rules check. Runs the real firestore.rules and storage.rules in the
 * local emulators and replays the queries the app makes, as each kind of user.
 *
 *   npm run test:security
 *
 * Rules are not filters: a query is refused unless its constraints prove every
 * result is allowed. So each case below is a query shape the client really uses
 * (must succeed) or one an outsider could try (must fail).
 */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, limit, getCountFromServer,
} = require('firebase/firestore');
const { ref, uploadString, getBytes } = require('firebase/storage');

const root = path.join(__dirname, '..');
const results = { pass: 0, fail: [] };

async function check(name, promise, shouldSucceed) {
  try {
    await (shouldSucceed ? assertSucceeds(promise) : assertFails(promise));
    results.pass++;
  } catch (e) {
    results.fail.push(`${shouldSucceed ? 'SHOULD ALLOW' : 'SHOULD DENY '}  ${name}  (${String(e.message || e).split('\n')[0].slice(0, 110)})`);
  }
}
const allow = (name, p) => check(name, p, true);
const deny = (name, p) => check(name, p, false);

const now = new Date();
const member = (userId, courseId, role) => ({ userId, courseId, role, status: 'approved' });

async function seed(env) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const put = (p, data) => setDoc(doc(db, p), data);
    const users = {
      alice: 'student', bob: 'student', sam: 'student', tara: 'student', eve: 'student',
      tina: 'instructor', ivan: 'instructor', admin: 'admin',
    };
    for (const [id, role] of Object.entries(users)) {
      await put(`users/${id}`, { id, role, name: id, email: `${id}@example.com` });
    }
    await put('courses/c1', { title: 'Course 1', createdBy: 'tina', schoolId: 's1' });
    await put('courses/c2', { title: 'Course 2', createdBy: 'ivan', schoolId: 's2' });
    await put('courseMemberships/alice_c1', member('alice', 'c1', 'student'));
    await put('courseMemberships/bob_c1', member('bob', 'c1', 'student'));
    await put('courseMemberships/sam_c1', member('sam', 'c1', 'student_assistant'));
    await put('courseMemberships/tara_c1', member('tara', 'c1', 'teaching_assistant'));
    await put('courseMemberships/tina_c1', member('tina', 'c1', 'instructor'));
    await put('courseMemberships/ivan_c2', member('ivan', 'c2', 'instructor'));
    await put('projects/pA', { title: 'A', createdBy: 'alice', courseId: 'c1', createdAt: now });
    await put('projects/pB', { title: 'B', createdBy: 'bob', courseId: 'c1', createdAt: now });
    const chat = (userId, projectId) => ({ userId, projectId, courseId: 'c1', prompt: 'p', response: 'r', createdAt: now });
    await put('chats/chA1', chat('alice', 'pA'));
    await put('chats/chA2', chat('alice', 'pA'));
    await put('chats/chB1', chat('bob', 'pB'));
    await put('chats/chLegacy', { user_id: 'alice', project_id: 'pA', createdAt: now });
    await put('pdfAttachments/atA', { chatId: 'chA1', userId: 'alice', fileName: 'a.pdf', createdAt: now });
    await put('pdfAttachments/atB', { chatId: 'chB1', userId: 'bob', fileName: 'b.pdf', createdAt: now });
    await put('reflections/rA', { chatId: 'chA1', userId: 'alice', courseId: 'c1', content: 'x', createdAt: now });
    await put('instructorNotes/nA', { projectId: 'pA', courseId: 'c1', authorId: 'tina', instructorId: 'tina', content: 'n', createdAt: now });
    await put('announcements/an1', { courseId: 'c1', authorId: 'tina', type: 'announcement', isPinned: false, commentCount: 0, createdAt: now });
    await put('announcementComments/cm1', { announcementId: 'an1', authorId: 'bob', content: 'c', createdAt: now });
    await put('modules/m1', { courseId: 'c1', title: 'M', order: 1 });
    await put('moduleProgress/alice_m1', { userId: 'alice', moduleId: 'm1', courseId: 'c1', completed: false });
    await put('courseMaterials/mat1', { courseId: 'c1', visibility: 'visible', uploadedAt: now });
    await put('courseMaterials/mat2', { courseId: 'c1', visibility: 'hidden', uploadedAt: now });
    await put('payments/pay1', { userId: 'alice', amount: 4900 });
    await put('helpRequests/h1', { userId: 'alice', message: 'help' });
    await put('tags/tgCourse', { courseId: 'c1', name: 'course tag' });
    await put('tags/tgGlobal', { name: 'global tag', isGlobal: true });
  });
}

async function main() {
  const env = await initializeTestEnvironment({
    projectId: 'demo-aeh-rules',
    firestore: { rules: fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8') },
    storage: { rules: fs.readFileSync(path.join(root, 'storage.rules'), 'utf8') },
  });
  await env.clearFirestore();
  await seed(env);

  const as = (uid, token = {}) => env.authenticatedContext(uid, { email: `${uid}@example.com`, ...token });
  const dbOf = (uid, token) => as(uid, token).firestore();
  const col = (db, name, ...c) => query(collection(db, name), ...c);

  // ---------------- An outsider: signed up, belongs to no course ----------------
  {
    const db = dbOf('eve');
    for (const name of ['chats', 'projects', 'pdfAttachments', 'reflections', 'instructorNotes', 'payments',
      'helpRequests', 'courseMaterials', 'announcements', 'announcementComments', 'modules', 'moduleProgress']) {
      await deny(`outsider lists all ${name}`, getDocs(collection(db, name)));
    }
    await deny('outsider: chats by course', getDocs(col(db, 'chats', where('courseId', '==', 'c1'))));
    await deny('outsider: chats by project', getDocs(col(db, 'chats', where('projectId', '==', 'pA'))));
    await deny('outsider: chats by another user', getDocs(col(db, 'chats', where('userId', '==', 'alice'))));
    await deny('outsider: one chat', getDoc(doc(db, 'chats/chA1')));
    await deny('outsider: projects by course', getDocs(col(db, 'projects', where('courseId', '==', 'c1'))));
    await deny('outsider: attachments by chat', getDocs(col(db, 'pdfAttachments', where('chatId', '==', 'chA1'))));
    await deny('outsider: reflections by chat', getDocs(col(db, 'reflections', where('chatId', '==', 'chA1'))));
    await deny('outsider: notes by project', getDocs(col(db, 'instructorNotes', where('projectId', '==', 'pA'))));
    await deny('outsider: materials by course', getDocs(col(db, 'courseMaterials', where('courseId', '==', 'c1'), where('visibility', '==', 'visible'))));
    await deny('outsider: announcements by course', getDocs(col(db, 'announcements', where('courseId', '==', 'c1'))));
    await deny('outsider: comments by post', getDocs(col(db, 'announcementComments', where('announcementId', '==', 'an1'))));
    await deny('outsider: comment on a post', addDoc(collection(db, 'announcementComments'), { announcementId: 'an1', authorId: 'eve', content: 'spam' }));
    await deny('outsider: modules by course', getDocs(col(db, 'modules', where('courseId', '==', 'c1'))));
    await deny('outsider: payments of a user', getDocs(col(db, 'payments', where('userId', '==', 'alice'))));

    // Privilege escalation through the user document
    await deny('user makes self admin', updateDoc(doc(db, 'users/eve'), { role: 'admin' }));
    await deny('user makes self instructor', updateDoc(doc(db, 'users/eve'), { role: 'instructor' }));
    await deny('user sets isGlobalAdmin', updateDoc(doc(db, 'users/eve'), { isGlobalAdmin: true }));
    await deny('user grants self paid access', updateDoc(doc(db, 'users/eve'), { semesterAccess: { semesterKey: 'FA2026' } }));
    await deny('user sets own school', updateDoc(doc(db, 'users/eve'), { schoolId: 's1' }));
    await deny('user overwrites doc with admin role', setDoc(doc(db, 'users/eve'), { id: 'eve', role: 'admin' }));
    await deny('user edits another profile', updateDoc(doc(db, 'users/alice'), { name: 'x' }));
    await allow('user edits own name (merge)', setDoc(doc(db, 'users/eve'), { name: 'Eve', updatedAt: now }, { merge: true }));
    await deny('global tag created by non-admin', setDoc(doc(db, 'tags/evil'), { name: 'x' }));
    await deny('global tag deleted by non-admin', deleteDoc(doc(db, 'tags/tgGlobal')));

    const signup = { email: 'x', name: 'x', isGlobalAdmin: false, emailNotificationsEnabled: true, createdAt: now, updatedAt: now };
    await allow('sign-up creates a student doc', setDoc(doc(dbOf('newbie'), 'users/newbie'), { id: 'newbie', role: 'student', ...signup }));
    await deny('sign-up as admin', setDoc(doc(dbOf('mallory'), 'users/mallory'), { id: 'mallory', role: 'admin', ...signup }));
    await deny('sign-up as instructor', setDoc(doc(dbOf('mallory'), 'users/mallory'), { id: 'mallory', role: 'instructor', ...signup }));
    await deny('sign-up with isGlobalAdmin', setDoc(doc(dbOf('mallory'), 'users/mallory'), { id: 'mallory', role: 'student', ...signup, isGlobalAdmin: true }));
    await deny('sign-up with paid access', setDoc(doc(dbOf('mallory'), 'users/mallory'), { id: 'mallory', role: 'student', ...signup, semesterAccess: {} }));
    const adminDoc = { id: 'x', role: 'admin', isGlobalAdmin: true, createdAt: now, updatedAt: now };
    await deny('unverified designated admin address', setDoc(doc(dbOf('fakeadmin', { email: 'sage+admin@sagerock.com', email_verified: false }), 'users/fakeadmin'), adminDoc));
    await allow('verified designated admin address', setDoc(doc(dbOf('realadmin', { email: 'sage+admin@sagerock.com', email_verified: true }), 'users/realadmin'), adminDoc));
  }

  // ---------------- A student looking at a classmate ----------------
  {
    const db = dbOf('bob');
    await deny('classmate: chats by project', getDocs(col(db, 'chats', where('projectId', '==', 'pA'))));
    await deny('classmate: one chat', getDoc(doc(db, 'chats/chA1')));
    await deny('classmate: whole course chats', getDocs(col(db, 'chats', where('courseId', '==', 'c1'))));
    await deny('classmate: attachments by chat', getDocs(col(db, 'pdfAttachments', where('chatId', '==', 'chA1'))));
    await deny('classmate: reflections by chat', getDocs(col(db, 'reflections', where('chatId', '==', 'chA1'))));
    await deny('classmate: notes by project', getDocs(col(db, 'instructorNotes', where('projectId', '==', 'pA'))));
    await deny('classmate: project', getDoc(doc(db, 'projects/pA')));
    await deny('classmate: module progress of course', getDocs(col(db, 'moduleProgress', where('courseId', '==', 'c1'))));
    await deny('classmate: hidden materials', getDocs(col(db, 'courseMaterials', where('courseId', '==', 'c1'))));
  }

  // ---------------- A student using the app normally ----------------
  {
    const db = dbOf('alice');
    await allow('student: project chats', getDocs(col(db, 'chats', where('projectId', '==', 'pA'), orderBy('createdAt', 'asc'))));
    await allow('student: own chats', getDocs(col(db, 'chats', where('userId', '==', 'alice'), where('courseId', '==', 'c1'), orderBy('createdAt', 'desc'), limit(20))));
    await allow('student: own chats in projects', getDocs(col(db, 'chats', where('projectId', 'in', ['pA']), where('userId', '==', 'alice'))));
    await allow('student: own chats (legacy fields)', getDocs(col(db, 'chats', where('project_id', 'in', ['pA']), where('user_id', '==', 'alice'))));
    await allow('student: module chats', getDocs(col(db, 'chats', where('moduleId', '==', 'm1'), where('userId', '==', 'alice'), orderBy('createdAt', 'asc'))));
    await allow('student: own chat count in course', getCountFromServer(col(db, 'chats', where('courseId', '==', 'c1'), where('userId', '==', 'alice'))));
    await allow('student: attachments of a chat', getDocs(col(db, 'pdfAttachments', where('chatId', '==', 'chA1'), orderBy('createdAt', 'desc'))));
    await allow('student: own attachments of chats', getDocs(col(db, 'pdfAttachments', where('userId', '==', 'alice'), where('chatId', 'in', ['chA1', 'chA2']))));
    await allow('student: reflection of a chat', getDocs(col(db, 'reflections', where('chatId', '==', 'chA1'), limit(1))));
    await allow('student: notes on own project', getDocs(col(db, 'instructorNotes', where('projectId', '==', 'pA'), orderBy('createdAt', 'desc'))));
    await allow('student: own projects', getDocs(col(db, 'projects', where('createdBy', '==', 'alice'), where('courseId', '==', 'c1'), orderBy('createdAt', 'desc'))));
    await allow('student: own project count in course', getCountFromServer(col(db, 'projects', where('courseId', '==', 'c1'), where('createdBy', '==', 'alice'))));
    await allow('student: visible materials', getDocs(col(db, 'courseMaterials', where('courseId', '==', 'c1'), where('visibility', '==', 'visible'))));
    await allow('student: announcements', getDocs(col(db, 'announcements', where('courseId', '==', 'c1'), where('isPinned', '==', false), orderBy('createdAt', 'desc'))));
    await allow('student: comments of a post', getDocs(col(db, 'announcementComments', where('announcementId', '==', 'an1'), orderBy('createdAt', 'asc'))));
    await allow('student: add a comment', addDoc(collection(db, 'announcementComments'), { announcementId: 'an1', authorId: 'alice', content: 'hi', createdAt: now }));
    await allow('student: modules', getDocs(col(db, 'modules', where('courseId', '==', 'c1'))));
    await allow('student: own module progress', getDocs(col(db, 'moduleProgress', where('userId', '==', 'alice'), where('courseId', '==', 'c1'))));
    await allow('student: own memberships', getDocs(col(db, 'courseMemberships', where('userId', '==', 'alice'), where('status', '==', 'approved'))));
    await allow('student: course tags', getDocs(col(db, 'tags', where('courseId', '==', 'c1'), orderBy('name'))));
    await allow('student: global tags', getDocs(col(db, 'tags', where('courseId', '==', null), orderBy('name'))));
    await allow('student: own payments', getDoc(doc(db, 'payments/pay1')));
    await allow('student: create chat', setDoc(doc(db, 'chats/chNew'), { userId: 'alice', projectId: 'pA', courseId: 'c1', prompt: 'p', response: 'r', createdAt: now }));
    await allow('student: read a profile by id', getDoc(doc(db, 'users/tina')));
  }

  // ---------------- Course staff ----------------
  for (const uid of ['tina', 'tara']) {
    const db = dbOf(uid);
    await allow(`${uid}: course chats`, getDocs(col(db, 'chats', where('courseId', '==', 'c1'), orderBy('createdAt', 'desc'), limit(1000))));
    await allow(`${uid}: course chat count`, getCountFromServer(col(db, 'chats', where('courseId', '==', 'c1'))));
    await allow(`${uid}: a student's project chats`, getDocs(col(db, 'chats', where('projectId', '==', 'pA'), orderBy('createdAt', 'asc'))));
    await allow(`${uid}: chats of course projects`, getDocs(col(db, 'chats', where('courseId', '==', 'c1'), where('projectId', 'in', ['pA', 'pB']))));
    await allow(`${uid}: attachments of a chat`, getDocs(col(db, 'pdfAttachments', where('chatId', '==', 'chA1'), orderBy('createdAt', 'desc'))));
    await allow(`${uid}: reflection of a chat`, getDocs(col(db, 'reflections', where('chatId', '==', 'chA1'), limit(1))));
    await allow(`${uid}: course reflections of chats`, getDocs(col(db, 'reflections', where('courseId', '==', 'c1'), where('chatId', 'in', ['chA1', 'chB1']))));
    await allow(`${uid}: notes on a project`, getDocs(col(db, 'instructorNotes', where('projectId', '==', 'pA'), orderBy('createdAt', 'desc'))));
    await allow(`${uid}: course notes of projects`, getDocs(col(db, 'instructorNotes', where('courseId', '==', 'c1'), where('projectId', 'in', ['pA', 'pB']))));
    await allow(`${uid}: course projects`, getDocs(col(db, 'projects', where('courseId', '==', 'c1'))));
    await allow(`${uid}: one project`, getDoc(doc(db, 'projects/pA')));
    await allow(`${uid}: course members`, getDocs(col(db, 'courseMemberships', where('courseId', '==', 'c1'))));
    await allow(`${uid}: course module progress`, getDocs(col(db, 'moduleProgress', where('courseId', '==', 'c1'))));
    await allow(`${uid}: module progress by module`, getDocs(col(db, 'moduleProgress', where('moduleId', '==', 'm1'))));
    await allow(`${uid}: all course materials`, getDocs(col(db, 'courseMaterials', where('courseId', '==', 'c1'), orderBy('uploadedAt', 'desc'))));
  }
  {
    // Query shapes that rely on a lookup through the parent document for each value of an "in" filter
    const db = dbOf('tina');
    await allow('staff: attachments of several chats', getDocs(col(db, 'pdfAttachments', where('chatId', 'in', ['chA1', 'chA2', 'chB1']), orderBy('createdAt', 'desc'))));
    await allow('staff: chats of several projects (no course filter)', getDocs(col(db, 'chats', where('projectId', 'in', ['pA', 'pB']))));
    await allow('staff: reflections of several chats (no course filter)', getDocs(col(db, 'reflections', where('chatId', 'in', ['chA1', 'chB1']))));
    await allow('staff: notes of several projects (no course filter)', getDocs(col(db, 'instructorNotes', where('projectId', 'in', ['pA', 'pB']))));
    await allow('student: attachments of several own chats (no user filter)', getDocs(col(dbOf('alice'), 'pdfAttachments', where('chatId', 'in', ['chA1', 'chA2']), orderBy('createdAt', 'desc'))));
    await deny('classmate: attachments of several chats', getDocs(col(dbOf('bob'), 'pdfAttachments', where('chatId', 'in', ['chA1', 'chB1']))));
  }
  await allow('instructor: own notes for dashboard', getDocs(col(dbOf('tina'), 'instructorNotes', where('instructorId', '==', 'tina'), where('courseId', '==', 'c1'), orderBy('createdAt', 'desc'))));

  // ---------------- Student assistant ----------------
  {
    const db = dbOf('sam');
    await allow('assistant: course chats', getDocs(col(db, 'chats', where('courseId', '==', 'c1'), orderBy('createdAt', 'desc'))));
    await allow('assistant: course projects', getDocs(col(db, 'projects', where('courseId', '==', 'c1'))));
    await allow('assistant: a peer project chats', getDocs(col(db, 'chats', where('projectId', '==', 'pB'), orderBy('createdAt', 'asc'))));
    await allow('assistant: course members', getDocs(col(db, 'courseMemberships', where('courseId', '==', 'c1'))));
  }

  // ---------------- An instructor of a different course ----------------
  {
    const db = dbOf('ivan');
    await deny('other instructor: course chats', getDocs(col(db, 'chats', where('courseId', '==', 'c1'))));
    await deny('other instructor: project chats', getDocs(col(db, 'chats', where('projectId', '==', 'pA'))));
    await deny('other instructor: all chats', getDocs(collection(db, 'chats')));
    await deny('other instructor: course projects', getDocs(col(db, 'projects', where('courseId', '==', 'c1'))));
    await deny('other instructor: reflections', getDocs(col(db, 'reflections', where('courseId', '==', 'c1'))));
    await deny('other instructor: notes', getDocs(col(db, 'instructorNotes', where('projectId', '==', 'pA'))));
  }

  // ---------------- Admin ----------------
  {
    const db = dbOf('admin');
    await allow('admin: all chats', getDocs(collection(db, 'chats')));
    await allow('admin: all projects', getDocs(collection(db, 'projects')));
    await allow('admin: change a role', updateDoc(doc(db, 'users/bob'), { role: 'instructor', schoolId: 's1' }));
  }

  // ---------------- Not signed in ----------------
  {
    const db = env.unauthenticatedContext().firestore();
    await deny('anonymous: chats', getDocs(collection(db, 'chats')));
    await deny('anonymous: users', getDoc(doc(db, 'users/alice')));
    await allow('anonymous: contact form', addDoc(collection(db, 'contactRequests'), { name: 'n', email: 'e@example.com' }));
    await deny('anonymous: read contact requests', getDocs(collection(db, 'contactRequests')));
  }

  // ---------------- Storage ----------------
  {
    const st = (uid) => as(uid).storage();
    const put = (uid, p) => uploadString(ref(st(uid), p), 'hello');
    await deny('storage: outsider uploads course material', put('eve', 'course-materials/c1/evil.pdf'));
    await deny('storage: student uploads course material', put('alice', 'course-materials/c1/evil.pdf'));
    await allow('storage: instructor uploads course material', put('tina', 'course-materials/c1/syllabus.pdf'));
    await allow('storage: TA uploads course material', put('tara', 'course-materials/c1/notes.pdf'));
    await deny('storage: instructor of another course uploads', put('ivan', 'course-materials/c1/evil.pdf'));
    await allow('storage: member reads course material', getBytes(ref(st('alice'), 'course-materials/c1/syllabus.pdf')));
    await deny('storage: outsider reads course material', getBytes(ref(st('eve'), 'course-materials/c1/syllabus.pdf')));
    await allow('storage: member uploads discussion attachment', put('alice', 'announcements/c1/pic.png'));
    await deny('storage: outsider uploads discussion attachment', put('eve', 'announcements/c1/pic.png'));
    await allow('storage: own pdf upload', put('alice', 'pdf-uploads/alice/chA1/doc.pdf'));
    await deny('storage: read another user pdf', getBytes(ref(st('bob'), 'pdf-uploads/alice/chA1/doc.pdf')));
    await deny('storage: write into another user folder', put('bob', 'pdf-uploads/alice/chA1/x.pdf'));
    await allow('storage: admin uploads course material', put('admin', 'course-materials/c2/a.pdf'));
  }

  await env.cleanup();
  console.log(`\n${results.pass} checks passed, ${results.fail.length} failed`);
  results.fail.forEach((f) => console.log('  ' + f));
  process.exit(results.fail.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
