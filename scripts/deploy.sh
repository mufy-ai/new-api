#!/bin/bash

# 记录开始时间
echo "===============================================" | tee -a $LOG_FILE
echo "开始部署时间: $(date)" | tee -a $LOG_FILE
echo "===============================================" | tee -a $LOG_FILE

# 进入项目目录
cd /www/wwwroot/chatmindai/go-server/new-api || { echo "无法进入项目目录!" | tee -a $LOG_FILE; exit 1; }

# 拉取最新代码
echo "正在拉取最新代码..." | tee -a $LOG_FILE
git fetch --all | tee -a $LOG_FILE
git checkout prod | tee -a $LOG_FILE

# 处理可能的分支冲突
echo "设置Git拉取策略..." | tee -a $LOG_FILE
git config pull.rebase false # 使用merge策略

# 强制使用远程分支覆盖本地
echo "强制重置到远程分支..." | tee -a $LOG_FILE
git reset --hard origin/prod | tee -a $LOG_FILE
echo "代码已更新到最新版本" | tee -a $LOG_FILE

echo "正在停止当前服务..." | tee -a $LOG_FILE
docker-compose down | tee -a $LOG_FILE

# 清理构建缓存
echo "正在清理Docker构建缓存..." | tee -a $LOG_FILE
docker builder prune -f | tee -a $LOG_FILE

echo "正在构建本地镜像..." | tee -a $LOG_FILE
docker-compose build --no-cache | tee -a $LOG_FILE

echo "正在启动服务..." | tee -a $LOG_FILE
docker-compose up -d | tee -a $LOG_FILE

# 检查服务状态
echo "检查服务状态:" | tee -a $LOG_FILE
docker-compose ps | tee -a $LOG_FILE

# 记录完成时间
echo "===============================================" | tee -a $LOG_FILE
echo "部署完成时间: $(date)" | tee -a $LOG_FILE
echo "===============================================" | tee -a $LOG_FILE

echo "Docker服务已重启完成!"
