FROM --platform=linux/arm64 node:14

WORKDIR /usr/app

COPY . .

RUN npm install --save-prod

CMD node dist/main