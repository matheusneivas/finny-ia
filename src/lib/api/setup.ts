import { env } from '@/config/env';

import { setTransport } from './client';

/** Liga o modo demonstração. `require` dentro do if: em produção o mock some do bundle. */
export function setupApi() {
  if (__DEV__ && env.useMockApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockTransport } = require('./mock') as typeof import('./mock');
    setTransport(mockTransport);
  }
}
