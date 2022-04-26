import { Injectable } from '@nestjs/common';
import { fabric } from 'fabric';
@Injectable()
export class ImageProcessorService {
  addTemplateImage() {
    // var canvas = new fabric.StaticCanvas(null);
  }

  readImage({ url, setObj = false }: { url: string; setObj: any }) {
    return new Promise((resolve, reject) => {
      try {
        fabric.Image.fromURL(url, (img) => {
          if (setObj) {
            img.set(setObj);
          }
          resolve(img);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
