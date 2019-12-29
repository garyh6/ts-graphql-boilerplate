import { request } from "graphql-request";
import { User } from "../../entity/User";
import { startServer } from "../../startServer";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "./errorMessage";

let getHost = () => "";
interface AddressInfo {
  address: string;
  family: string;
  port: number;
}
beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address() as AddressInfo;
  getHost = () => `http://127.0.0.1:${port}`;
});

const email = "gary1@test.com";
const password = "test";

const mutation = (e: string, p: string) => `
mutation {
    register(email: "${e}", password:"${p}") {
      path
      message
    }
}`;

describe("Register user", () => {
  test("check for duplicate emails", async () => {
    // Register a user
    const response = await request(getHost(), mutation(email, password));
    expect(response).toEqual({ register: null });

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    // sign up again - catch duplicate emails
    const response2 = await request(getHost(), mutation(email, password));
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  test("check bad email", async () => {
    const response3 = await request(getHost(), mutation("xx", password));
    expect(response3).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        }
      ]
    });
  });

  test("check bad password", async () => {
    const response4 = await request(getHost(), mutation(email, "xx"));
    expect(response4).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });

  test("check bad email and bad password", async () => {
    const response5 = await request(getHost(), mutation("xx", "xx"));
    expect(response5).toEqual({
      register: [
        {
          path: "email",
          message: emailNotLongEnough
        },
        {
          path: "email",
          message: invalidEmail
        },
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });
});
