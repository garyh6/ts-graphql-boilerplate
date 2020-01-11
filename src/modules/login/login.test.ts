import * as faker from "faker";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTestConn } from "../../testSetup/createTestConn";
import { TestClient } from "../../utils/TestClient";
import { confirmEmailError, invalidLogin } from "./errorMessage";

faker.seed(faker.random.number());
const email = faker.internet.email();
const password = faker.internet.password();

let conn: Connection;
beforeAll(async () => {
  conn = await createTestConn();
});

afterAll(async () => {
  conn.close();
});

const loginExpectError = async (
  client: TestClient,
  e: string,
  p: string,
  errMsg: string
) => {
  const response = await client.login(e, p);

  expect(response.data).toEqual({
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
    const client = new TestClient("");
    await loginExpectError(
      client,
      "notInDB@test.com",
      "failLogin",
      invalidLogin
    );
  });

  test("email not confirmed", async () => {
    // Register a user
    const client = new TestClient("");
    await client.register(email, password);

    // Not confirmed
    await loginExpectError(client, email, password, confirmEmailError);
    // Update user to confirmed
    await User.update({ email }, { confirmed: true });
  });

  test("bad password login", async () => {
    // Bad password
    const client = new TestClient("");
    await loginExpectError(client, email, "invalidPassword", invalidLogin);
  });

  test("successful login", async () => {
    // Successful login
    const client = new TestClient("");
    const response = await client.login(email, password);
    expect(response.data).toEqual({ login: null });
  });
});
