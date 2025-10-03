# API Documentation

## Overview

This document details the API implementation using Server Actions pattern, ensuring type safety and performance optimization.

## Authentication APIs

### User Management

#### getUserByEmail

```typescript
async function getUserByEmail(
  email: string,
  includeLoginMethods = false
): Promise<UserWithLoginMethods | null>;
```

**Purpose**: Retrieve user information by email address
**Parameters**:

- email: User's email address
- includeLoginMethods: Include login methods in response

**Returns**: User object or null
**Error Handling**:

- Database connection errors
- Query execution errors

[See full authentication API docs](./auth-api.md)

## Security

### Input Validation

- Zod schema validation
- XSS protection
- SQL injection prevention

### Access Control

- Role-based access control
- Operation permission validation
- Rate limiting

[See security guidelines](./security.md)

## Performance

### Query Optimization

- Index utilization
- Selective relation loading
- Pagination implementation

### Caching Strategy

- User information caching
- Query result caching
- Cache invalidation rules

[See performance guidelines](./performance.md)

## Error Handling

### Error Categories

- Authentication errors
- Validation errors
- Server errors
- Database errors

[See error handling guide](./errors.md)
