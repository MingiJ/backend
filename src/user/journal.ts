import express from "express";
import { CustomError } from "../utils/CustomError";
import * as yup from "yup";
import { getDbClient } from "../utils/getDbClient";
import { decodeUserToken } from "../utils/decodeUserToken";
import { Filter, ObjectId } from "mongodb";
const router = express.Router();

export const JWT_SECRET = "-10293-019FKJAKLDJFAIWEU09328904";

router.post("/create", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      title: yup.string().required(),
      body: yup.string().required().min(4),
      owner: yup.string().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    const journalDetails = req.body as yup.InferType<typeof schema>;

    const db = await getDbClient();

    await db.collection("journal").insertOne({
      ...journalDetails,
      timestamp: Date.now(),
      owner: decodeUserToken(journalDetails.owner),
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

router.post("/update", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      _id: yup.string().required(),
      title: yup.string().required(),
      body: yup.string().required().min(4),
      owner: yup.string().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    const { _id, title, body } = req.body as yup.InferType<typeof schema>;

    const db = await getDbClient();

    const update = await db.collection("journal").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: { title, body },
      }
    );

    return res.status(200).send();
  } catch (error: any) {
    console.error(error);
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
      owner: yup.string().required(),
    });
    await schema.validate(req.body, { abortEarly: false });
    const { owner } = req.body as yup.InferType<typeof schema>;
    const email = decodeUserToken(owner);
    const db = await getDbClient();

    const _journals = await db
      .collection("journal")
      .find({ owner: email } as Filter<any>);

    return res.status(200).json({
      journals: await _journals.toArray(),
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
