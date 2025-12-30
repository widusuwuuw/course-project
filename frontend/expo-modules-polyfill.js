// 修复 expo-modules-core Web 端兼容性问题
const registerWebModule = () => {};

// 全局注入
if (typeof global !== 'undefined') {
  global.expoModulesCore = {
    registerWebModule,
    ...global.expoModulesCore,
  };
}

if (typeof window !== 'undefined') {
  window.expoModulesCore = {
    registerWebModule,
    ...window.expoModulesCore,
  };
}

// 直接导出
module.exports = {
  registerWebModule,
};