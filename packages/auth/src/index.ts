import { join } from "node:path/posix";

import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import "@tanstack/react-start/server-only";
import { APIError, betterAuth, generateId } from "better-auth";
import {
  admin,
  customSession,
  magicLink,
  openAPI,
  organization,
  testUtils,
  twoFactor
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db, eq } from "@tans/db";
import * as schema from "@tans/db/schema";
import { ENV_SERVER } from "@tans/env/server/env";

import { CACHE_CONFIG, EMAIL_REGEX, roleCache, sendPasswordResetEmail } from "#@/_helper";
import { ac, roles } from "#@/roles";

export const auth = betterAuth({
  baseURL: new URL(ENV_SERVER.VITE_SERVER_URL).origin,
  basePath: join(new URL(ENV_SERVER.VITE_SERVER_URL).pathname, "auth"),
  trustedOrigins: [new URL(ENV_SERVER.VITE_WEB_URL).origin],
  secret: ENV_SERVER.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema
  }),
  rateLimit: {
    storage: "database",
    modelName: "rateLimit"
  },
  // https://www.better-auth.com/docs/concepts/session-management#session-caching
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true
    }
  },
  advanced: {
    database: {
      joins: true,
      generateId: () => generateId(),
      defaultFindManyLimit: 50
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "auth",
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" ? ".clinic.com" : "localhost"
    }
  },
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "info",
    disabled: false
  },

  user: {
    additionalFields: {
      role: {
        type: ["doctor", "staff", "patient", "admin"],
        required: false,
        input: false
      },
      clinicId: {
        type: "string",
        required: false,
        input: false
      },
      apiKey: { type: "string", required: false, input: false },
      address: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true }
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const result = await db
          .select({ role: schema.user.role })
          .from(schema.user)
          .where(eq(schema.user.id, user.id))
          .limit(1);
        const [fullUser] = result;

        if (fullUser?.role?.toLowerCase() === "doctor") {
          const patientCount = await db
            .select({ count: schema.patients.id })
            .from(schema.patients)
            .where(eq(schema.patients.userId, user.id))
            .limit(1);

          if (patientCount.length > 0) {
            throw new APIError("BAD_REQUEST", {
              message: "Doctor has active patients and cannot be deleted"
            });
          }
        }
      }
    },
    changeEmail: {
      enabled: true
    }
  },
  updateUser: {
    enabled: true
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email?.trim().toLowerCase();
          if (!(email && EMAIL_REGEX.test(email))) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid email format"
            });
          }
          return {
            data: {
              ...user,
              email,
              name: user.name?.trim() || "Unnamed User",
              role: "patient",
              isAdmin: false
            }
          };
        }
      }
    }
  },
  // https://www.better-auth.com/docs/authentication/email-password
  socialProviders: {
    ...(ENV_SERVER.GITHUB_CLIENT_ID && ENV_SERVER.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: ENV_SERVER.GITHUB_CLIENT_ID,
            clientSecret: ENV_SERVER.GITHUB_CLIENT_SECRET
          }
        }
      : {}),
    ...(ENV_SERVER.GOOGLE_CLIENT_ID && ENV_SERVER.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: ENV_SERVER.GOOGLE_CLIENT_ID,
            clientSecret: ENV_SERVER.GOOGLE_CLIENT_SECRET
          }
        }
      : {})
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPassword: {
      enabled: true,
      expiresIn: 60 * 60
    }
  },
  email: {
    from: "Pediatric Care <noreply@pediatriccare.com>",
    sendResetPassword: async ({ email, url }: { email: string; url: string; _token: string }) => {
      await sendPasswordResetEmail(email, url);
    }
  },

  plugins: [
    admin({
      ac,
      roles,
      adminRoles: ["admin"]
    }),
    openAPI({
      theme: "deepSpace"
    }),
    twoFactor(),

    customSession(async ({ user, session }) => {
      const cacheKey = `user_role_${user.id}`;
      const cached = roleCache.get(cacheKey);

      let dbUser: { role: schema.Role | null; clinicId: string | null } | undefined;

      if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.ROLE_TTL) {
        // Serve from cache efficiently without running DB queries
        dbUser = { role: cached.role, clinicId: cached.clinicId };
      } else {
        const result = await db
          .select({ role: schema.user.role, clinicId: schema.user.clinicId })
          .from(schema.user)
          .where(eq(schema.user.id, user.id))
          .limit(1);

        [dbUser] = result;

        if (dbUser) {
          roleCache.set(cacheKey, {
            role: dbUser.role ?? "doctor",
            timestamp: Date.now(),
            clinicId: dbUser.clinicId ?? null
          });
        }
      }

      const role = dbUser?.role ?? "patient";

      return {
        user: {
          ...user,
          role,
          clinicId: dbUser?.clinicId ?? null
        },
        session
      };
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.debug(`\n[Magic Link] ${email}\n→ ${url}\n`);
      }
    }),
    organization({
      ac,
      roles,
      dynamicAccessControl: {
        enabled: true
      }
    }),
    tanstackStartCookies(),
    ...(process.env.NODE_ENV === "test" ? [testUtils()] : [])
  ],

  telemetry: {
    enabled: false
  }
});

type OpenApiEndpoints = ReturnType<typeof openAPI>["endpoints"];

// Better Auth exposes this endpoint at runtime, but currently omits it from the
// inferred `auth.api` type: https://github.com/better-auth/better-auth/issues/8688
export const generateAuthOpenApiSchema = (
  auth.api as typeof auth.api & Pick<OpenApiEndpoints, "generateOpenAPISchema">
).generateOpenAPISchema;

export type AuthSession = typeof auth.$Infer.Session;
