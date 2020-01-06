import { Redis } from "ioredis";

export type Resolver = (
  parent: any,
  args: any,
  context: { redis: Redis; url: string; session: Session },
  info: any
) => any;

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

export interface Session {
  userId?: string;
}

export type GraphQLMiddlewareFunc = (
  resolver: Resolver,
  parent: any,
  args: any,
  context: { redis: Redis; url: string; session: Session },
  info: any
) => any;
