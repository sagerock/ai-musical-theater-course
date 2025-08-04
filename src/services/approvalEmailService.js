import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Service for sending approval confirmation emails to students
 */
class ApprovalEmailService {
  constructor() {
    this.sendApprovalConfirmationEmail = httpsCallable(functions, 'sendApprovalConfirmationEmail');
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
}

// Create and export a singleton instance
const approvalEmailService = new ApprovalEmailService();
export default approvalEmailService;