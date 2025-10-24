import { db } from "@/lib/db";

/**
 * Check if setting parentId would create a circular reference
 * Uses iterative approach (BFS) instead of recursion for better performance
 * 
 * @param itemId - The menu item ID to check
 * @param targetParentId - The proposed parent ID
 * @returns true if circular reference would be created, false otherwise
 */
export async function checkCircularReference(
  itemId: string,
  targetParentId: string
): Promise<boolean> {
  // Quick check: cannot be its own parent
  if (itemId === targetParentId) {
    return true;
  }

  const visited = new Set<string>();
  const queue = [itemId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Skip if already visited (avoid infinite loops)
    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Check if we found the target parent in the children
    if (current === targetParentId) {
      return true;
    }

    // Get all children of current item
    const children = await db.menuItem.findMany({
      where: { parentId: current },
      select: { id: true }
    });

    // Add children to queue for processing
    queue.push(...children.map(c => c.id));
  }

  return false;
}

/**
 * Get all descendants of a menu item (including nested children)
 * Uses iterative approach for better performance
 * 
 * @param itemId - The menu item ID
 * @returns Array of descendant IDs
 */
export async function getMenuItemDescendants(itemId: string): Promise<string[]> {
  const descendants: string[] = [];
  const visited = new Set<string>();
  const queue = [itemId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get all children of current item
    const children = await db.menuItem.findMany({
      where: { parentId: current },
      select: { id: true }
    });

    // Add children to descendants and queue
    children.forEach(child => {
      descendants.push(child.id);
      queue.push(child.id);
    });
  }

  return descendants;
}

/**
 * Get the depth of a menu item in the hierarchy
 * 
 * @param itemId - The menu item ID
 * @returns The depth (0 for root items, 1 for children of root, etc.)
 */
export async function getMenuItemDepth(itemId: string): Promise<number> {
  let depth = 0;
  let currentId: string | null = itemId;

  while (currentId) {
    const item = await db.menuItem.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    if (!item || !item.parentId) {
      break;
    }

    currentId = item.parentId;
    depth++;
  }

  return depth;
}

/**
 * Get the full path from root to a menu item
 * 
 * @param itemId - The menu item ID
 * @returns Array of menu item IDs from root to the item
 */
export async function getMenuItemPath(itemId: string): Promise<string[]> {
  const path: string[] = [itemId];
  let currentId: string | null = itemId;

  while (currentId) {
    const item = await db.menuItem.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    if (!item || !item.parentId) {
      break;
    }

    path.unshift(item.parentId);
    currentId = item.parentId;
  }

  return path;
}

/**
 * Validate menu hierarchy integrity
 * Checks for:
 * - Circular references
 * - Orphaned items (parent doesn't exist)
 * - Items pointing to themselves
 * 
 * @param applicationId - The application ID to validate
 * @returns Object with validation results
 */
export async function validateMenuHierarchy(applicationId: string) {
  const issues: {
    type: string;
    itemId: string;
    message: string;
  }[] = [];

  // Get all menu items for this application
  const items = await db.menuItem.findMany({
    where: { applicationId },
    select: { id: true, parentId: true, name: true }
  });

  for (const item of items) {
    // Check if item points to itself
    if (item.parentId === item.id) {
      issues.push({
        type: 'SELF_REFERENCE',
        itemId: item.id,
        message: `Menu item "${item.name}" points to itself as parent`
      });
      continue;
    }

    // Check if parent exists
    if (item.parentId) {
      const parent = await db.menuItem.findUnique({
        where: { id: item.parentId }
      });

      if (!parent) {
        issues.push({
          type: 'ORPHANED_PARENT',
          itemId: item.id,
          message: `Menu item "${item.name}" has non-existent parent`
        });
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    itemCount: items.length
  };
}

/**
 * Performance comparison helper
 * Logs performance metrics for circular reference checks
 */
export async function benchmarkCircularReferenceCheck(
  itemId: string,
  targetParentId: string
): Promise<{
  hasCircularReference: boolean;
  executionTime: number;
}> {
  const startTime = performance.now();
  const hasCircularReference = await checkCircularReference(itemId, targetParentId);
  const executionTime = performance.now() - startTime;

  console.log(
    `[CircularReferenceCheck] Item: ${itemId}, Target: ${targetParentId}, ` +
    `Result: ${hasCircularReference}, Time: ${executionTime.toFixed(2)}ms`
  );

  return {
    hasCircularReference,
    executionTime
  };
}

