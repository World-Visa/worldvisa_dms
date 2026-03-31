type GetTokenFn = () => Promise<string | null>;

let _getToken: GetTokenFn | null = null;

export function setTokenProvider(fn: GetTokenFn): void {
  _getToken = fn;
}

export async function getClerkToken(): Promise<string | null> {
  if (!_getToken) return null;
  return _getToken();
}
