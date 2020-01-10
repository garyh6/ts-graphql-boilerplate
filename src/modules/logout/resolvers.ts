import { ResolverMap } from "../../types/graphql-utils";
import { removeAllUserSessions } from "../../utils/removeAllUserSessions";

export const resolvers: ResolverMap = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: (_, __, { session }) =>
      new Promise(res =>
        session.destroy(err => {
          if (err) {
            console.log("************ err", err);
          }
          res(true);
        })
      ),
    logoutAll: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (userId) {
        removeAllUserSessions(userId, redis);
        return true;
      }

      return false;
    }
  }
};
