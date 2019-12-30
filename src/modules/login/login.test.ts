import { request } from "graphql-request";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTypeormConn } from "../../utils/createTypeormConn";
import { confirmEmailError, invalidLogin } from "./errorMessage";

const email = "gary1@test.com";
const password = "test";

const registerMutation = (e: string, p: string) => `
mutation {
    register(email: "${e}", password:"${p}") {
      path
      message
    }
}`;

const loginMutation = (e: string, p: string) => `
mutation {
    login(email: "${e}", password:"${p}") {
      path
      message
    }
}`;

let conn: Connection;
beforeAll(async () => {
  conn = await createTypeormConn();
});

afterAll(async () => {
  conn.close();
});

const loginExpectError = async (e: string, p: string, errMsg: string) => {
  const response = await request(
    process.env.TEST_HOST as string,
    loginMutation(e, p)
  );
  expect(response).toEqual({
    login: [
      {
        path: "email",
        message: errMsg
      }
    ]
  });
};

describe("Login", () => {
  test("email not found", async () => {
    // Login with unregistered email
    await loginExpectError("notInDB@test.com", "failLogin", invalidLogin);
  });

  test("email not confirmed", async () => {
    // Register a user
    await request(
      process.env.TEST_HOST as string,
      registerMutation(email, password)
    );

    // Not confirmed
    await loginExpectError(email, password, confirmEmailError);
    // Update user to confirmed
    await User.update({ email }, { confirmed: true });
  });

  test("bad password login", async () => {
    // Bad password
    await loginExpectError(email, "invalidPassword", invalidLogin);
  });

  test("successful login", async () => {
    // Successful login
    const response = await request(
      process.env.TEST_HOST as string,
      loginMutation(email, password)
    );
    expect(response).toEqual({ login: null });
  });
});
