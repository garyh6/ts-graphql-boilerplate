import * as bcrypt from "bcryptjs";
import * as yup from "yup";
import { forgotPasswordPrefix } from "../../constants";
import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import { createForgotPasswordLink } from "../../utils/createForgotPasswordLink";
import { forgotPasswordLockAccount } from "../../utils/forgotPasswordLockAccount";
import { formatYupError } from "../../utils/formatYupError";
import { registerPasswordValidation } from "../../yupSchema";
import { expiredKeyError, userNotFoundError } from "./errorMessage";

const schema = yup.object().shape({
  newPassword: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => `Graphql-tools doesnt like it when you dont have a Query`
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: "email",
            message: userNotFoundError
          }
        ];
      }
      // TODO might not want to lock account (anyone can lock any account if they know the email)
      await forgotPasswordLockAccount(user.id, redis);
      // TODO update frontend url
      await createForgotPasswordLink("", user.id, redis);
      // TODO send email with url
      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;

      // validate key is good
      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: expiredKeyError
          }
        ];
      }

      // validate password is good
      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      // update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePromise = User.update(
        { id: userId },
        {
          forgotPasswordLocked: false,
          password: hashedPassword
        }
      );

      // expire/delete the key
      const deleteKeyPromise = redis.del(redisKey);

      await Promise.all([updatePromise, deleteKeyPromise]);

      return;
    }
  }
};
