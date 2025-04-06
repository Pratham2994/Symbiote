const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Notification types
const NOTIFICATION_TYPES = {
  // Actionable notifications
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  TEAM_INVITE: 'TEAM_INVITE',
  TEAM_JOIN_REQUEST: 'TEAM_JOIN_REQUEST',
  // Non-actionable notifications
  FRIEND_REQUEST_ACCEPTED: 'FRIEND_REQUEST_ACCEPTED',
  FRIEND_REQUEST_REJECTED: 'FRIEND_REQUEST_REJECTED',
  TEAM_INVITE_ACCEPTED: 'TEAM_INVITE_ACCEPTED',
  TEAM_INVITE_REJECTED: 'TEAM_INVITE_REJECTED',
  TEAM_JOIN_REQUEST_ACCEPTED: 'TEAM_JOIN_REQUEST_ACCEPTED',
  TEAM_JOIN_REQUEST_REJECTED: 'TEAM_JOIN_REQUEST_REJECTED',
  TEAM_DELETED: 'TEAM_DELETED',
  TEAM_MEMBER_LEFT: 'TEAM_MEMBER_LEFT',
  TEAM_MEMBER_REMOVED: 'TEAM_MEMBER_REMOVED'
};

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    console.log('[EMAIL SERVICE] Verifying email configuration...');
    console.log('[EMAIL SERVICE] Email host:', process.env.EMAIL_HOST);
    console.log('[EMAIL SERVICE] Email port:', process.env.EMAIL_PORT);
    console.log('[EMAIL SERVICE] Email secure:', process.env.EMAIL_SECURE);
    console.log('[EMAIL SERVICE] Email user:', process.env.EMAIL_USER);
    console.log('[EMAIL SERVICE] Email from name:', process.env.EMAIL_FROM_NAME);
    console.log('[EMAIL SERVICE] Email from address:', process.env.EMAIL_FROM_ADDRESS);
    console.log('[EMAIL SERVICE] Frontend URL:', process.env.FRONTEND_URL);
    
    // Test the connection
    const info = await transporter.verify();
    console.log('[EMAIL SERVICE] Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL SERVICE] Email configuration verification failed:', error);
    return false;
  }
};

// Updated email template with a dark, purple-accented theme
// and a clearer button style (white text on darker purple)
const getEmailTemplate = (title, content, actionButton = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Helvetica, Arial, sans-serif';
          line-height: 1.6;
          color: #ffffff;
          margin: 0;
          padding: 0;
          background-color: #121212;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-card {
          background-color: #1f1f1f;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          padding: 30px;
          margin: 20px 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #cf79ff;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          margin-bottom: 20px;
          color: #cccccc;
        }
        /* Button styling */
        .action-button {
          display: inline-block;
          background-color: #9b59b6; /* Darker purple */
          color: #ffffff !important; /* Force white text */
          text-decoration: none !important;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          transition: background-color 0.3s ease, transform 0.3s ease;
        }
        .action-button:hover {
          background-color: #8e44ad;
          transform: translateY(-2px);
        }
        /* Make sure visited/active links stay white */
        a.action-button:visited,
        a.action-button:active {
          color: #ffffff !important;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #aaaaaa;
          margin-top: 30px;
        }
        .divider {
          border-top: 1px solid #333;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <h1>${title}</h1>
          </div>
          
          <div class="content">
            ${content}
          </div>
          
          ${actionButton ? `
            <div style="text-align: center;">
              <a href="${actionButton.url}" class="action-button">${actionButton.text}</a>
            </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Website. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send notification email based on type
const sendNotificationEmail = async (recipientEmail, notificationType, data) => {
  try {
    console.log(`[EMAIL SERVICE] Attempting to send ${notificationType} email to ${recipientEmail}`);
    console.log(`[EMAIL SERVICE] Email data:`, JSON.stringify(data, null, 2));
    
    let subject, title, content, actionButton = null;
    
    switch (notificationType) {
      case NOTIFICATION_TYPES.FRIEND_REQUEST:
        subject = 'New Friend Request';
        title = 'New Friend Request';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> wants to be your friend on our platform.</p>
          <p>You can accept or reject this request by logging into your account.</p>
        `;
        actionButton = {
          text: 'View Friend Request',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.TEAM_INVITE:
        subject = 'Team Invitation';
        title = 'Team Invitation';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has invited you to join the team <strong>${data.teamName}</strong>.</p>
          <p>You can accept or reject this invitation by logging into your account.</p>
        `;
        actionButton = {
          text: 'View Team Invitation',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.TEAM_JOIN_REQUEST:
        subject = 'Team Join Request';
        title = 'Team Join Request';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> wants to join your team <strong>${data.teamName}</strong>.</p>
          <p>You can accept or reject this request by logging into your account.</p>
        `;
        actionButton = {
          text: 'View Join Request',
          url: process.env.FRONTEND_URL
        };
        console.log(`[EMAIL SERVICE] Team join request email prepared for team: ${data.teamName}`);
        break;
        
      case NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED:
        subject = 'Friend Request Accepted';
        title = 'Friend Request Accepted';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has accepted your friend request.</p>
          <p>You can now connect and collaborate with them on our platform.</p>
        `;
        actionButton = {
          text: 'View Profile',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.FRIEND_REQUEST_REJECTED:
        subject = 'Friend Request Rejected';
        title = 'Friend Request Rejected';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has declined your friend request.</p>
        `;
        break;
        
      case NOTIFICATION_TYPES.TEAM_INVITE_ACCEPTED:
        subject = 'Team Invitation Accepted';
        title = 'Team Invitation Accepted';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has accepted your invitation to join the team <strong>${data.teamName}</strong>.</p>
          <p>They are now a member of your team.</p>
        `;
        actionButton = {
          text: 'View Team',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.TEAM_INVITE_REJECTED:
        subject = 'Team Invitation Rejected';
        title = 'Team Invitation Rejected';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has declined your invitation to join the team <strong>${data.teamName}</strong>.</p>
        `;
        break;
        
      case NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_ACCEPTED:
        subject = 'Team Join Request Accepted';
        title = 'Team Join Request Accepted';
        content = `
          <p>Hello,</p>
          <p>Your request to join the team <strong>${data.teamName}</strong> has been accepted.</p>
          <p>You are now a member of this team.</p>
        `;
        actionButton = {
          text: 'View Team',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_REJECTED:
        subject = 'Team Join Request Rejected';
        title = 'Team Join Request Rejected';
        content = `
          <p>Hello,</p>
          <p>Your request to join the team <strong>${data.teamName}</strong> has been declined.</p>
        `;
        break;
        
      case NOTIFICATION_TYPES.TEAM_DELETED:
        subject = 'Team Deleted';
        title = 'Team Deleted';
        content = `
          <p>Hello,</p>
          <p>The team <strong>${data.teamName}</strong> has been deleted.</p>
        `;
        break;
        
      case NOTIFICATION_TYPES.TEAM_MEMBER_LEFT:
        subject = 'Team Member Left';
        title = 'Team Member Left';
        content = `
          <p>Hello,</p>
          <p><strong>${data.senderUsername}</strong> has left the team <strong>${data.teamName}</strong>.</p>
        `;
        actionButton = {
          text: 'View Team',
          url: process.env.FRONTEND_URL
        };
        break;
        
      case NOTIFICATION_TYPES.TEAM_MEMBER_REMOVED:
        subject = 'Removed from Team';
        title = 'Removed from Team';
        content = `
          <p>Hello,</p>
          <p>You have been removed from the team <strong>${data.teamName}</strong> by <strong>${data.removedByUsername}</strong>.</p>
        `;
        break;
        
      default:
        subject = 'New Notification';
        title = 'New Notification';
        content = `
          <p>Hello,</p>
          <p>You have a new notification on our platform.</p>
        `;
    }
    
    // Generate HTML email with the template
    const html = getEmailTemplate(title, content, actionButton);
    
    // Send the email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: recipientEmail,
      subject: subject,
      html: html
    };
    
    console.log(`[EMAIL SERVICE] Sending email with options:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE] Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL SERVICE] Error sending ${notificationType} email to ${recipientEmail}:`, error);
    console.error(`[EMAIL SERVICE] Error details:`, {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
};

module.exports = {
  sendNotificationEmail,
  NOTIFICATION_TYPES,
  verifyEmailConfig
};
