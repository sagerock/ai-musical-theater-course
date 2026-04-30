// Data repair utilities — placeholder for the Supabase migration.
//
// The original Firestore-era utilities used to walk every project document and
// patch missing/legacy `course_id` fields. With Postgres-backed Supabase those
// shape inconsistencies don't exist (the `projects.course_id` column is the
// single source of truth), so the repair pipeline isn't ported verbatim. If
// any data cleanup turns out to be necessary in the future it should be
// expressed as a SQL migration rather than client-side code.

const NOT_IMPLEMENTED_MESSAGE =
  'Data repair utilities are not implemented for the Supabase version yet';

export async function repairProjectCourseIds() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function diagnoseProjectIssues() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}
