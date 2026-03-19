# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: nginx로 서빙
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN sed -i 's/listen\s*80;/listen 8001;/g; s/listen\s*\[::\]:80;/listen [::]:8001;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8001
CMD ["nginx", "-g", "daemon off;"]
