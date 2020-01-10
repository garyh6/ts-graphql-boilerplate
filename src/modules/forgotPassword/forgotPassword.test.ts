import * as Redis from "ioredis";
import { Connection } from "typeorm";
import { User } from "../../entity/User";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { createTypeormConn } from "../../utils/createTypeormConn";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import { TestClient } from "../../utils/TestClient";
import { forgotPasswordLockedError } from "../login/errorMessage";
import { passwordNotLongEnough } from "../register/errorMessage";
import { expiredKeyError } from "./errorMessage";
let conn: Connection;
const redis = new Redis();
const email = "gary@gary.com";
const password = "dfadsfas";
const newPassword = "zxcvzxcvz";
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

describe("forgot password", () => {
  test("use link to reset password", async () => {
    const client = new TestClient("");

    // lock account and logout all sessions
    await forgotPasswordLockAccount(userId, redis);

    const url = await createForgotPasswordLink("", userId, redis);
    const parts = url.split("/");
    const key = parts[parts.length - 1];

    // cannot login because account is locked
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [
          {
            path: "email",
            message: forgotPasswordLockedError
          }
        ]
      }
    });

    // new password is too short error
    expect(await client.forgotPasswordChange("as", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "newPassword",
            message: passwordNotLongEnough
          }
        ]
      }
    });

    // successfully changed to new password
    const res = await client.forgotPasswordChange(newPassword, key);
    expect(res.data).toEqual({
      forgotPasswordChange: null
    });

    // expire the redis key after change password
    expect(await client.forgotPasswordChange("qwerqewrqwer", key)).toEqual({
      data: {
        forgotPasswordChange: [
          {
            path: "key",
            message: expiredKeyError
          }
        ]
      }
    });

    // successfully logged in
    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null
      }
    });

    expect(await client.me()).toEqual({
      data: {
        me: {
          id: userId,
          email
        }
      }
    });
  });
});
