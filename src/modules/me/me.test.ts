import axios from "axios";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTypeormConn } from "../../utils/createTypeormConn";

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

const loginMutation = (e: string, p: string) => `
mutation {
    login(email: "${e}", password:"${p}") {
      path
      message
    }
}`;

const meQuery = `
{
  me {
    id
    email
  }
}`;

describe("me", () => {
  // test("can't get user if not logged in", async () => {});

  test("get current user", async () => {
    axios.defaults.withCredentials = true;
    await axios.post(process.env.TEST_HOST as string, {
      query: loginMutation(email, password)
    });

    console.log("************ process.env.TEST_HOST", process.env.TEST_HOST);

    const res = await axios.post(process.env.TEST_HOST as string, {
      query: meQuery
    });

    // console.log("************ res", res);
    // console.log("************ meQuery", meQuery);
    console.log("************ res.data.data", res.data.data);

    expect(res.data.data).toEqual({
      me: {
        id: userId,
        email
      }
    });
  });
});
