import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import AwsSqsConsumer from './custom-transports/aws-sqs-consumer';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    strategy: new AwsSqsConsumer({
      queueUrl: configService.get<string>('AWS_SQS_QUEUE_URL'),
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
      region: configService.get<string>('AWS_REGION'),
      cronExpression: configService.get<string>('AWS_SQS_POLL_CRON_EXPRESSION'),
      timezone: configService.get<string>('AWS_SQS_POLL_TIMEZONE'),
    }),
  });

  await app.startAllMicroservices();
  appContext.close();
}
bootstrap();
