import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/crypto'

/**
 * 初始化 Prisma Client
 */
const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  await prisma.$transaction(async (prisma) => {
    // === 1. 創建角色 ===
    console.log('Creating default roles...')
    await prisma.role.createMany({
      data: [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'user', description: 'Regular user with limited access' }
      ],
      skipDuplicates: true
    })

    const [adminRole, userRole] = await prisma.role.findMany()

    // === 2. 創建權限 ===
    console.log('Creating permissions...')
    const permissionsData = [
      { name: 'users:read', description: 'View users' },
      { name: 'users:create', description: 'Create users' },
      { name: 'users:update', description: 'Update users' },
      { name: 'users:delete', description: 'Delete users' },
      { name: 'roles:read', description: 'View roles' },
      { name: 'roles:create', description: 'Create roles' },
      { name: 'roles:update', description: 'Update roles' },
      { name: 'roles:delete', description: 'Delete roles' },
      { name: 'applications:read', description: 'View applications' },
      { name: 'applications:create', description: 'Create applications' },
      { name: 'applications:update', description: 'Update applications' },
      { name: 'applications:delete', description: 'Delete applications' },
      { name: 'menu:read', description: 'View menu items' },
      { name: 'menu:create', description: 'Create menu items' },
      { name: 'menu:update', description: 'Update menu items' },
      { name: 'menu:delete', description: 'Delete menu items' },
      { name: 'system:settings', description: 'Manage system settings' },
      { name: 'system:logs', description: 'View system logs' },
      { name: 'system:audit', description: 'View audit logs' },
      { name: 'admin:access', description: 'Access admin panel' },
      { name: 'admin:manage', description: 'Manage admin settings' }
    ]

    await prisma.permission.createMany({
      data: permissionsData,
      skipDuplicates: true
    })

    const permissions = await prisma.permission.findMany()

    // === 3. 設定角色權限 ===
    console.log('Assigning permissions to roles...')
    await prisma.rolePermission.createMany({
      data: permissions.map((perm) => ({
        roleId: adminRole.id,
        permissionId: perm.id
      })),
      skipDuplicates: true
    })

    const userViewPermission = permissions.find((p) => p.name === 'users:read')

    if (userViewPermission) {
      await prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId: userViewPermission.id
        }
      })
    }

    // === 4. 創建應用程式 ===
    console.log('Creating default applications...')
    await prisma.application.createMany({
      data: [
        { name: 'dashboard', displayName: 'Dashboard', description: 'Main dashboard application', path: 'dashboard', icon: 'LayoutDashboard', order: 1, isActive: true },
        { name: 'profile', displayName: 'User Profile', description: 'User profile management', path: 'profile', icon: 'User', order: 2, isActive: true },
        { name: 'admin', displayName: 'Admin Panel', description: 'Administrative Panel for managing the system', path: 'admin', icon: 'ShieldCheck', order: 0, isActive: true }
      ],
      skipDuplicates: true
    })

    const applications = await prisma.application.findMany()
    const dashboardApp = applications.find(app => app.name === 'dashboard')
    const adminApp = applications.find(app => app.name === 'admin')
    
    if (!dashboardApp || !adminApp) {
      throw new Error('Required applications not found after creation')
    }

    // === 5. 設定角色應用程式權限 ===
    console.log('Assigning applications to roles...')
    await prisma.roleApplication.createMany({
      data: applications.flatMap((app) => [
        { roleId: adminRole.id, applicationId: app.id },
        ...(app.name !== 'admin' ? [{ roleId: userRole.id, applicationId: app.id }] : [])
      ]),
      skipDuplicates: true
    })

    // === 6. 創建選單 ===
    console.log('Creating default menu items...')
    await prisma.menuItem.createMany({
      data: [
        { name: 'overview', displayName: 'Overview', path: '/dashboard', icon: 'LayoutDashboard', order: 1, isVisible: true, applicationId: dashboardApp.id },
        { name: 'admin', displayName: 'Admin Panel', path: '/admin', icon: 'ShieldCheck', order: 0, isVisible: true, applicationId: adminApp.id }
      ],
      skipDuplicates: true
    })

    // === 7. 創建預設使用者 ===
    console.log('Creating admin user...')
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: await hashPassword('Admin@123'),
        emailVerified: new Date(),
        status: 'active'
      }
    })

    console.log('Creating regular user...')
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        password: await hashPassword('User@123'),
        emailVerified: new Date(),
        status: 'active'
      }
    })

    // === 8. 設定使用者角色 ===
    console.log('Assigning roles to users...')
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: regularUser.id, roleId: userRole.id }
      ],
      skipDuplicates: true
    })

    // === 9. 創建登入方法記錄 ===
    console.log('Creating login methods...')
    await prisma.loginMethod.createMany({
      data: [
        { userId: adminUser.id, method: 'password' },
        { userId: regularUser.id, method: 'password' }
      ],
      skipDuplicates: true
    })
  })

  console.log('Database seed completed successfully!')
}

// 執行種子腳本
main()
  .catch((e) => {
    console.error('Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
