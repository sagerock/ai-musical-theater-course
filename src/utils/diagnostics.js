// Diagnostic utilities — placeholder for the Supabase migration.
//
// The original Firestore version walked the `projects` and `chats` collections
// looking for legacy `course_id` vs `courseId` mismatches and orphaned chats.
// With Postgres those shape concerns are enforced by the schema, so the
// diagnostic helpers haven't been ported. If we need similar reporting later
// we should express it as SQL queries (or a small Supabase RPC).

const NOT_IMPLEMENTED_MESSAGE =
  'Data repair utilities are not implemented for the Supabase version yet';

export async function diagnoseCourseProjects(/* courseId */) {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}
