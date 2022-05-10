import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.create(AppModule);

  // microservice RabbitMQ transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: 3001,
    },
  });

  // microservice TCP transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('AMQP_CONN_URI')],
      queue: configService.get<string>('AMQP_QUEUE_NAME'),
      queueOptions: {
        durable: false,
      },
      noAck: false,
      prefetchCount: 1,
    },
  });

  await app.startAllMicroservices();
  app.listen(configService.get<string>('PORT'), function () {
    Logger.log('Running on port: ' + configService.get<string>('PORT'));
  });
  appContext.close();
}
bootstrap();
