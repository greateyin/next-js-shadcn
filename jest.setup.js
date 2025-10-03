/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// These globals are required by some tests
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
  useSearchParams: jest.fn(),
}));

jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    signIn: jest.fn(),
    signOut: jest.fn(),
    useSession: jest.fn(() => {
      return { data: null, status: 'unauthenticated' };
    }),
  };
});
