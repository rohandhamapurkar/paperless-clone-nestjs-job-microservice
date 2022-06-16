import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { CronJob } from 'cron';

const logger = new Logger('AwsSqsConsumer');

class AwsSqsConsumer extends Server implements CustomTransportStrategy {
  private job: CronJob;
  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: () => void) {
    this.job = new CronJob(
      '* * * * * *',
      function () {
        console.log('You will see this message every second');
      },
      null,
      true,
      'Asia/Kolkata',
    );
    this.job.start();
    logger.debug('listening');
    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    logger.debug('closed');
  }
}

export default AwsSqsConsumer;
