// 测试 API 是否支持 webhook
const API_KEY = "sk-5Um5ukgkeWI6dxB8Z3JUq6MYbpz1biNQMJ4j44uCSBe5gMTk";
const API_URL = "https://api.apicore.ai/v1/images/edits";

async function testWebhook() {
  const formData = new FormData();
  
  // 添加测试参数
  formData.append('prompt', 'test');
  formData.append('n', '1');
  formData.append('size', '256x256');
  formData.append('response_format', 'url');
  formData.append('model', 'gpt-4o-image');
  
  // 尝试添加 webhook 参数（常见的参数名）
  formData.append('webhook', 'https://webhook.site/test');
  formData.append('webhook_url', 'https://webhook.site/test');
  formData.append('callback_url', 'https://webhook.site/test');
  formData.append('notification_url', 'https://webhook.site/test');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });
    
    const result = await response.json();
    console.log('Response:', result);
    
    // 如果支持 webhook，通常会返回一个任务 ID 而不是直接返回结果
    if (result.task_id || result.job_id || result.id) {
      console.log('✅ 可能支持异步/webhook！');
    } else if (result.data || result.url) {
      console.log('❌ 看起来是同步 API，不支持 webhook');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// 运行测试
testWebhook();