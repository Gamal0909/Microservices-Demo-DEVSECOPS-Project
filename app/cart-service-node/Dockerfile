FROM node:20-alpine3.20

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install --omit=dev

COPY src/ ./src/

EXPOSE 8082

ENTRYPOINT ["npm", "start"]
