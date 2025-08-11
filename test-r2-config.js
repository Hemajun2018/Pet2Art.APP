// 测试 Cloudflare R2 配置
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

async function testR2Config() {
  console.log('🔍 测试 Cloudflare R2 配置...\n');
  
  // 检查环境变量
  const requiredEnvVars = [
    'STORAGE_ENDPOINT',
    'STORAGE_ACCESS_KEY',
    'STORAGE_SECRET_KEY',
    'STORAGE_BUCKET',
    'STORAGE_REGION'
  ];
  
  console.log('1. 检查环境变量:');
  let allEnvVarsSet = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') ? '***' : value}`);
    } else {
      console.log(`   ❌ ${envVar}: 未设置`);
      allEnvVarsSet = false;
    }
  }
  
  if (!allEnvVarsSet) {
    console.log('\n❌ 请先设置所有必需的环境变量');
    return;
  }
  
  // 创建 S3 客户端
  const s3Client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
    },
  });
  
  console.log('\n2. 测试上传功能:');
  
  try {
    // 创建测试文件内容
    const testContent = `测试文件 - ${new Date().toISOString()}`;
    const testKey = `test/r2-config-test-${Date.now()}.txt`;
    
    // 上传测试文件
    const putCommand = new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    await s3Client.send(putCommand);
    console.log(`   ✅ 成功上传测试文件: ${testKey}`);
    
    // 读取测试文件
    console.log('\n3. 测试读取功能:');
    const getCommand = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: testKey,
    });
    
    const response = await s3Client.send(getCommand);
    const bodyContent = await streamToString(response.Body);
    
    if (bodyContent === testContent) {
      console.log(`   ✅ 成功读取文件，内容匹配`);
    } else {
      console.log(`   ⚠️  文件内容不匹配`);
    }
    
    // 显示访问 URL
    console.log('\n4. 文件访问信息:');
    const publicUrl = process.env.STORAGE_DOMAIN 
      ? `${process.env.STORAGE_DOMAIN}/${testKey}`
      : `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET}/${testKey}`;
    console.log(`   📎 文件路径: ${testKey}`);
    console.log(`   🔗 访问 URL: ${publicUrl}`);
    
    console.log('\n✅ R2 配置测试成功！所有功能正常工作。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.Code) {
      console.error('   错误代码:', error.Code);
    }
    if (error.$metadata) {
      console.error('   HTTP 状态:', error.$metadata.httpStatusCode);
    }
    console.log('\n请检查:');
    console.log('1. Access Key 和 Secret Key 是否正确');
    console.log('2. 存储桶名称是否正确');
    console.log('3. API Token 是否有正确的权限');
  }
}

// 辅助函数：将流转换为字符串
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// 运行测试
testR2Config();