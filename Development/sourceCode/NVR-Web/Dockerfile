FROM keymetrics/pm2:8-alpine
COPY package.json /app/
WORKDIR /app
RUN apk update && apk upgrade && apk add --no-cache git gcc g++ python make
RUN npm install && npm cache clean -f
COPY . /app/
# RUN rm -f /app/package.json && rm -f /app/package-lock.json
EXPOSE 443