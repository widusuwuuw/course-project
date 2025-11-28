#!/usr/bin/env node

/**
 * 下载轮播图片到本地，避免链接过期问题
 * 运行方式: node download-images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  {
    name: 'health-monitoring.jpg',
    url: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/51e6fb961a294259be6dee3da41f6104.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237036&Signature=txb8A83yNO5onK7TOxcdaYPuUr8%3D',
    description: '智能健康监测'
  },
  {
    name: 'fitness-tracking.jpg',
    url: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/500d8357eec0a58ab55c934bd9532b75.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237036&Signature=9ItUdgXIijYzJF/ApTx4HLxNIO8%3D',
    description: '科学运动追踪'
  },
  {
    name: 'nutrition-management.jpg',
    url: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/7442949b36adaf1bd876c88f589c0198.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237036&Signature=xawtofXvmr4IUNs/43PV1BmdvqA%3D',
    description: '精准营养管理'
  },
  {
    name: 'meditation-wellness.jpg',
    url: 'https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/cb006da4-ef18-4bf8-bbf4-fd0c50838294/c11212285bd42688f743ca74924e0bc6.jpg?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1763237036&Signature=e8IbayqlmZd4CeBo%2BCS/pIp/ZSY%3D',
    description: '身心平衡管理'
  }
];

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(resolve(filename));
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => reject(err));
    });
  });
}

async function downloadImages() {
  const assetsDir = path.join(__dirname, 'frontend', 'assets', 'images');

  // 确保目录存在
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('开始下载轮播图片...\n');

  for (const image of images) {
    try {
      console.log(`下载 ${image.description}...`);
      const filename = path.join(assetsDir, image.name);
      await downloadFile(image.url, filename);
      console.log(`✅ ${image.description} 下载完成: ${filename}\n`);
    } catch (error) {
      console.error(`❌ ${image.description} 下载失败:`, error.message);
    }
  }

  console.log('🎉 所有图片下载完成！');
  console.log('\n📁 图片已保存到: frontend/assets/images/');
  console.log('\n💡 提示: 如果以后需要使用本地图片，可以将LoginScreen.tsx中的URL改为:');
  console.log('   require("../assets/images/health-monitoring.jpg")');
}

// 如果直接运行此脚本
if (require.main === module) {
  downloadImages().catch(console.error);
}

module.exports = { downloadImages, images };