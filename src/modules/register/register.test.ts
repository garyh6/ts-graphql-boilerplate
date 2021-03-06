import * as faker from "faker";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createTestConn } from "../../testSetup/createTestConn";
import { TestClient } from "../../utils/TestClient";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from "./errorMessage";

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

describe("Register user", () => {
  test("check for duplicate emails", async () => {
    // Register a user
    const client = new TestClient("");

    const response = await client.register(email, password);
    expect(response.data).toEqual({ register: null });

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual(email);
    expect(user.password).not.toEqual(password);

    // sign up again - catch duplicate emails
    const response2 = await client.register(email, password);
    expect(response2.data.register).toHaveLength(1);
    expect(response2.data.register[0]).toEqual({
      path: "email",
      message: duplicateEmail
    });
  });

  test("check bad email", async () => {
    const client = new TestClient("");
    const response3 = await client.register("xx", password);
    expect(response3.data).toEqual({
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
    const client = new TestClient("");
    const response4 = await client.register(email, "xx");
    expect(response4.data).toEqual({
      register: [
        {
          path: "password",
          message: passwordNotLongEnough
        }
      ]
    });
  });

  test("check bad email and bad password", async () => {
    const client = new TestClient("");
    const response5 = await client.register("xx", "xx");
    expect(response5.data).toEqual({
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
