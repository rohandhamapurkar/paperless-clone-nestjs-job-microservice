import { Injectable, Logger } from '@nestjs/common';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readdirSync,
  readFileSync,
} from 'fs';
import JSZip from 'jszip';
const logger = new Logger('ArchiveHelperService');

@Injectable()
export class ArchiveHelperService {
  async archiveFolder({
    folderName,
    folderPath,
  }: {
    folderName: string;
    folderPath: string;
  }) {
    const zip = new JSZip();

    const folder = zip.folder(folderName);
    for (const file of readdirSync(folderPath)) {
      logger.debug(
        existsSync(folderPath + '/' + file),
        folderPath + '/' + file,
      );
      const rs = readFileSync(folderPath + '/' + file);
      folder.file(file, rs, {
        compression: 'DEFLATE',
      });
    }

    const ws = createWriteStream('./tmp/out.zip');
    folder
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(ws)
      .on('finish', function () {
        console.log('zip written.');
      });
  }
}
