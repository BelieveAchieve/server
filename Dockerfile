FROM alpine:3.12.3

RUN apk add --update gcc npm nodejs git

COPY package.json package.json

COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

RUN ls
