import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";

async function main() {
  try {
    console.log("Querying user: dennis_yin@gss.com.tw");
    
    const user = await db.user.findUnique({
      where: { email: "dennis_yin@gss.com.tw" },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                },
                applications: {
                  include: {
                    application: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("\n✅ User found:");
    console.log("ID:", user.id);
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Status:", user.status);
    console.log("Password set:", !!user.password);
    console.log("Email verified:", user.emailVerified);
    console.log("Created at:", user.createdAt);
    
    console.log("\n📋 Roles:");
    if (user.userRoles.length === 0) {
      console.log("  ❌ No roles assigned");
    } else {
      user.userRoles.forEach((ur) => {
        console.log(`  - ${ur.role.name}`);
      });
    }

    console.log("\n🔐 Permissions:");
    const permissions = user.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission));
    if (permissions.length === 0) {
      console.log("  ❌ No permissions");
    } else {
      permissions.forEach((p) => {
        console.log(`  - ${p.name}`);
      });
    }

    console.log("\n📱 Applications:");
    const applications = user.userRoles.flatMap(ur => ur.role.applications.map(ra => ra.application));
    if (applications.length === 0) {
      console.log("  ❌ No applications");
    } else {
      applications.forEach((a) => {
        console.log(`  - ${a.name} (${a.path})`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

