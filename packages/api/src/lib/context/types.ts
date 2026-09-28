import { type AuthSession } from "@tans/auth/index";
import { type RequestLogger } from "@tans/logger/server";

export type OrpcContext = {
  session: AuthSession | null;
  logger: RequestLogger;
};
