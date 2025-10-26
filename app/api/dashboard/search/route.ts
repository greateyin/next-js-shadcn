/**
 * GET /api/dashboard/search?q=query
 * Search across dashboard items (menu items, users, roles, etc.)
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase().trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        query: query || ''
      })
    }

    // Get user's menu items (simplified query)
    const menuItems = await db.menuItem.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        displayName: true,
        description: true,
        path: true,
        icon: true,
        application: {
          select: {
            name: true
          }
        }
      },
      take: 5
    })

    // Get user's roles (simplified query)
    const roles = await db.role.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      take: 3
    })

    // Get user's applications (simplified query)
    const applications = await db.application.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          { isActive: true }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      take: 3
    })

    const results = [
      ...menuItems.map(item => ({
        type: 'menu',
        id: item.id,
        title: item.displayName,
        description: item.description,
        path: item.path,
        icon: item.icon,
        app: item.application.name
      })),
      ...roles.map(role => ({
        type: 'role',
        id: role.id,
        title: role.name,
        description: role.description,
        path: `/admin/roles/${role.id}`
      })),
      ...applications.map(app => ({
        type: 'application',
        id: app.id,
        title: app.name,
        description: app.description,
        path: `/${app.name}`
      }))
    ]

    return NextResponse.json({
      results,
      query,
      total: results.length
    })
  } catch (error) {
    console.error('[API_DASHBOARD_SEARCH]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

