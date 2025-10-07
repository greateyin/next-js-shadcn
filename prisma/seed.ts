/**
 * @fileoverview Database Seed Script
 * @module prisma/seed
 * @description Initialize database with roles, permissions, applications, menu items, and test users
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/crypto'

/**
 * Initialize Prisma Client
 */
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  console.log('=' .repeat(50))

  await prisma.$transaction(async (prisma) => {
    // === 1. Create Roles ===
    console.log('\n📋 Step 1: Creating default roles...')
    await prisma.role.createMany({
      data: [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'user', description: 'Regular user with limited access' },
        { name: 'moderator', description: 'Moderator with limited admin access' }
      ],
      skipDuplicates: true
    })

    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })!
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } })!
    const moderatorRole = await prisma.role.findUnique({ where: { name: 'moderator' } })!
    
    console.log(`   ✅ Created roles: admin, user, moderator`)

    // === 2. Create Permissions ===
    console.log('\n🔐 Step 2: Creating permissions...')
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
    console.log(`   ✅ Created ${permissions.length} permissions`)

    // === 3. Assign Permissions to Roles ===
    console.log('\n🔗 Step 3: Assigning permissions to roles...')
    
    // Admin has all permissions
    await prisma.rolePermission.createMany({
      data: permissions.map((perm) => ({
        roleId: adminRole.id,
        permissionId: perm.id
      })),
      skipDuplicates: true
    })
    console.log(`   ✅ Admin: ${permissions.length} permissions`)

    // User has only basic read permissions
    const userPermissions = permissions.filter((p) => 
      p.name.includes(':read') && !p.name.includes('admin')
    )
    
    await prisma.rolePermission.createMany({
      data: userPermissions.map((perm) => ({
        roleId: userRole.id,
        permissionId: perm.id
      })),
      skipDuplicates: true
    })
    console.log(`   ✅ User: ${userPermissions.length} permissions`)
    
    // Moderator has some management permissions
    const moderatorPermissions = permissions.filter((p) => 
      p.name.includes('users:') || p.name.includes('menu:')
    )
    
    await prisma.rolePermission.createMany({
      data: moderatorPermissions.map((perm) => ({
        roleId: moderatorRole.id,
        permissionId: perm.id
      })),
      skipDuplicates: true
    })
    console.log(`   ✅ Moderator: ${moderatorPermissions.length} permissions`)

    // === 4. Create Applications ===
    console.log('\n📱 Step 4: Creating default applications...')
    await prisma.application.createMany({
      data: [
        { name: 'dashboard', displayName: 'Dashboard', description: 'Main dashboard application', path: '/dashboard', icon: 'LayoutDashboard', order: 1, isActive: true },
        { name: 'admin', displayName: 'Admin Panel', description: 'Administrative Panel for managing the system', path: '/admin', icon: 'ShieldCheck', order: 0, isActive: true }
      ],
      skipDuplicates: true
    })

    const dashboardApp = await prisma.application.findUnique({ where: { name: 'dashboard' } })!
    const adminApp = await prisma.application.findUnique({ where: { name: 'admin' } })!
    
    console.log(`   ✅ Created applications: dashboard, admin`)

    // === 5. Assign Applications to Roles ===
    console.log('\n🔗 Step 5: Assigning applications to roles...')
    await prisma.roleApplication.createMany({
      data: [
        // Admin can access all applications
        { roleId: adminRole.id, applicationId: dashboardApp.id },
        { roleId: adminRole.id, applicationId: adminApp.id },
        // User can only access dashboard
        { roleId: userRole.id, applicationId: dashboardApp.id },
        // Moderator can access dashboard
        { roleId: moderatorRole.id, applicationId: dashboardApp.id },
      ],
      skipDuplicates: true
    })
    console.log(`   ✅ Assigned applications to roles`)

    // === 6. Create Menu Items ===
    console.log('\n🗂️  Step 6: Creating menu items...')
    
    // Dashboard menu items
    const menuItemsData = [
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Main dashboard overview',
        path: '/dashboard',
        icon: 'LayoutDashboard',
        type: 'LINK',
        order: 0,
        isVisible: true,
        isDisabled: false,
        applicationId: dashboardApp.id,
      },
      {
        name: 'profile',
        displayName: 'Profile',
        description: 'View and edit your profile',
        path: '/dashboard/profile',
        icon: 'UserCircle',
        type: 'LINK',
        order: 1,
        isVisible: true,
        isDisabled: false,
        applicationId: dashboardApp.id,
      },
      {
        name: 'users',
        displayName: 'Users',
        description: 'Manage users (Admin only)',
        path: '/dashboard/users',
        icon: 'Users',
        type: 'LINK',
        order: 2,
        isVisible: true,
        isDisabled: false,
        applicationId: dashboardApp.id,
      },
      {
        name: 'settings',
        displayName: 'Settings',
        description: 'Application settings',
        path: '/dashboard/settings',
        icon: 'Settings',
        type: 'LINK',
        order: 3,
        isVisible: true,
        isDisabled: false,
        applicationId: dashboardApp.id,
      },
    ]
    
    // Create menu items
    for (const item of menuItemsData) {
      await prisma.menuItem.upsert({
        where: {
          applicationId_name: {
            applicationId: item.applicationId,
            name: item.name,
          },
        },
        update: {},
        create: item,
      })
    }
    
    console.log(`   ✅ Created ${menuItemsData.length} menu items`)
    
    // Get created menu items
    const dashboardMenuItem = await prisma.menuItem.findFirst({
      where: { name: 'dashboard', applicationId: dashboardApp.id }
    })!
    const profileMenuItem = await prisma.menuItem.findFirst({
      where: { name: 'profile', applicationId: dashboardApp.id }
    })!
    const usersMenuItem = await prisma.menuItem.findFirst({
      where: { name: 'users', applicationId: dashboardApp.id }
    })!
    const settingsMenuItem = await prisma.menuItem.findFirst({
      where: { name: 'settings', applicationId: dashboardApp.id }
    })!
    
    // === 7. Assign Menu Item Permissions ===
    console.log('\n🔐 Step 7: Assigning menu item permissions...')
    
    // Users menu is only visible to admin and moderator
    await prisma.menuItemRole.createMany({
      data: [
        {
          menuItemId: usersMenuItem.id,
          roleId: adminRole.id,
          canView: true,
          canAccess: true,
        },
        {
          menuItemId: usersMenuItem.id,
          roleId: moderatorRole.id,
          canView: true,
          canAccess: true,
        },
      ],
      skipDuplicates: true,
    })
    
    console.log(`   ✅ Users menu: restricted to admin & moderator`)
    console.log(`   ✅ Other menus: public (no restrictions)`)

    // === 8. Create Test Users ===
    console.log('\n👥 Step 8: Creating test users...')
    
    // Admin User
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
    console.log(`   ✅ Admin: admin@example.com (password: Admin@123)`)

    // Regular User
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
    console.log(`   ✅ User: user@example.com (password: User@123)`)
    
    // Moderator User
    const moderatorUser = await prisma.user.upsert({
      where: { email: 'moderator@example.com' },
      update: {},
      create: {
        email: 'moderator@example.com',
        name: 'Moderator User',
        password: await hashPassword('Moderator@123'),
        emailVerified: new Date(),
        status: 'active'
      }
    })
    console.log(`   ✅ Moderator: moderator@example.com (password: Moderator@123)`)
    
    // Test User (for testing purposes)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('Test@123'),
        emailVerified: new Date(),
        status: 'active'
      }
    })
    console.log(`   ✅ Test: test@example.com (password: Test@123)`)

    // === 9. Assign Roles to Users ===
    console.log('\n🔗 Step 9: Assigning roles to users...')
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: regularUser.id, roleId: userRole.id },
        { userId: moderatorUser.id, roleId: moderatorRole.id },
        { userId: testUser.id, roleId: userRole.id },
      ],
      skipDuplicates: true
    })
    console.log(`   ✅ Roles assigned to all users`)

    // === 10. Create Login Method Records ===
    console.log('\n🔑 Step 10: Creating login methods...')
    await prisma.loginMethod.createMany({
      data: [
        { userId: adminUser.id, method: 'credentials' },
        { userId: regularUser.id, method: 'credentials' },
        { userId: moderatorUser.id, method: 'credentials' },
        { userId: testUser.id, method: 'credentials' },
      ],
      skipDuplicates: true
    })
    console.log(`   ✅ Login methods created for all users`)
  })

  console.log('\n' + '='.repeat(50))
  console.log('✨ Database seed completed successfully!')
  console.log('\n📋 Test Accounts Summary:')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log('│ Email                    │ Password      │ Role │')
  console.log('├─────────────────────────────────────────────────┤')
  console.log('│ admin@example.com        │ Admin@123     │ Admin│')
  console.log('│ user@example.com         │ User@123      │ User │')
  console.log('│ moderator@example.com    │ Moderator@123 │ Mod  │')
  console.log('│ test@example.com         │ Test@123      │ User │')
  console.log('└─────────────────────────────────────────────────┘')
  console.log('\n📌 Menu Permissions:')
  console.log('   • Dashboard, Profile, Settings: All users')
  console.log('   • Users: Admin & Moderator only')
  console.log('')
}

// Execute seed script
main()
  .catch((e) => {
    console.error('Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
