// Adicione configurações globais do Jest aqui
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Adicione mocks globais aqui
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock para o objeto window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

// Mock para o objeto ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock para o objeto IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserver;

// Mock para o objeto scrollTo
window.scrollTo = jest.fn();

// Mock para o objeto fetch
const mockResponse = (status, statusText, response) => {
  return new window.Response(response, {
    status,
    statusText,
    headers: {
      'Content-type': 'application/json',
    },
  });};

global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve(
    mockResponse(200, null, JSON.stringify({ data: 'mock data' }))
  )
);

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
