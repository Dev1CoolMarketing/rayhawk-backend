process.env.JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET ?? 'test-refresh-secret';
process.env.JWT_ACCESS_TOKEN_TTL_SECONDS = process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? '600';
process.env.JWT_REFRESH_TOKEN_TTL_SECONDS = process.env.JWT_REFRESH_TOKEN_TTL_SECONDS ?? '604800';

jest.setTimeout(30000);
