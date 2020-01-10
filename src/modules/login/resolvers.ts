import * as bcrypt from "bcryptjs";
import { userSessionIdPrefix } from "../../constants";
import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import {
  confirmEmailError,
  forgotPasswordLockedError,
  invalidLogin
} from "./errorMessage";

const errorResponse = [
  {
    path: "email",
    message: invalidLogin
  }
];

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => `Graphql-tools doesnt like it when you dont have a Query`
  },
  Mutation: {
    login: async (
      _,
      { email, password }: GQL.ILoginOnMutationArguments,
      { session, redis, req }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return errorResponse;
      }

      if (!user.confirmed) {
        return [
          {
            path: "email",
            message: confirmEmailError
          }
        ];
      }

      if (user.forgotPasswordLocked) {
        return [
          {
            path: "email",
            message: forgotPasswordLockedError
          }
        ];
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return errorResponse;
      }

      // create cookie for successful user
      // express session looks for changes in session object
      // then creats cookie and stores the data
      session.userId = user.id;
      if (req.sessionID) {
        await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
      }

      // await redis.get(`${redisSessionPrefix}${req.sessionID}`);

      return null;
    }
  }
};
