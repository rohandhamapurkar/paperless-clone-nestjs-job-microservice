import { Injectable, Logger } from '@nestjs/common';
import archiver from 'archiver';
import { PassThrough } from 'stream';
const logger = new Logger('ArchiveHelperService');

@Injectable()
export class ArchiveHelperService {
  async archiveFolder({
    folderPath,
  }: {
    folderPath: string;
  }): Promise<PassThrough> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();

    return new Promise((resolve, reject) => {
      resolve(stream);
      archive
        .directory(folderPath, false)
        .on('error', (err) => reject(err))
        .pipe(stream);

      stream.on('error', logger.error);

      stream.on('close', () => {
        logger.log('Archived files');
      });
      archive.finalize();
    });
  }
}
