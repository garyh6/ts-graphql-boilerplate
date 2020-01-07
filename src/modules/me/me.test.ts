import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTypeormConn } from "../../utils/createTypeormConn";
import { TestClient } from "../../utils/TestClient";

let conn: Connection;
const email = "gary@gary.com";
const password = "dfadsfas";
let userId: string;
beforeAll(async () => {
  conn = await createTypeormConn();
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
    const client = new TestClient(process.env.TEST_HOST as string);
    const res = await client.me();
    expect(res.data.me).toEqual(null);
  });

  test("get current user", async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
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
