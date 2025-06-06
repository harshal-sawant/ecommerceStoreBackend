FROM node:latest
WORKDIR /user/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8002
CMD ["npm", "start"]