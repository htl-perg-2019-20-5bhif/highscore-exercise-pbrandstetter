FROM node:alpine

ENV PORT 80
EXPOSE 80

COPY . .

WORKDIR /app

RUN npm install && npm run build

FROM nginx:alpine
COPY /app/dist/ /usr/share/nginx/html/
