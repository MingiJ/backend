import { verify } from "jsonwebtoken";
import { CustomError } from "./CustomError";
import { JWT_SECRET } from "../user/user";

export const decodeUserToken = (token: string) => {
  const payload = verify(token, JWT_SECRET);
  if (typeof payload !== "object" || typeof payload.email !== "string")
    throw new CustomError("Invalid token");
  return payload.email;
};
