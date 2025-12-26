/**
 * 📧 PorVerse V2 - Email Templates
 * Professional HTML email templates
 * 
 * @version 2.0.0 - WAVE 2 UPGRADED
 */

export const emailTemplates = {
  /**
   * Welcome email - trimis la sign up
   */
  welcome: (userName: string, userId: string) => ({
    subject: 'Welcome to PorVerse! 🌟',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to PorVerse</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f23; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .header { padding: 40px 30px; text-align: center; background: rgba(0,0,0,0.2); }
          .content { padding: 40px 30px; background: #1a1a2e; }
          .button { display: inline-block; padding: 14px 32px; background: #8B5CF6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #7C3AED; }
          .feature { background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8B5CF6; padding: 16px; margin: 16px 0; border-radius: 4px; }
          .footer { padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF; background: #0f0f23; }
          h1 { margin: 0; font-size: 32px; font-weight: 700; }
          h2 { color: #A78BFA; font-size: 20px; margin-top: 0; }
          p { line-height: 1.6; color: #D1D5DB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Welcome to PorVerse!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We're thrilled to have you join PorVerse - your journey of personal transformation begins now.</p>
            
            <h3 style="color: #A78BFA; margin-top: 30px;">What's Next?</h3>
            
            <div class="feature">
              <strong>🎯 Complete Your Profile</strong>
              <p>Tell us about yourself to get personalized guidance</p>
            </div>
            
            <div class="feature">
              <strong>🚀 Start Portal 0: Activation</strong>
              <p>Begin your transformation with the foundational portal</p>
            </div>
            
            <div class="feature">
              <strong>😊 Enable Biometric Tracking</strong>
              <p>Optional: Let AI understand your emotional state for better support</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://porverse.com/en/portals?user=${userId}" class="button">
                Start Your Journey →
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #9CA3AF;">
              Need help? Reply to this email or visit our <a href="https://porverse.com/support" style="color: #8B5CF6;">Help Center</a>.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 PorVerse. All rights reserved.</p>
            <p>
              <a href="https://porverse.com/privacy" style="color: #8B5CF6; text-decoration: none;">Privacy Policy</a> •
              <a href="https://porverse.com/terms" style="color: #8B5CF6; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Portal completion - trimis când finalizezi un portal
   */
  portalCompleted: (
    userName: string,
    portalName: string,
    nextPortal: string,
    xpGained: number
  ) => ({
    subject: `🎉 Portal Complete: ${portalName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #0f0f23; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .header { padding: 40px 30px; text-align: center; background: rgba(0,0,0,0.2); }
          .content { padding: 40px 30px; background: #1a1a2e; }
          .achievement { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
          .stats { display: flex; justify-content: space-around; margin: 24px 0; }
          .stat { text-align: center; padding: 16px; }
          .stat-value { font-size: 32px; font-weight: 700; color: #8B5CF6; }
          .stat-label { font-size: 12px; color: #9CA3AF; text-transform: uppercase; }
          .button { display: inline-block; padding: 14px 32px; background: #8B5CF6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF; background: #0f0f23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 36px;">🎊 Congratulations!</h1>
          </div>
          <div class="content">
            <h2 style="color: #A78BFA;">Great work, ${userName}!</h2>
            
            <div class="achievement">
              <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
              <h3 style="margin: 0 0 8px 0; font-size: 24px;">Portal Completed</h3>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;"><strong>${portalName}</strong></p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-value">+${xpGained}</div>
                <div class="stat-label">XP Gained</div>
              </div>
              <div class="stat">
                <div class="stat-value">✓</div>
                <div class="stat-label">Completed</div>
              </div>
            </div>
            
            <p>You've gained valuable experience and unlocked new insights on your transformation journey.</p>
            
            <h3 style="color: #A78BFA; margin-top: 32px;">Ready for the Next Challenge?</h3>
            <p><strong>${nextPortal}</strong> is now available.</p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://porverse.com/en/portals" class="button">
                Continue Journey →
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 PorVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Subscription confirmation - trimis după plată
   */
  subscriptionConfirmation: (
    userName: string,
    tier: string,
    features: string[]
  ) => ({
    subject: `✨ Welcome to ${tier} Membership`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #0f0f23; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .header { padding: 40px 30px; text-align: center; background: rgba(0,0,0,0.2); }
          .content { padding: 40px 30px; background: #1a1a2e; }
          .feature { background: rgba(139, 92, 246, 0.1); padding: 16px 16px 16px 52px; margin: 12px 0; border-radius: 8px; position: relative; }
          .feature::before { content: '✓'; position: absolute; left: 16px; top: 16px; font-size: 24px; color: #10B981; }
          .button { display: inline-block; padding: 14px 32px; background: #8B5CF6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF; background: #0f0f23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 36px;">✨ Subscription Confirmed!</h1>
          </div>
          <div class="content">
            <h2 style="color: #A78BFA;">Welcome, ${userName}!</h2>
            <p>Thank you for upgrading to <strong>${tier}</strong> membership.</p>
            
            <h3 style="color: #A78BFA; margin-top: 32px;">Your Premium Features:</h3>
            
            ${features.map(feature => `
              <div class="feature">
                <strong>${feature}</strong>
              </div>
            `).join('')}
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://porverse.com/en/quantum-vault" class="button">
                Explore Premium Features →
              </a>
            </div>
            
            <p style="margin-top: 32px; font-size: 14px; color: #9CA3AF;">
              Manage your subscription anytime in <a href="https://porverse.com/en/billing" style="color: #8B5CF6;">Account Settings</a>.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 PorVerse. All rights reserved.</p>
            <p>Questions? Contact us at <a href="mailto:support@porverse.com" style="color: #8B5CF6;">support@porverse.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Password reset
   */
  passwordReset: (userName: string, resetLink: string) => ({
    subject: 'Reset Your PorVerse Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f23; color: #ffffff; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #1a1a2e; padding: 40px; border-radius: 8px; }
          .button { display: inline-block; padding: 14px 32px; background: #8B5CF6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #9CA3AF;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #9CA3AF;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  }),
}

/**
 * ✅ WAVE 2 - EMAIL TEMPLATES UPGRADED!
 * 
 * FEATURES:
 * ✅ Responsive HTML design
 * ✅ Professional styling
 * ✅ Dark theme (brand colors)
 * ✅ Call-to-action buttons
 * ✅ Dynamic content
 * ✅ Mobile-friendly
 */