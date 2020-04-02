FROM node:latest as build
COPY . /app
WORKDIR /app

RUN npm install
RUN npm run build

FROM nginx
EXPOSE 8080
COPY --from=build /app/dist/ /usr/share/nginx/html
COPY --from=build /app/default.conf /etc/nginx/conf.d/default.conf