import nodemailer from 'nodemailer';
import { ENV } from './env';

// 创建邮件传输器
// 使用Gmail SMTP服务（需要配置应用密码）
let transporter: nodemailer.Transporter | null = null;

export async function initializeMailer() {
  // 如果已经初始化，直接返回
  if (transporter) {
    return transporter;
  }

  // 配置邮件服务
  // 使用Gmail的SMTP服务
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER || 'your-email@gmail.com',
      pass: process.env.MAIL_PASSWORD || 'your-app-password',
    },
  });

  // 验证连接
  try {
    await transporter.verify();
    console.log('[Mailer] SMTP connection verified');
  } catch (error) {
    console.error('[Mailer] SMTP connection failed:', error);
    transporter = null;
  }

  return transporter;
}

export async function getMailer() {
  if (!transporter) {
    await initializeMailer();
  }
  return transporter;
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  email: string,
  resetCode: string,
  resetLink: string
) {
  const mailer = await getMailer();
  if (!mailer) {
    throw new Error('Mail service not configured');
  }

  const mailOptions = {
    from: process.env.MAIL_USER || 'noreply@runyi-investment.com',
    to: email,
    subject: '密码重置 - 数金研投',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">密码重置请求</h2>
        <p>您好，</p>
        <p>我们收到了您的密码重置请求。请使用以下验证码重置您的密码：</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; color: #d4af37; letter-spacing: 2px;">
            ${resetCode}
          </p>
        </div>

        <p>验证码有效期为15分钟。如果您没有请求重置密码，请忽略此邮件。</p>
        
        <p>或者，您也可以点击以下链接直接重置密码：</p>
        <p><a href="${resetLink}" style="color: #d4af37; text-decoration: none;">${resetLink}</a></p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          这是一封自动生成的邮件，请勿直接回复。<br>
          © 2026 澳門潤儀投資有限公司 版權所有
        </p>
      </div>
    `,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log('[Mailer] Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailer] Failed to send password reset email:', error);
    throw error;
  }
}

/**
 * 发送测试邮件
 */
export async function sendTestEmail(email: string) {
  const mailer = await getMailer();
  if (!mailer) {
    throw new Error('Mail service not configured');
  }

  const mailOptions = {
    from: process.env.MAIL_USER || 'noreply@runyi-investment.com',
    to: email,
    subject: '测试邮件 - 数金研投',
    html: '<h1>测试邮件</h1><p>这是一封测试邮件。</p>',
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log('[Mailer] Test email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailer] Failed to send test email:', error);
    throw error;
  }
}
