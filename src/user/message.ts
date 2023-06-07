import express from "express";
import { CustomError } from "../utils/CustomError";
import * as yup from "yup";
import { getDbClient } from "../utils/getDbClient";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { decodeUserToken } from "../utils/decodeUserToken";
const router = express.Router();

router.post("/chats", express.json(), async (req, res) => {
  try {
    const db = await getDbClient();

    const { token, email: email1 } = req.body;
    const email2 = decodeUserToken(token);
    const _chats = await db.collection("messages").find({
      $or: [
        {
          from: email1,
          to: email2,
        },
        {
          from: email2,
          to: email1,
        },
      ],
    });
    return res.status(200).json({
      chats: await _chats.toArray(),
    });
  } catch (error: any) {
    console.error(error);
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors);
    }
    return res.status(500).send("Internal Error");
  }
});

router.post("/group-chats", express.json(), async (req, res) => {
  try {
    const db = await getDbClient();

    const { to } = req.body;
    const _chats = await db.collection("messages").find({
      to,
    });
    return res.status(200).json({
      chats: await _chats.toArray(),
    });
  } catch (error: any) {
    console.error(error);
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors);
    }
    return res.status(500).send("Internal Error");
  }
});

router.post("/all-chats", express.json(), async (req, res) => {
  try {
    const db = await getDbClient();

    const { email } = req.body;
    const _chats = await db.collection("messages").find({
      from: email,
    });
    return res.status(200).json({
      chats: (await _chats.toArray()).map((f) => f.content),
    });
  } catch (error: any) {
    console.error(error);
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors);
    }
    return res.status(500).send("Internal Error");
  }
});

export default router;
