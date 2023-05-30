import express from "express";
import { CustomError } from "../utils/CustomError";
import * as yup from "yup";
import { getDbClient } from "../utils/getDbClient";
import { decodeUserToken } from "../utils/decodeUserToken";
const router = express.Router();

export const JWT_SECRET = "-10293-019FKJAKLDJFAIWEU09328904";

router.post("/create", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      name: yup.string().required(),
      id: yup.string().required().min(4),
      members: yup.array().of(yup.string()),
      owner: yup.string().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    const groupDetails = req.body as yup.InferType<typeof schema>;

    const db = await getDbClient();

    await db.collection("groups").insertOne({
      ...groupDetails,
      owner: decodeUserToken(groupDetails.owner),
    });

    return res.status(200).send();
  } catch (error: any) {
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors.join(";"));
    }
    return res.status(500).send("Internal Error");
  }
});

router.post("/get", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      token: yup.string().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    const { token } = req.body as yup.InferType<typeof schema>;
    const email = decodeUserToken(token);
    const db = await getDbClient();

    const _groups = await db.collection("groups").find({
      $or: [{ owner: email }, { members: email }],
    });

    return res.status(200).json({
      groups: await _groups.toArray(),
    });
  } catch (error: any) {
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors.join(";"));
    }
    return res.status(500).send("Internal Error");
  }
});

export default router;
