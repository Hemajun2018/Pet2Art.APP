interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * 使用 Resend 免费邮件服务发送邮件
 * 免费套餐：每月 3000 封邮件，每日 100 封
 */
export async function sendEmail({ to, subject, html }: EmailData) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  console.log('📧 开始发送邮件...');
  console.log('收件人:', to);
  console.log('主题:', subject);
  console.log('API Key 是否存在:', !!resendApiKey);
  console.log('API Key 前10位:', resendApiKey?.substring(0, 10));
  
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY 未配置，邮件无法发送');
    return { success: false, message: 'Email service not configured' };
  }

  const fromEmail = process.env.EMAIL_FROM || 'Pet2Art <noreply@pet2art.app>';
  console.log('发件人:', fromEmail);

  try {
    const requestBody = {
      from: fromEmail,
      to,
      subject,
      html,
    };
    
    console.log('📤 发送请求到 Resend API...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Resend API 返回错误:', error);
      console.error('响应头:', response.headers);
      return { success: false, message: `Failed to send email: ${error}` };
    }

    const result = await response.json();
    console.log('✅ 邮件发送成功!');
    console.log('邮件ID:', result.id);
    console.log('完整响应:', JSON.stringify(result, null, 2));
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ 邮件发送异常:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    return { success: false, message: `Email service error: ${error}` };
  }
}

/**
 * 生成生图完成通知邮件的HTML内容
 */
export function generateArtworkCompleteEmailHTML(data: {
  userName: string;
  artworkUrl: string;
  templateName: string;
  generationTime: number;
  webUrl: string;
}) {
  const { userName, artworkUrl, templateName, generationTime, webUrl } = data;
  const timeInMinutes = Math.round(generationTime / 1000 / 60 * 10) / 10;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pet Artwork is Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Your Pet Artwork is Complete!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Dear ${userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your pet artwork "<strong>${templateName}</strong>" has been successfully generated!
      Generation time: <strong>${timeInMinutes} minutes</strong>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <img src="${artworkUrl}" alt="Your Generated Pet Artwork" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${webUrl}/my-artworks" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
        View My Artworks
      </a>
    </div>
    
    <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h3 style="color: #1e40af; margin-top: 0;">💡 Tips:</h3>
      <ul style="color: #1e40af; margin: 10px 0;">
        <li>Download the high-resolution version to save it to your photo album</li>
        <li>Share your artwork on social media platforms</li>
        <li>Use it as your profile picture or wallpaper</li>
        <li>If you're satisfied, please leave us a review!</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
      Thank you for using Pet2Art! If you have any questions, feel free to contact us.<br>
      <a href="${webUrl}" style="color: #667eea; text-decoration: none;">${webUrl}</a>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This is an automated email, please do not reply.</p>
    <p>© 2024 Pet2Art. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 生成批量生图完成通知邮件的HTML内容
 */
export function generateBatchArtworkCompleteEmailHTML(data: {
  userName: string;
  artworks: Array<{
    url: string;
    templateName: string;
  }>;
  totalGenerationTime: number;
  webUrl: string;
}) {
  const { userName, artworks, totalGenerationTime, webUrl } = data;
  const timeInMinutes = Math.round(totalGenerationTime / 1000 / 60 * 10) / 10;

  // 生成图片网格HTML
  const imagesGridHTML = artworks.map((artwork, index) => `
    <div style="display: inline-block; width: 48%; margin: 1%; vertical-align: top;">
      <img src="${artwork.url}" alt="${artwork.templateName}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="text-align: center; margin: 10px 0 0 0; font-size: 14px; color: #666;">${index + 1}. ${artwork.templateName}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pet Artworks are Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Your ${artworks.length} Pet Artworks are Complete!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Dear ${userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your <strong>${artworks.length} pet artworks</strong> have been successfully generated!
      Total generation time: <strong>${timeInMinutes} minutes</strong>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <h3 style="color: #667eea; margin-bottom: 20px;">Your Generated Artworks:</h3>
      <div style="text-align: center;">
        ${imagesGridHTML}
      </div>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${webUrl}/my-artworks" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
        View & Download All Artworks
      </a>
    </div>
    
    <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h3 style="color: #1e40af; margin-top: 0;">💡 Tips:</h3>
      <ul style="color: #1e40af; margin: 10px 0;">
        <li>All images are available in high resolution for download</li>
        <li>Share your favorite artwork on social media</li>
        <li>Create a collage with all your pet's different styles</li>
        <li>Each artwork can be used as profile picture or wallpaper</li>
        <li>If you're satisfied, please leave us a review!</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
      Thank you for using Pet2Art! If you have any questions, feel free to contact us.<br>
      <a href="${webUrl}" style="color: #667eea; text-decoration: none;">${webUrl}</a>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>This is an automated email, please do not reply.</p>
    <p>© 2024 Pet2Art. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}