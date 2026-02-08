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

# 3. 复制源码文件（分开复制以利用缓存）
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

# 4. 构建 - 增加内存限制
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ============================================
# Production Stage - 使用轻量 nginx
# ============================================
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
