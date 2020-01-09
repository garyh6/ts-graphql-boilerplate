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

describe("logout", () => {
  test("multiple sessions", async () => {
    const sess1 = new TestClient("");
    const sess2 = new TestClient("");

    await sess1.login(email, password);
    await sess2.login(email, password);
    expect(await sess1.me()).toEqual(await sess2.me());

    await sess1.logoutAll();

    const res1 = await sess1.me();
    const res2 = await sess2.me();
    expect(res1.data.me).toBeNull();
    expect(res2.data.me).toBeNull();
  });
  test("one session", async () => {
    const client = new TestClient("");

    await client.login(email, password);

    const response = await client.me();

    expect(response.data).toEqual({
      me: {
        id: userId,
        email
      }
    });

    await client.logout();

    const response2 = await client.me();

    expect(response2.data.me).toBeNull();
  });
});
