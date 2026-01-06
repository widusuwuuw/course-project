// API 基础路径配置
// 生产环境：使用空字符串，路径直接以 /api 开头，由nginx代理
// 开发环境：使用本地后端地址

const isProduction = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

export const API_BASE_URL = isProduction ? '/api' : 'http://localhost:8000';

// 如在真机演示，请改成你电脑的局域网IP，例如：
// export const API_BASE_URL = 'http://192.168.1.100:8000';
