import { registerDecorator } from 'class-validator';
import mongoose from 'mongoose';

export function isObjectId() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: propertyName + ' must be object id string',
      },
      constraints: [],
      validator: {
        validate(value: any) {
          return mongoose.isObjectIdOrHexString(value);
        },
      },
    });
  };
}
