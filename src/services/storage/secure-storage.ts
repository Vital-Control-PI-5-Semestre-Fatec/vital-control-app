import * as SecureStore from 'expo-secure-store';

const volatileStorage = new Map<string, string>();
let hasWarnedAboutFallback = false;

function warnAboutFallback(error: unknown) {
  if (hasWarnedAboutFallback) {
    return;
  }

  hasWarnedAboutFallback = true;
  console.warn(
    'SecureStore indisponível neste binário. A sessão será mantida somente enquanto o aplicativo estiver aberto.',
    error,
  );
}

export const secureStorage = {
  async getItem(key: string) {
    try {
      if (await SecureStore.isAvailableAsync()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      warnAboutFallback(error);
    }

    return volatileStorage.get(key) ?? null;
  },

  async setItem(key: string, value: string) {
    volatileStorage.set(key, value);

    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      warnAboutFallback(error);
    }
  },

  async deleteItem(key: string) {
    volatileStorage.delete(key);

    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      warnAboutFallback(error);
    }
  },
};
