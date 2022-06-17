import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { CronJob } from 'cron';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

const logger = new Logger('AwsSqsConsumer');

type AwsConfig = {
  queueUrl: string;
  secretAccessKey: string;
  accessKeyId: string;
  region: string;
  cronExpression: string;
  timezone: string;
};

class AwsSqsConsumer extends Server implements CustomTransportStrategy {
  private job: CronJob;
  private sqsClient: SQSClient;
  private config: AwsConfig;
  private clientContext: {
    deleteEvent: (messageReceiptHandle: string) => void;
  };

  constructor(config: AwsConfig) {
    super();
    this.config = config;
    this.sqsClient = new SQSClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
    this.clientContext = {
      deleteEvent: async (messageReceiptHandle) => {
        // create command to delete message from AWS SQS
        const command = new DeleteMessageCommand({
          QueueUrl: this.config.queueUrl,
          ReceiptHandle: messageReceiptHandle,
        });

        const response = await this.sqsClient.send(command);
        logger.debug(
          'deleteEvent:',
          response.$metadata.httpStatusCode === 200 ? 'success' : 'error',
        );
      },
    };
  }
  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: () => void) {
    this.job = new CronJob(
      this.config.cronExpression,
      async () => {
        // create command to get message from AWS SQS
        const command = new ReceiveMessageCommand({
          QueueUrl: this.config.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        });
        // get the message/s from queue
        const response = await this.sqsClient.send(command);

        // iterate over messages polled from queue and call the event classifier for each
        if (response.Messages && response.Messages.length) {
          for (const eventMsg of response.Messages) {
            // call sqs event handler for idempotent handling of event
            logger.debug('event:', eventMsg.MessageId);
            const parsedEventBody: any = JSON.parse(eventMsg.Body);
            const handler = this.messageHandlers.get(parsedEventBody.eventName);
            handler({
              event: eventMsg,
              parsedEventBody,
              clientContext: this.clientContext,
            });
          }
        } else {
          logger.debug('No messages found after polling');
        }
        logger.debug('You will see this message every minute');
      },
      null,
      true,
      this.config.timezone,
    );
    this.job.start();
    logger.log('Started cron for polling SQS queue...');
    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    this.job.stop();
    logger.debug('Polling stopped.');
  }
}

export default AwsSqsConsumer;
