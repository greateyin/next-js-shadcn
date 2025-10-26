import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";

async function main() {
  try {
    console.log("Assigning role to user: dennis_yin@gss.com.tw");
    
    // Get user
    const user = await db.user.findUnique({
      where: { email: "dennis_yin@gss.com.tw" }
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", user.email);

    // Get admin role
    const adminRole = await db.role.findUnique({
      where: { name: "admin" }
    });

    if (!adminRole) {
      console.log("❌ Admin role not found");
      return;
    }

    console.log("✅ Admin role found");

    // Check if user already has this role
    const existingRole = await db.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id
        }
      }
    });

    if (existingRole) {
      console.log("⚠️  User already has admin role");
      return;
    }

    // Assign role
    const userRole = await db.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id
      }
    });

    console.log("✅ Role assigned successfully");
    console.log("User ID:", user.id);
    console.log("Role ID:", adminRole.id);

    // Also update user status to active
    await db.user.update({
      where: { id: user.id },
      data: {
        status: "active",
        emailVerified: new Date()
      }
    });

    console.log("✅ User status updated to active");
    console.log("✅ Email verified");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

