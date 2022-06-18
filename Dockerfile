FROM --platform=linux/amd64 node:14

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update

RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev --no-install-recommends

WORKDIR /usr/app

COPY . .

RUN npm install --save-prod

RUN npm run build

CMD npm run start:prod