import { IResolvers } from "graphql-tools";
import {
  AuthenticateResponse,
  MutationRegistersArgs,
  QueryLoginArgs,
} from "../generated";

export const UserResolvers: IResolvers = {
  Query: {
    async login(_: void, args: QueryLoginArgs): Promise<AuthenticateResponse> {
      return {
        token: "toto",
      };
    },
  },
  Mutation: {
    async registers(
      _: void,
      args: MutationRegistersArgs
    ): Promise<AuthenticateResponse> {
      return {
        token: "toto",
      };
    },
  },
};
