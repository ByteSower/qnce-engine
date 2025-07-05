import '@testing-library/jest-dom';

// Only add browser mocks when window is available (jsdom environment)
if (typeof window !== 'undefined') {
  // Mock implementations for browser-specific APIs that might be used
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(callback, 0);
  };

  global.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}

import { describe, test, expect } from '@jest/globals';

describe('UI Test Setup', () => {
  test('should contain at least one test', () => {
    expect(true).toBe(true);
  });
});
