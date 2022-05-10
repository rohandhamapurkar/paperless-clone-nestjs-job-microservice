import { drive_v3, google } from 'googleapis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'google-auth-library';
import { Stream } from 'stream';
const logger = new Logger('GoogleService');

@Injectable()
export class GoogleService {
  private readonly jwtClient: JWT;
  private readonly gdriveClient: drive_v3.Drive;

  readonly GMAIL_USERNAME: string;
  readonly GDRIVE_OUTPUT_FOLDER_ID: string;

  constructor(private readonly configService: ConfigService) {
    const crendentials = JSON.parse(
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON'),
    );
    this.jwtClient = new google.auth.JWT(
      crendentials.client_email,
      null,
      crendentials.private_key,
      ['https://www.googleapis.com/auth/drive'],
    );
    this.jwtClient.authorize(function (err) {
      if (err) {
        logger.error(err);
        return;
      }
    });

    // get the google service instances
    this.gdriveClient = google.drive({ version: 'v3', auth: this.jwtClient });

    this.GDRIVE_OUTPUT_FOLDER_ID = this.configService.get<string>(
      'GDRIVE_OUTPUT_FOLDER_ID',
    );
  }

  /**
   * For uploading public sharable file using google drive api
   */
  async uploadPublicFile({
    filename,
    folderId,
    fileStream,
    mimeType,
  }: {
    filename: string;
    folderId: string;
    fileStream: Buffer | Stream;
    mimeType: string;
  }) {
    const fileMetadata = {
      ...(folderId && {
        parents: [folderId],
      }),
      name: filename,
    };
    const media = {
      mimeType: mimeType,
      body: fileStream,
    };

    const response1 = await this.gdriveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      auth: this.jwtClient,
    });

    await this.gdriveClient.permissions.create({
      fileId: response1.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      auth: this.jwtClient,
    });

    return {
      fileId: response1.data.id,
      link: `https://drive.google.com/uc?export=download&id=${response1.data.id}`,
    };
  }
}
