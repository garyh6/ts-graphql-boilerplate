import { redisSessionPrefix, userSessionIdPrefix } from "../../constants";
import { ResolverMap } from "../../types/graphql-utils";

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
        const sessionIds = await redis.lrange(
          `${userSessionIdPrefix}${userId}`,
          0,
          -1
        );

        const promises = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < sessionIds.length; i++) {
          promises.push(redis.del(`${redisSessionPrefix}${sessionIds[i]}`));
        }

        await Promise.all(promises);
        return true;
      }

      return false;
    }
  }
};
