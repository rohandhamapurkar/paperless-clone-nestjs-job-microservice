import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),

    MongooseModule.forRootAsync({
      connectionName: 'paperless-db',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    MongooseModule.forRootAsync({
      connectionName: 'datasets-db',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI_DATASETS'),
      }),
      inject: [ConfigService],
    }),

    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
