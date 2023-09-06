import db from "../utils/db";
import { promisify } from "util";
import sha1 from "sha1";

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    const users = db.client.collection("users");
    const findAsync = promisify(users.findOne);

    const existingUser = await findAsync.call(users, { email });
    if (existingUser) {
      return res.status(400).json({ error: "Already exist" });
    }

    const hashedPassword = sha1(password);
    const createAsync = promisify(users.insert);

    const { ops } = await createAsync.call(users, {
      email,
      password: hashedPassword,
    });

    const user = ops[0];

    res.status(200).json({
      id: user._id,
      email,
    });
  }
}
