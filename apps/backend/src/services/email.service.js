/**
 * 邮件服务
 * 用于发送验证码、密码找回等邮件
 */
import nodemailer from 'nodemailer';

const config = {
  host: process.env.SMTP_HOST || 'smtp.163.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
};

// 邮件传输对象
let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!config.user || !config.pass) {
      throw new Error('SMTP 未配置（需要 SMTP_USER 和 SMTP_PASS）');
    }
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }
  return transporter;
}

/**
 * 发送邮件
 * @param {string} to 收件人
 * @param {string} subject 主题
 * @param {string} html HTML 内容
 */
export async function sendEmail(to, subject, html) {
  const transport = getTransporter();
  const info = await transport.sendMail({
    from: `"麒麟云点餐" <${config.from || config.user}>`,
    to,
    subject,
    html,
  });
  return info;
}

/**
 * 发送验证码邮件
 * @param {string} email 收件邮箱
 * @param {string} code 验证码（6位数字）
 */
export async function sendVerificationCode(email, code) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Microsoft YaHei', Arial, sans-serif;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #7c3aed;">
        <h2 style="color: #7c3aed; margin: 0;">麒麟云点餐</h2>
        <p style="color: #666; margin: 5px 0 0;">安全验证</p>
      </div>
      <div style="padding: 30px 0;">
        <p style="font-size: 16px; color: #333;">您好：</p>
        <p style="font-size: 16px; color: #333;">您的验证码为：</p>
        <div style="text-align: center; padding: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #7c3aed; letter-spacing: 8px; background: #f5f3ff; padding: 10px 30px; border-radius: 8px;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #999;">验证码 5 分钟内有效，请勿泄露给他人。</p>
        <p style="font-size: 14px; color: #999;">如果您没有进行此操作，请忽略此邮件。</p>
      </div>
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999;">此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;

  await sendEmail(email, '麒麟云点餐 - 验证码', html);
}

/**
 * 发送密码重置确认邮件
 * @param {string} email 收件邮箱
 * @param {string} resetLink 重置链接
 */
export async function sendPasswordResetEmail(email, resetLink) {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Microsoft YaHei', Arial, sans-serif;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #7c3aed;">
        <h2 style="color: #7c3aed; margin: 0;">麒麟云点餐</h2>
        <p style="color: #666; margin: 5px 0 0;">密码重置</p>
      </div>
      <div style="padding: 30px 0;">
        <p style="font-size: 16px; color: #333;">您好：</p>
        <p style="font-size: 16px; color: #333;">您已申请密码重置，请点击下方按钮重设密码：</p>
        <div style="text-align: center; padding: 20px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 40px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;">重置密码</a>
        </div>
        <p style="font-size: 14px; color: #999;">链接 30 分钟内有效。</p>
        <p style="font-size: 14px; color: #999;">如果按钮无法点击，请复制以下链接到浏览器打开：</p>
        <p style="font-size: 12px; color: #7c3aed; word-break: break-all;">${resetLink}</p>
        <p style="font-size: 14px; color: #999;">如果您没有申请重置密码，请忽略此邮件。</p>
      </div>
      <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999;">此邮件由系统自动发送，请勿回复</p>
      </div>
    </div>
  `;

  await sendEmail(email, '麒麟云点餐 - 密码重置', html);
}

export default { sendEmail, sendVerificationCode, sendPasswordResetEmail };
