import * as connectRedis from "connect-redis";
import "dotenv/config";
import * as rateLimit from "express-rate-limit";
import * as session from "express-session";
import { GraphQLServer } from "graphql-yoga";
import * as RateLimitRedisStore from "rate-limit-redis";
import "reflect-metadata";
import { redisSessionPrefix } from "./constants";
import { redis } from "./redis";
import { confirmEmail } from "./routes/confirmEmail";
import { createTestConn } from "./testSetup/createTestConn";
import { createTypeormConn } from "./utils/createTypeormConn";
import { genSchema } from "./utils/generateSchema";

const SESSION_SECRET = "asdfasdf";
const RedisStore = connectRedis(session);
export const startServer = async () => {
  if (process.env.NODE_ENV === "test") {
    await redis.flushall();
    await createTestConn(true);
  } else {
    await createTypeormConn();
  }

  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({ request }) => ({
      redis,
      url: request.protocol + "://" + request.get("host"),
      session: request.session,
      req: request
    })
  });

  const limiter = rateLimit({
    store: new RateLimitRedisStore({
      client: redis
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  if (process.env.NODE_ENV === "test") {
    server.express.use(limiter);
  }

  // express-rate-limit
  // TODO limit on /create-account (maybe 5 per hours?)

  server.express.use(
    session({
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      name: "qid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    })
  );

  const cors = {
    credentials: true,
    origin:
      process.env.NODE_ENV === "test"
        ? "*"
        : (process.env.FRONTEND_HOST as string)
  };

  server.express.get("/confirm/:id", confirmEmail);

  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test" ? 0 : 4000
  });
  console.log("Server is running on localhost:4000");
  return app;
};
