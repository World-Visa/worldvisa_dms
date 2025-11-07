import { QueryClient } from '@tanstack/react-query';

import { queryClientDefaultOptions } from './options';

export function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: queryClientDefaultOptions,
  });
}


