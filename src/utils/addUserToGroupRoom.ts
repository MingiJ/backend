import { Socket } from "socket.io";
import { getDbClient } from "./getDbClient";

export const addUserToGroupRoom = async (email: string, socket: Socket) => {
  const db = await getDbClient();

  const _groups = await db.collection("groups").find({
    $or: [{ owner: email }, { members: email }],
  });

  for (const group of await _groups.toArray()) {
    socket.join(group.id);
  }
};
