import { Redis } from "ioredis";

export type Resolver = (
  parent: any,
  args: any,
  context: Context,
  info: any
) => any;

export type GraphQLMiddlewareFunc = (
  resolver: Resolver,
  parent: any,
  args: any,
  context: Context,
  info: any
) => any;

export interface Context {
  redis: Redis;
  url: string;
  session: Session;
  req: Express.Request;
}

export interface ResolverMap {
  [key: string]: {
    [key: string]: Resolver;
  };
}

export interface AddressInfo {
  address: string;
  family: string;

  port: number;
}

export interface Session extends Express.Session {
  userId?: string;
}
