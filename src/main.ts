import express from "express";
import user, { JWT_SECRET } from "./user/user";
import message from "./user/message";
import cors from "cors";
import http from "http";
import { verify } from "jsonwebtoken";
import { decodeUserToken } from "./utils/decodeUserToken";
import { getDbClient } from "./utils/getDbClient";
import group from "./user/group";
import { addUserToGroupRoom } from "./utils/addUserToGroupRoom";

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
let n = 0;
io.on("connection", (socket: any) => {
  //auth
  const token = socket?.handshake?.query?.token;
  if (typeof token !== "string") {
    console.warn(`[${n++}]\tInvalid socket connection`);
    return;
  }
  const email = decodeUserToken(token);

  addUserToGroupRoom(email, socket);

  //join private room
  socket.join(email);

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
  socket.on("group_message", async (args: any) => {
    const { content, to, token } = args as any;
    const email = decodeUserToken(token);

    const db = await getDbClient();
    const user = await db.collection("users").findOne({ email });
    if (!user) return;
    await db.collection("messages").insertOne({
      content,
      from: email,
      to,
      username: user.username,
      timestamp: Date.now(),
    });

    io.to(to).emit("group_message", {
      content,
      from: email,
      to,
      timestamp: Date.now(),
      username: user.username,
    });
  });

  socket.on("private_message", async (args: any) => {
    const { content, to, token } = args as any;
    const email = decodeUserToken(token);

    const db = await getDbClient();
    await db.collection("messages").insertOne({
      content,
      from: email,
      to,
      timestamp: Date.now(),
    });

    io.to(to).emit("private_message", {
      content,
      from: email,
      timestamp: Date.now(),
    });
  });
});

// setInterval(() => {
//   io.to("j@j.com").emit("private_message", {
//     from: "haha@haha.com",
//     content: "Hello, " + n++,
//   });
// }, 2000);

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Working!");
});
app.use("/user", user);
app.use("/message", message);
app.use("/group", group);

const PORT = 8080;
server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
