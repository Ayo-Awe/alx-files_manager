import { promisify } from 'util';
import mongodb from 'mongodb';
import mime from 'mime-types';
import fs from 'fs';
import db from '../utils/db';
import fileUtils, { checkFile } from '../utils/files';

export default class FilesController {
  static async postUpload(req, res) {
    const files = db.client.collection('files');
    const findAsync = promisify(files.findOne);
    const createAsync = promisify(files.insert);

    const {
      name, type, isPublic = false, parentId = 0, data,
    } = req.body;
    const allowedTypes = ['folder', 'file', 'image'];

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parent = await findAsync.call(files, {
        _id: mongodb.ObjectId(parentId),
      });

      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const filePayload = {
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : mongodb.ObjectId(parentId),
      userId: req.user._id,
    };

    if (type === 'folder') {
      const { ops } = await createAsync.call(files, filePayload);
      const file = ops[0];
      file.id = file._id;
      file._id = undefined;

      return res.status(201).json(file);
    }

    const localPath = await fileUtils.store(data);
    const { ops } = await createAsync.call(files, {
      ...filePayload,
      localPath,
    });

    const file = ops[0];
    file.id = file._id;
    file._id = undefined;

    return res.status(201).json(file);
  }

  static async getShow(req, res) {
    const { id } = req.params;

    const files = db.client.collection('files');
    const findAsync = promisify(files.findOne);

    const file = await findAsync.call(files, {
      _id: mongodb.ObjectId(id),
      userId: mongodb.ObjectId(req.user._id),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.id = id;
    file._id = undefined;

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const { parentId, page = 0 } = req.query;
    const perPage = 20;

    const files = db.client.collection('files');

    const matchQuery = {
      $match: {
        userId: mongodb.ObjectId(req.user._id),
      },
    };

    if (parentId) {
      matchQuery.$match.parentId = parentId === '0' ? 0 : mongodb.ObjectId(parentId);
    }

    const cursor = await files.aggregate([
      matchQuery,
      { $skip: Number(page) * perPage },
      { $limit: perPage },
    ]);

    const toArray = promisify(cursor.toArray);
    const results = await toArray.call(cursor);

    const formattedResult = results.map((r) => {
      const { _id, ...data } = r;
      return { ...data, id: _id };
    });

    return res.status(200).json(formattedResult);
  }

  static async putPublish(req, res) {
    const { id } = req.params;

    const files = db.client.collection('files');
    const findAsync = promisify(files.findOne);
    const updateAsync = promisify(files.updateOne);

    const file = await findAsync.call(files, {
      _id: mongodb.ObjectId(id),
      userId: mongodb.ObjectId(req.user._id),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await updateAsync.call(
      files,
      { _id: mongodb.ObjectId(id) },
      { $set: { isPublic: true } },
    );

    file.isPublic = true;

    return res.status(200).json(file);
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;

    const files = db.client.collection('files');
    const findAsync = promisify(files.findOne);
    const updateAsync = promisify(files.updateOne);

    const file = await findAsync.call(files, {
      _id: mongodb.ObjectId(id),
      userId: mongodb.ObjectId(req.user._id),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await updateAsync.call(
      files,
      { _id: mongodb.ObjectId(id) },
      { $set: { isPublic: false } },
    );

    file.isPublic = false;

    return res.status(200).json(file);
  }

  static async getFile(req, res) {
    const { id } = req.params;

    const files = db.client.collection('files');
    const findAsync = promisify(files.findOne);

    const file = await findAsync.call(files, {
      _id: mongodb.ObjectId(id),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (
      !file.isPublic
      && req.user
      && req.user._id.toString() !== file.userId.toString()
    ) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const fileExists = await checkFile(file.localPath);

    if (!fileExists) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);

    res.setHeader('Content-Type', mimeType);

    const readStream = fs.createReadStream(file.localPath, {
      encoding: 'utf-8',
    });

    return readStream.pipe(res);
  }
}
