import { User } from "../../entity/User";
import { ResolverMap } from "../../types/graphql-utils";
import { createMiddleware } from "../../utils/createMiddleware";
import middleware from "./middleware";

export const resolvers: ResolverMap = {
  Query: {
    me: createMiddleware(middleware, (_, __, { session }) => {
      // console.log("************** session", session);
      // console.log("************** session", session.userId);
      User.findOne({ where: { id: session.userId } });
    })
  }
};
