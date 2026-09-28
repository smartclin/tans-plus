import { ENV_SERVER } from "@tans/env/server/env";
import { LOG_SERVICES, initLogger } from "@tans/logger/server";

initLogger({
  env: {
    environment: ENV_SERVER.NODE_ENV,
    service: LOG_SERVICES.SERVER,
    version: ENV_SERVER.SOURCE_COMMIT
  }
});
