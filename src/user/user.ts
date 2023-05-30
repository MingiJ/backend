import express from "express";
import { CustomError } from "../utils/CustomError";
import * as yup from "yup";
import { getDbClient } from "../utils/getDbClient";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
const router = express.Router();

export const JWT_SECRET = "-10293-019FKJAKLDJFAIWEU09328904";

router.post("/sign-up", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      email: yup.string().email().required(),
      username: yup.string().required().min(4),
      password: yup.string().required().min(6),
    });
    await schema.validate(req.body, { abortEarly: false });
    const userDetails = req.body as yup.InferType<typeof schema>;

    const db = await getDbClient();

    const user = await db.collection("users").findOne({
      email: userDetails.email,
    });
    if (user) {
      throw new CustomError("User already exists");
    }

    await db.collection("users").insertOne({
      ...userDetails,
      password: await hash(userDetails.password, 10),
    });
    return res.status(200).json({
      token: sign({ email: userDetails.email }, JWT_SECRET),
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

router.post("/log-in", express.json(), async (req, res) => {
  try {
    const schema = yup.object({
      email: yup.string().email().required(),
      password: yup.string().required().min(6),
    });
    await schema.validate(req.body, { abortEarly: false });
    const { email, password: plainTextPassword } = req.body as yup.InferType<
      typeof schema
    >;
    const db = await getDbClient();
    const user = await db.collection("users").findOne({
      email,
    });
    if (!user) {
      throw new CustomError("User not found!");
    }
    const isPasswordValid: boolean = await compare(
      plainTextPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new CustomError("User not found!");
    }

    return res.status(200).json({
      token: sign({ email }, JWT_SECRET),
    });
  } catch (error: any) {
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else if (error instanceof yup.ValidationError) {
      return res.status(400).send(error.errors);
    }
    return res.status(500).send("Internal Error");
  }
});

router.get("/users", async (req, res) => {
  try {
    const db = await getDbClient();
    const usersArray = await db.collection("users").find();
    return res.status(200).json({
      users: (await usersArray.toArray()).map((i) => {
        delete i.password;
        return i;
      }),
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
