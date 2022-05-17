<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">This project is powered by NestJS</p>
  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

This is the repository for the paperless job service which is part of the paperless clone project which lets users to upload any greeting card image or template image of their choice and then create personalized images with interpolated user data.

Consists of 2 main services api service and job service, api service also serves the user dashboard where all templates and datasets can be uploaded and the job service processes these templates and datasets together to generate data interpolated teplate images for the user.

The below is the system srchitecture when deployed on AWS.

<img src="paperless-sys-arch.drawio.svg"/>

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

NestJS is [MIT licensed](LICENSE).
