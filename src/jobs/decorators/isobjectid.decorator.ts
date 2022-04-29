import { registerDecorator } from 'class-validator';
import mongoose from 'mongoose';

/**
 * Custom decorator to check if string is hex or objectid
 */
export function IsObjectId() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsObjectId',
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
