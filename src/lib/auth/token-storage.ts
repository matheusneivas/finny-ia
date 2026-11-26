import * as SecureStore from 'expo-secure-store';

/**
 * Tokens no iOS Keychain / Android Keystore via SecureStore.
 * - WHEN_UNLOCKED_THIS_DEVICE_ONLY: não vai para backup do iCloud nem para outro aparelho.
 * - O access token também fica em memória para não ler o Keychain a cada requisição.
 */
const KEYS = {
  access: 'fini.accessToken',
  refresh: 'fini.refreshToken',
} as const;

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let memoryAccessToken: string | null = null;

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (memoryAccessToken) return memoryAccessToken;
    memoryAccessToken = await SecureStore.getItemAsync(KEYS.access, options);
    return memoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.refresh, options);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    memoryAccessToken = accessToken;
    await Promise.all([
      SecureStore.setItemAsync(KEYS.access, accessToken, options),
      SecureStore.setItemAsync(KEYS.refresh, refreshToken, options),
    ]);
  },

  async clear(): Promise<void> {
    memoryAccessToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.access, options),
      SecureStore.deleteItemAsync(KEYS.refresh, options),
    ]);
  },
};
