import { Injectable, Logger } from '@nestjs/common';
import { fabric } from 'fabric';
import { createWriteStream } from 'fs';
import { v4 } from 'uuid';
import { DATA_CONFIG_TYPES } from './constants';
import { DataConfigType } from './entities/job.entity';
const logger = new Logger('ImageProcessorService');
@Injectable()
export class ImageProcessorService {
  readImage({
    url,
    setObj = false,
  }: {
    url: string;
    setObj?: any;
  }): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      try {
        fabric.Image.fromURL(url, (img) => {
          if (setObj) {
            img.set(setObj);
          }
          resolve(img);
        });
      } catch (err) {
        logger.error(err);
        reject(err);
      }
    });
  }

  async addTemplateImage(templateUrl: string): Promise<fabric.StaticCanvas> {
    const canvas = new fabric.StaticCanvas(null);
    const image = await this.readImage({
      url: templateUrl,
    });
    canvas
      .setDimensions({ width: image.width, height: image.height })
      .add(image)
      .renderAll();
    return canvas;
  }

  async addStaticObjects({
    canvas,
    staticConfig,
  }: {
    canvas: fabric.StaticCanvas;
    staticConfig: DataConfigType[];
  }): Promise<boolean> {
    try {
      for (const config of staticConfig) {
        switch (config.type) {
          case DATA_CONFIG_TYPES.STATIC_TEXT: {
            logger.log('info', 'Adding text.... ', config.text);
            canvas
              .add(
                new fabric.Text(config.text, {
                  left: config.position.left,
                  top: config.position.top,
                  ...config.style,
                }),
              )
              .renderAll();
          }
          case DATA_CONFIG_TYPES.IMAGE: {
            logger.log('info', 'Adding image....');
            const img = await this.readImage({
              url: config.url,
              setObj: config.position,
            });
            canvas.add(img.scale(config.scale)).renderAll();
          }
        }
      }
    } catch (err) {
      logger.error(err);
      return false;
    }

    return true;
  }

  async addFromDataset({
    canvas,
    templateImage,
    datasetObj,
    config,
    outputFolderPath,
  }: {
    canvas: fabric.StaticCanvas;
    templateImage: fabric.Image;
    datasetObj: any;
    config: DataConfigType;
    outputFolderPath: string;
  }): Promise<boolean> {
    try {
      if (!datasetObj[config.dataField]) return false;
      logger.debug(
        'info',
        'Adding field: %s with value: %s....',
        config.dataField,
        datasetObj[config.dataField],
      );
      canvas.clear();
      canvas
        .setDimensions({
          width: templateImage.width,
          height: templateImage.height,
        })
        .add(templateImage)
        .renderAll();
      canvas
        .add(
          new fabric.Text(datasetObj[config.dataField], {
            ...config.position,
            ...config.style,
          }),
        )
        .renderAll();

      const res = await this.imageWrite({
        path: outputFolderPath + '/' + v4() + '.png',
        canvas,
      });

      if (!res) {
        logger.error('Image write failed');
        return false;
      }
      return true;
    } catch (err) {
      logger.error('addFromDataset', err);
      return false;
    }
  }

  async imageWrite({
    path,
    canvas,
  }: {
    path: string;
    canvas: any;
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const imageOut = createWriteStream(path);
        const imageStream = canvas.createPNGStream();
        imageStream.on('data', function (chunk: any) {
          imageOut.write(chunk);
        });

        imageStream.on('end', function () {
          imageOut.end();
          logger.log('imageWrite Stream ended.');
          resolve(true);
        });

        imageStream.on('error', function (err: Error) {
          imageOut.end();
          logger.error(err);
          reject(false);
        });
      } catch (error) {
        logger.log(error);
        reject(false);
      }
    });
  }
}
