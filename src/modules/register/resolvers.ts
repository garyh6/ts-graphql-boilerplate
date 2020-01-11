import * as yup from "yup";
import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import { formatYupError } from "../../utils/formatYupError";
import { sendEmail } from "../../utils/sendEmail";
import {
  registerEmailValidation,
  registerPasswordValidation
} from "../../yupSchema";
import { createConfirmEmailLink } from "./createConfirmEmailLink";
import { duplicateEmail } from "./errorMessage";

const schema = yup.object().shape({
  email: registerEmailValidation,
  password: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    dummy: () => `Graphql-tools doesnt like it when you dont have a Query`
  },
  Mutation: {
    register: async (
      _,
      args: GQL.IRegisterOnMutationArguments,
      { redis, url }
    ) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }
      const { email, password } = args;
      const userAlreadyExists = await User.findOne({
        where: { email },
        select: ["id"]
      });
      if (userAlreadyExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      const user = User.create({
        email,
        password
      });

      await user.save();
      if (process.env.NODE_ENV !== "test") {
        sendEmail(email, await createConfirmEmailLink(url, user.id, redis));
      }
      return null;
    }
  }
};
