const EMAIL_API_URL = process.env.REACT_APP_EMAIL_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

async function postJson(path, payload) {
  const response = await fetch(`${EMAIL_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Request to ${path} failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Service for sending approval confirmation emails to students
 */
class ApprovalEmailService {
  /**
   * Send approval confirmation email to a student
   * @param {string} userId - ID of the user who was approved
   * @param {string} courseId - ID of the course they were approved for
   * @param {string} approvedRole - The role they were approved as
   * @param {string} approverName - Name of the person who approved them
   * @returns {Promise} - Result of the email sending operation
   */
  async sendApprovalConfirmation({ userId, courseId, approvedRole, approverName }) {
    try {
      console.log('📧 Sending approval confirmation email...', {
        userId,
        courseId,
        approvedRole,
        approverName
      });

      const result = await postJson('/api/notify/approval', {
        userId,
        courseId,
        approvedRole,
        approverName
      });

      console.log('✅ Approval confirmation email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending approval confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send role change notification email to a student
   * @param {string} userId - ID of the user whose role was changed
   * @param {string} courseId - ID of the course where the role was changed
   * @param {string} oldRole - The previous role
   * @param {string} newRole - The new role
   * @param {string} changedBy - Name of the person who changed the role
   * @returns {Promise} - Result of the email sending operation
   */
  async sendRoleChangeNotification({ userId, courseId, oldRole, newRole, changedBy }) {
    try {
      console.log('📧 Sending role change notification email...', {
        userId,
        courseId,
        oldRole,
        newRole,
        changedBy
      });

      const result = await postJson('/api/notify/role-change', {
        userId,
        courseId,
        oldRole,
        newRole,
        changedBy
      });

      console.log('✅ Role change notification email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending role change notification email:', error);
      throw error;
    }
  }

  /**
   * Send notification when a user's global role is changed
   * @param {string} userId - ID of the user whose role was changed
   * @param {string} oldRole - The previous global role
   * @param {string} newRole - The new global role
   * @param {string} changedBy - Name of the admin who changed the role
   */
  async sendGlobalRoleChangeNotification({ userId, oldRole, newRole, changedBy }) {
    try {
      console.log('📧 Sending global role change notification...', { userId, oldRole, newRole, changedBy });
      // Reuse the role-change endpoint; absence of courseId signals a global role change.
      const result = await postJson('/api/notify/role-change', {
        userId,
        oldRole,
        newRole,
        changedBy,
        scope: 'global'
      });
      console.log('✅ Global role change email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending global role change email:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const approvalEmailService = new ApprovalEmailService();
export default approvalEmailService;
