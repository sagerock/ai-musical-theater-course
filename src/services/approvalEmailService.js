import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Service for sending approval confirmation emails to students
 */
class ApprovalEmailService {
  constructor() {
    this.sendApprovalConfirmationEmail = httpsCallable(functions, 'sendApprovalConfirmationEmail');
    this.sendRoleChangeNotificationEmail = httpsCallable(functions, 'sendRoleChangeNotificationEmail');
    this.sendGlobalRoleChangeEmail = httpsCallable(functions, 'sendGlobalRoleChangeEmail');
  }

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

      const result = await this.sendApprovalConfirmationEmail({
        userId,
        courseId,
        approvedRole,
        approverName
      });

      console.log('✅ Approval confirmation email sent successfully:', result.data);
      return result.data;
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

      const result = await this.sendRoleChangeNotificationEmail({
        userId,
        courseId,
        oldRole,
        newRole,
        changedBy
      });

      console.log('✅ Role change notification email sent successfully:', result.data);
      return result.data;
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
      const result = await this.sendGlobalRoleChangeEmail({ userId, oldRole, newRole, changedBy });
      console.log('✅ Global role change email sent:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error sending global role change email:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const approvalEmailService = new ApprovalEmailService();
export default approvalEmailService;