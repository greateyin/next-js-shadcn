import { permissionCache, getCacheStats, resetCacheStats, clearPermissionCache } from '../permissionCache';
import { UserWithRoles } from '@/types/roles';

/**
 * Mock user data for testing
 */
const mockUser: UserWithRoles = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  roles: [
    {
      id: 'role-1',
      name: 'admin',
      description: 'Administrator'
    }
  ],
  permissions: [
    {
      id: 'perm-1',
      name: 'users:read',
      description: 'Read users'
    },
    {
      id: 'perm-2',
      name: 'users:write',
      description: 'Write users'
    }
  ],
  applications: [
    {
      id: 'app-1',
      name: 'Admin Panel',
      path: '/admin',
      isActive: true
    }
  ]
};

describe('PermissionCache', () => {
  beforeEach(() => {
    clearPermissionCache();
    resetCacheStats();
  });

  describe('Basic Operations', () => {
    test('should cache and retrieve user permissions', () => {
      // Set cache
      permissionCache.set('user-1', mockUser);
      
      // Get from cache
      const cached = permissionCache.get('user-1');
      
      expect(cached).toEqual(mockUser);
    });

    test('should return null for non-existent user', () => {
      const cached = permissionCache.get('non-existent');
      expect(cached).toBeNull();
    });

    test('should invalidate specific user cache', () => {
      permissionCache.set('user-1', mockUser);
      permissionCache.invalidate('user-1');
      
      const cached = permissionCache.get('user-1');
      expect(cached).toBeNull();
    });

    test('should invalidate multiple users cache', () => {
      permissionCache.set('user-1', mockUser);
      permissionCache.set('user-2', mockUser);
      
      permissionCache.invalidateMany(['user-1', 'user-2']);
      
      expect(permissionCache.get('user-1')).toBeNull();
      expect(permissionCache.get('user-2')).toBeNull();
    });

    test('should clear all cache', () => {
      permissionCache.set('user-1', mockUser);
      permissionCache.set('user-2', mockUser);
      
      clearPermissionCache();
      
      expect(permissionCache.get('user-1')).toBeNull();
      expect(permissionCache.get('user-2')).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache hits', () => {
      permissionCache.set('user-1', mockUser);
      
      permissionCache.get('user-1');
      permissionCache.get('user-1');
      
      const stats = getCacheStats();
      expect(stats.hits).toBe(2);
    });

    test('should track cache misses', () => {
      permissionCache.get('user-1');
      permissionCache.get('user-2');
      
      const stats = getCacheStats();
      expect(stats.misses).toBe(2);
    });

    test('should calculate hit rate correctly', () => {
      permissionCache.set('user-1', mockUser);
      
      permissionCache.get('user-1'); // hit
      permissionCache.get('user-2'); // miss
      
      const stats = getCacheStats();
      expect(stats.hitRate).toBe('50.00%');
    });

    test('should track invalidations', () => {
      permissionCache.set('user-1', mockUser);
      permissionCache.invalidate('user-1');
      
      const stats = getCacheStats();
      expect(stats.invalidations).toBe(1);
    });

    test('should reset statistics', () => {
      permissionCache.set('user-1', mockUser);
      permissionCache.get('user-1');
      
      resetCacheStats();
      
      const stats = getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('TTL Expiration', () => {
    test('should expire cache after TTL', async () => {
      // Create cache with 1 second TTL for testing
      const testCache = new (permissionCache.constructor as any)(1 / 60); // 1 second
      
      testCache.set('user-1', mockUser);
      
      // Should be in cache immediately
      expect(testCache.get('user-1')).toEqual(mockUser);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      expect(testCache.get('user-1')).toBeNull();
    });
  });

  describe('Performance', () => {
    test('should provide significant performance improvement', () => {
      const iterations = 1000;
      
      // Populate cache
      permissionCache.set('user-1', mockUser);
      
      // Measure cache hits
      const startCache = Date.now();
      for (let i = 0; i < iterations; i++) {
        permissionCache.get('user-1');
      }
      const cacheTime = Date.now() - startCache;
      
      // Cache should be much faster than database queries
      // (In real scenario, database queries would take 10-100ms each)
      expect(cacheTime).toBeLessThan(100); // Should complete in less than 100ms
      
      const stats = getCacheStats();
      console.log(`Cache Performance: ${iterations} hits in ${cacheTime}ms`);
      console.log(`Hit Rate: ${stats.hitRate}`);
    });
  });
});

