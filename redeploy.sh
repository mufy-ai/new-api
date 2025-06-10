#!/bin/bash

# New API 重新部署脚本
# 作者: Assistant
# 功能: 拉取最新代码并重新部署Docker容器

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 New API 重新部署脚本"
echo "=========================================="

# 检查是否有Docker权限
if ! sudo docker ps > /dev/null 2>&1; then
    echo "❌ 错误: 无法访问Docker，请检查Docker是否安装并运行"
    exit 1
fi

echo "📥 1. 拉取最新代码..."
git pull origin alpha

echo "🛑 2. 停止并删除旧容器..."
if sudo docker ps -q -f name=new-api-container | grep -q .; then
    echo "   停止容器..."
    sudo docker stop new-api-container
fi

if sudo docker ps -aq -f name=new-api-container | grep -q .; then
    echo "   删除容器..."
    sudo docker rm new-api-container
fi

echo "🗑️ 3. 清理旧镜像..."
if sudo docker images -q new-api:local | grep -q .; then
    echo "   删除旧镜像..."
    sudo docker rmi new-api:local
fi

echo "🔨 4. 构建新镜像..."
sudo docker build -t new-api:local .

echo "🚀 5. 启动新容器..."
sudo docker run -d \
    --name new-api-container \
    -p 3000:3000 \
    --env-file .env \
    -v "$(pwd)/data:/data" \
    -v "$(pwd)/logs:/app/logs" \
    --network host \
    --restart unless-stopped \
    new-api:local

echo "⏳ 6. 等待服务启动..."
sleep 5

echo "🔍 7. 检查服务状态..."
if sudo docker ps -f name=new-api-container --format "table {{.Names}}\t{{.Status}}" | grep -q "Up"; then
    echo "✅ 容器启动成功!"

    # 检查API是否响应
    echo "🌐 8. 检查API服务..."
    for i in {1..10}; do
        if curl -s -f http://localhost:3000/api/status > /dev/null; then
            echo "✅ API服务正常运行!"
            echo "🌍 访问地址: http://localhost:3000"
            break
        else
            echo "   等待API服务启动... ($i/10)"
            sleep 2
        fi

        if [ $i -eq 10 ]; then
            echo "⚠️ API服务可能还在启动中，请稍后检查"
        fi
    done
else
    echo "❌ 容器启动失败!"
    echo "📋 查看日志:"
    sudo docker logs new-api-container
    exit 1
fi

echo "=========================================="
echo "🎉 重新部署完成!"
echo "📋 常用命令:"
echo "   查看日志: sudo docker logs new-api-container"
echo "   查看状态: sudo docker ps"
echo "   进入容器: sudo docker exec -it new-api-container sh"
echo "=========================================="
