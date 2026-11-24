const LEGACY_STORAGE_KEYS = [
  'skfx_static_demo_store_v1',
  'skfx_static_demo_store_v2',
  'skfx_static_demo_store_v3',
  'skfx_static_demo_store_v4',
  'skfx_static_demo_store_v5',
  'skfx_static_demo_store_v6',
  'skfx_static_demo_store_v7',
  'skfx_static_demo_store_v8',
  'skfx_static_demo_uid_v1',
];

let interceptorInstalled = false;
let inMemoryBearerToken: string | null = null;

export function setInMemorySessionToken(token: string | null): void {
  inMemoryBearerToken = token && token.trim() ? token.trim() : null;
}

const nativeFetch: typeof window.fetch =
  typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;

function buildApiInit(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers || undefined);
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }
  if (inMemoryBearerToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryBearerToken}`);
  }
  return {
    ...init,
    credentials: init?.credentials || 'include',
    headers,
  };
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (input.startsWith('/api/auth/logout')) {
    inMemoryBearerToken = null;
  }
  return nativeFetch(input, buildApiInit(init));
}

export function installApiClient(): void {
  if (typeof window === 'undefined' || interceptorInstalled) return;
  interceptorInstalled = true;

  try {
    for (const oldKey of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(oldKey);
    }
  } catch {
    // ignore storage errors
  }

  const wrappedFetch: typeof window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    let isSameOriginApi = urlStr.startsWith('/api/');
    if (!isSameOriginApi) {
      try {
        const parsed = new URL(urlStr, window.location.origin);
        isSameOriginApi =
          parsed.origin === window.location.origin &&
          parsed.pathname.startsWith('/api/');
      } catch {
        isSameOriginApi = false;
      }
    }

    if (isSameOriginApi) {
      return apiFetch(urlStr, init);
    }

    return nativeFetch(input, init);
  };

  try {
    const ownDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!ownDesc || ownDesc.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: wrappedFetch,
        writable: true,
        configurable: true,
      });
    } else if (ownDesc.writable) {
      window.fetch = wrappedFetch;
    }
  } catch {
    // Ignore if environment locks down window.fetch completely
  }
}
