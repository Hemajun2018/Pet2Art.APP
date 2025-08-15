// 产品 ID 配置
// 根据环境自动选择正确的产品 ID

const isProduction = process.env.NODE_ENV === 'production' && !process.env.CREEM_API_KEY?.startsWith('creem_test_');

export const PRODUCT_IDS = {
  basic: isProduction 
    ? 'prod_1hNuloy3XtXHKAFo8DarCd'  // 生产环境
    : 'prod_1hNuloy3XtXHKAFo8DarCd', // 测试环境使用相同的产品ID
    
  pro: isProduction
    ? 'prod_TRjlY3xPCfJeyWVncQsjx'   // 生产环境
    : 'prod_TRjlY3xPCfJeyWVncQsjx', // 测试环境使用相同的产品ID
    
  credits: isProduction
    ? 'prod_3gF019zN0V1z7jGm4XM04N'  // 生产环境
    : 'prod_3gF019zN0V1z7jGm4XM04N', // 测试环境使用相同的产品ID
};

export function getProductId(type: 'basic' | 'pro' | 'credits'): string {
  return PRODUCT_IDS[type];
}