import { promisify } from 'util';
import mongodb from 'mongodb';
import db from '../utils/db';
import fileUtils from '../utils/files';

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
      parentId,
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
}
