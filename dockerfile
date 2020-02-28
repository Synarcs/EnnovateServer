FROM node:@latest

WORKDIR .

RUN npm install node index.js

COPY package*.json ./

COPY . 

EXPOSE 4200
# DOCKER CONTAINER PORT

CMD ["node","index.js"]