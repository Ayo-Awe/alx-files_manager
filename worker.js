import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import { promisify } from 'util';
import mongodb from 'mongodb';
import db from './utils/db';

const writeFile = promisify(fs.writeFile);

const fileQueue = new Queue('image thumbnails');

fileQueue.process(async (job) => {
  if (!job.data.fileId) {
    throw new Error('Missing fileId');
  }

  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  const files = db.client.collection('files');
  const findAsync = promisify(files.findOne);

  const file = await findAsync.call(files, {
    _id: mongodb.ObjectId(job.data.fileId),
    userId: mongodb.ObjectId(job.data.userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];

  sizes.forEach(async (size) => {
    const thumbnail = await imageThumbnail(file.localPath, { width: 500 });

    await writeFile(`${file.localPath}_${size}`, thumbnail);
  });
  console.log('done2');
});
