# Vercel Edge Runtime Fix: __dirname is not defined

## Problem

Production deployment on Vercel was failing with:
```
ReferenceError: __dirname is not defined
```

This error occurs because:
1. **Vercel runs middleware in Edge Runtime** (ES Modules context)
2. **CommonJS globals** like `__dirname` and `__filename` are not available in ESM
3. Some packages in the dependency tree use these CommonJS globals:
   - `@one-ini/wasm` (used by `editorconfig`)
   - `winston` and `winston-elasticsearch` (server-side logging)

## Solution Applied

### 1. Updated `next.config.js`

Added three layers of protection:

#### A. `serverComponentsExternalPackages`
Prevents these packages from being bundled:
```js
serverComponentsExternalPackages: [
  'winston',
  'winston-elasticsearch',
  '@elastic/elasticsearch',
  'editorconfig',
  '@one-ini/wasm',
]
```

#### B. Edge Runtime Webpack Aliases
Explicitly excludes these packages when compiling for Edge Runtime:
```js
if (nextRuntime === 'edge') {
  config.resolve.alias = {
    ...config.resolve.alias,
    'winston': false,
    'winston-elasticsearch': false,
    '@elastic/elasticsearch': false,
    'editorconfig': false,
    '@one-ini/wasm': false,
  };
}
```

#### C. Client-Side Null Loader
Prevents these server-only packages from being bundled for the client:
```js
if (!isServer) {
  config.module.rules.push({
    test: /winston|winston-elasticsearch|@elastic\/elasticsearch|editorconfig|@one-ini\/wasm/,
    use: 'null-loader',
  });
}
```

### 2. Updated `middleware.ts`

Explicitly declared Edge Runtime:
```ts
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'edge',
}
```

## Why This Works

1. **Middleware runs in Edge Runtime** - which is faster and globally distributed
2. **Universal logger is Edge-compatible** - The `lib/logger/index.ts` doesn't import winston, only uses console methods
3. **Winston is server-only** - The `lib/logger/server.ts` with winston is excluded from Edge Runtime
4. **Build-time exclusion** - Webpack prevents bundling incompatible packages

## Testing

After deploying:
1. ✅ Homepage should load without 500 errors
2. ✅ Authentication flow should work
3. ✅ Admin routes should be protected
4. ✅ No `__dirname` errors in Vercel logs

## Related Files

- `/next.config.js` - Webpack and package configuration
- `/middleware.ts` - Edge Runtime middleware
- `/lib/logger/index.ts` - Universal logger (Edge-compatible)
- `/lib/logger/server.ts` - Server-only logger (not used in middleware)
- `/lib/logger/middleware.ts` - Middleware logger (uses universal logger)

## Additional Notes

- The logger system is designed to work in both environments:
  - **Edge Runtime (middleware)**: Uses `lib/logger/index.ts` (console-based)
  - **Node.js Runtime (API routes)**: Uses `lib/logger/server.ts` (winston-based)
- No functionality is lost - logging still works in both contexts

## Next Steps

1. Commit and push these changes
2. Deploy to Vercel
3. Monitor production logs for any remaining errors
4. Verify all authentication flows work correctly
