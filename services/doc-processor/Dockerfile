FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expone el puerto por defecto de NestJS
EXPOSE 3000

CMD ["npm", "run", "start:dev"]