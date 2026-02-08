# ============================================
# 优化版 Dockerfile - 利用层缓存加速构建
# ============================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 先只复制依赖清单文件（最大化利用缓存）
COPY package*.json ./

# 2. 安装依赖 - 使用 npm ci 更快更可靠
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --prefer-offline --no-audit --no-fund

# 3. 复制源码文件
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# 4. 构建
RUN npm run build

# 5. 移除开发依赖，只保留生产依赖
RUN npm prune --production

# ============================================
# Production Stage - 轻量运行时
# ============================================
FROM node:20-alpine

WORKDIR /app

# 复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 创建上传目录
RUN mkdir -p uploads/avatars

# 设置时区
ENV TZ=Asia/Shanghai

EXPOSE 3000

CMD ["node", "dist/main"]
