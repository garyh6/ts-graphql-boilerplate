import * as bcrypt from "bcryptjs";
import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import { confirmEmailError, invalidLogin } from "./errorMessage";

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
      { session }
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

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return errorResponse;
      }

      // create cookie for successful user
      // express session looks for changes in session object
      // then creats cookie and stores the data
      session.userId = user.id;

      return null;
    }
  }
};
