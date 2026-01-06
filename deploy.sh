#!/bin/bash
# Omnihealth 一键部署脚本
# 使用方法: chmod +x deploy.sh && sudo ./deploy.sh

set -e

echo "=========================================="
echo "  Omnihealth 项目部署脚本"
echo "=========================================="

# 配置变量 - 请修改这些值
PROJECT_DIR="/opt/omnihealth"
DOMAIN="your-domain.com"  # 或留空使用 IP 访问
SERVER_IP=$(hostname -I | awk '{print $1}')

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[1/7] 安装系统依赖...${NC}"
apt update
apt install -y python3 python3-venv python3-pip nginx git nodejs npm

echo -e "${GREEN}[2/7] 配置后端...${NC}"
cd $PROJECT_DIR/backend

# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 配置环境变量
if [ ! -f .env ]; then
    cp .env.example .env
    # 生成随机密钥
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=sqlite:///./prod.db|" .env
    echo -e "${YELLOW}请编辑 $PROJECT_DIR/backend/.env 配置 API 密钥${NC}"
fi

# 初始化数据库
python init_db.py 2>/dev/null || echo "数据库已存在"

echo -e "${GREEN}[3/7] 创建后端服务...${NC}"
cat > /etc/systemd/system/omnihealth-backend.service << EOF
[Unit]
Description=Omnihealth Backend API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/.venv/bin"
ExecStart=$PROJECT_DIR/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 设置权限
chown -R www-data:www-data $PROJECT_DIR

systemctl daemon-reload
systemctl enable omnihealth-backend
systemctl restart omnihealth-backend

echo -e "${GREEN}[4/7] 构建前端...${NC}"
cd $PROJECT_DIR/frontend

# 修改 API 地址
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
    API_URL="https://$DOMAIN/api"
else
    API_URL="http://$SERVER_IP:8000"
fi

cat > src/config.ts << EOF
export const API_BASE_URL = '$API_URL';
EOF

npm install
npx expo export --platform web

echo -e "${GREEN}[5/7] 部署前端静态文件...${NC}"
mkdir -p /var/www/omnihealth
cp -r dist/* /var/www/omnihealth/
chown -R www-data:www-data /var/www/omnihealth

echo -e "${GREEN}[6/7] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/omnihealth << EOF
server {
    listen 80;
    server_name $DOMAIN $SERVER_IP _;

    # 前端静态文件
    location / {
        root /var/www/omnihealth;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    # API 文档
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
    
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
    }
}
EOF

ln -sf /etc/nginx/sites-available/omnihealth /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo -e "${GREEN}[7/7] 部署完成！${NC}"
echo ""
echo "=========================================="
echo -e "  ${GREEN}部署成功！${NC}"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  - 前端: http://$SERVER_IP"
echo "  - 后端 API: http://$SERVER_IP:8000"
echo "  - API 文档: http://$SERVER_IP/docs"
echo ""
echo "管理命令:"
echo "  - 查看后端状态: sudo systemctl status omnihealth-backend"
echo "  - 重启后端: sudo systemctl restart omnihealth-backend"
echo "  - 查看日志: sudo journalctl -u omnihealth-backend -f"
echo ""
echo -e "${YELLOW}注意: 请确保编辑 $PROJECT_DIR/backend/.env 配置 DeepSeek API 密钥${NC}"
echo ""
