import { Resolver } from "../../types/graphql-utils";
// import { User } from "../../entity/User";

export default async (resolver: Resolver, parent: any, args: any, context: any, info: any) => {
  if (!context.session || !context.session.userId) {
    return null;
  }
  // console.log("args given: ", args);
  // console.log("************ resolver", resolver);

  // check if user is an admin
  // const user = await User.findOne({where: { id: context.session.userId}})
  // if (!user || user.admin) {
  //   return null
  // }

  // middleware

  const result = await resolver(parent, args, context, info);
  // console.log("************ context", context);
  // console.log("************ result: ", result);

  // afterware

  return result;
};
