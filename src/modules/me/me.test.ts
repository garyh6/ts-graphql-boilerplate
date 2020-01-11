import * as faker from "faker";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTestConn } from "../../testSetup/createTestConn";
import { TestClient } from "../../utils/TestClient";
let conn: Connection;
faker.seed(faker.random.number());
const email = faker.internet.email();
const password = faker.internet.password();
let userId: string;
beforeAll(async () => {
  conn = await createTestConn();
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  conn.close();
});

describe("me", () => {
  test("return null if no cookie", async () => {
    const client = new TestClient("");
    const res = await client.me();
    expect(res.data.me).toEqual(null);
  });

  test("get current user", async () => {
    const client = new TestClient("");
    await client.login(email, password);

    const response = await client.me();
    expect(response.data).toEqual({
      me: {
        id: userId,
        email
      }
    });
  });
});
