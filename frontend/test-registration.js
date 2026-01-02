// 测试注册功能的脚本
import { registerRequest } from '../src/api/client';

async function testRegistration() {
  console.log('开始测试注册功能...');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = '123456';

  console.log(`测试邮箱: ${testEmail}`);
  console.log(`测试密码: ${testPassword}`);

  try {
    const result = await registerRequest(testEmail, testPassword);
    console.log('✅ 注册成功!', result);
    return true;
  } catch (error) {
    console.error('❌ 注册失败:', error);
    return false;
  }
}

// 在Node.js环境中运行这个测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRegistration };
}