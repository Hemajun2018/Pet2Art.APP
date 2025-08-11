// 产品 ID 配置
// 根据环境自动选择正确的产品 ID

const isProduction = process.env.NODE_ENV === 'production' && !process.env.CREEM_API_KEY?.startsWith('creem_test_');

export const PRODUCT_IDS = {
  basic: isProduction 
    ? 'prod_1hNuloy3XtXHKAFo8DarCd'  // 生产环境
    : 'prod_6NRplH9ln9WA0NseVYO763', // 测试环境
    
  pro: isProduction
    ? 'prod_TRjlY3xPCfJeyWVncQsjx'   // 生产环境
    : 'prod_3eZKVTki7XCsNbytTawkjh', // 测试环境
    
  credits: isProduction
    ? 'prod_3gF019zN0V1z7jGm4XM04N'  // 生产环境
    : 'prod_27rV1Mj7rtnRh6JQ8FUkas', // 测试环境
};

export function getProductId(type: 'basic' | 'pro' | 'credits'): string {
  return PRODUCT_IDS[type];
}