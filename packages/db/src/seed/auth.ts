// src/db/seeds/seed-auth.ts
import { faker } from "@faker-js/faker";

import { member, organization, user, userAdmin } from "#@/schema/auth";
import { seedDb, seedLogger } from "#@/seed/helper";

export async function seedAuth() {
  const logger = seedLogger("seed_auth");

  const [hospitalOrg] = await seedDb
    .insert(organization)
    .values({
      id: faker.string.uuid(),
      name: "Sunrise Pediatric Hospital",
      slug: "sunrise-pediatric",
      createdAt: new Date(),
      metadata: JSON.stringify({ timezone: "UTC", currency: "USD" })
    })
    .returning();

  const [adminUser] = await seedDb
    .insert(user)
    .values({
      id: faker.string.uuid(),
      name: "System Administrator",
      email: "admin@sunrise-pediatrics.test",
      passwordHash: "$2b$10$placeholderHashForSeeding",
      phone: "+1-555-0100",
      status: "active",
      emailVerified: true,
      role: "admin",
      lastLoginAt: new Date()
    })
    .returning();

  await seedDb.insert(userAdmin).values({
    userId: adminUser.id,
    role: "admin",
    banned: false
  });

  await seedDb.insert(member).values({
    id: faker.string.uuid(),
    organizationId: hospitalOrg.id,
    userId: adminUser.id,
    role: "owner",
    createdAt: new Date()
  });

  const users = await seedDb
    .insert(user)
    .values(
      Array.from({ length: 20 }, () => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return {
          id: faker.string.uuid(),
          name: `${firstName} ${lastName}`,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          passwordHash: "$2b$10$placeholderHashForSeeding",
          phone: faker.phone.number({ style: "national" }),
          status: "active" as const,
          emailVerified: true,
          role: "staff" as const,
          lastLoginAt: faker.date.recent({ days: 30 })
        };
      })
    )
    .returning();

  await seedDb.insert(member).values(
    users.map((u) => {
      return {
        id: faker.string.uuid(),
        organizationId: hospitalOrg.id,
        userId: u.id,
        role: "member",
        createdAt: new Date()
      };
    })
  );

  logger.set({
    event: "seed_auth_ok",
    counts: { users: users.length + 1, organizations: 1, members: users.length + 1 }
  });
  logger.emit();

  return { adminUser, users, hospitalOrg };
}
