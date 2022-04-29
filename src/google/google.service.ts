import { drive_v3, gmail_v1, google } from 'googleapis';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Stream } from 'stream';

@Injectable()
export class GoogleService {
  private readonly oAuthClient: OAuth2Client;
  private readonly gmailClient: gmail_v1.Gmail;
  private readonly gdriveClient: drive_v3.Drive;

  readonly GMAIL_USERNAME: string;
  readonly GDRIVE_OUTPUT_FOLDER_ID: string;

  constructor(private readonly configService: ConfigService) {
    // get the google credentials
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      this.configService.get<string>('GOOGLE_CREDENTIALS_JSON'),
    ).installed;

    // get the google oauth instance
    this.oAuthClient = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    // load the google access token
    this.oAuthClient.setCredentials(
      JSON.parse(this.configService.get<string>('GOOGLE_TOKEN_JSON')),
    );

    // get the google service instances
    this.gmailClient = google.gmail({ version: 'v1', auth: this.oAuthClient });
    this.gdriveClient = google.drive({ version: 'v3', auth: this.oAuthClient });

    this.GMAIL_USERNAME = this.configService.get<string>('GMAIL_USERNAME');
    this.GDRIVE_OUTPUT_FOLDER_ID = this.configService.get<string>(
      'GDRIVE_OUTPUT_FOLDER_ID',
    );
  }

  /**
   * For sending email using google api
   */
  async sendEmail(emailBody: string) {
    const response = await this.gmailClient.users.messages.send({
      auth: this.oAuthClient,
      userId: 'me',
      requestBody: {
        raw: Buffer.from(emailBody)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_'),
      },
    });

    if (response.status != 200) {
      throw new ServiceUnavailableException('Gmail send request failed');
    }
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
      auth: this.oAuthClient,
    });

    await this.gdriveClient.permissions.create({
      fileId: response1.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      auth: this.oAuthClient,
    });

    return {
      fileId: response1.data.id,
      link: `https://drive.google.com/uc?export=download&id=${response1.data.id}`,
    };
  }
}
