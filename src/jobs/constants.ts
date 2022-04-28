export const TEMPLATES_COLLECTION_NAME = 'templates';
export const USERS_COLLECTION_NAME = 'users';
export const JOB_RETRY_LIMIT = 3;

export enum DATA_CONFIG_TYPES {
  STATIC_TEXT = 'staticText',
  IMAGE = 'image',
  FROM_DATASET = 'fromDataset',
}

export enum JOB_SERVICE_MESSAGE_PATTERNS {
  CREATE_JOB = 'CREATE_JOB',
  GET_JOBS = 'GET_JOBS',
  GET_JOB_CHANGELOG = 'GET_JOB_CHANGELOG',
}
