import * as uuid from 'uuid';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const writeFile = promisify(fs.writeFile);

class FileUtils {
  constructor() {
    this.__path = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!fs.existsSync(this.__path)) {
      fs.mkdirSync(this.__path);
    }
  }

  async store(data) {
    const filename = uuid.v4();
    const filePath = path.resolve(this.__path, filename);
    await writeFile(filePath, data, { encoding: 'base64' });

    return filePath;
  }
}

const fileUtils = new FileUtils();
export default fileUtils;
