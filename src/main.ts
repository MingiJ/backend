import express from "express";
import user from "./user/user";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Working!");
});
app.use("/user", user);

const PORT = 8080;
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
