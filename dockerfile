FROM node:latest
WORKDIR /user/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8888
CMD ["npm", "start"]