import * as Redis from "ioredis";
import fetch from "node-fetch";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTypeormConn } from "../../utils/createTypeormConn";
import { createConfirmEmailLink } from "./createConfirmEmailLink";

let userId = "";
const redis = new Redis();
let conn: Connection;

beforeAll(async () => {
  conn = await createTypeormConn();
  const user = await User.create({
    email: "gary@gary.com",
    password: "dfadsfas"
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

test("Verify createConfirmEmailLink works", async () => {
  const url = await createConfirmEmailLink(
    process.env.TEST_HOST as string,
    userId,
    redis
  );

  const response = await fetch(url);
  const text = await response.text();
  expect(text).toEqual("ok");
  const user = await User.findOne({ where: { id: userId } });
  expect((user as User).confirmed).toBeTruthy();
  const chunks = url.split("/");
  const key = chunks[chunks.length - 1];
  const value = await redis.get(key);
  expect(value).toBeNull();
});
