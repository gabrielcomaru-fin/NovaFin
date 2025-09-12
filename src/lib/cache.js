// Sistema de cache simples para queries do Supabase
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Limpa entradas expiradas
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Gera chave de cache baseada em parâmetros
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

export const cacheManager = new CacheManager();

// Limpa cache a cada 10 minutos
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);

// Hook para usar cache com Supabase
export const useSupabaseCache = () => {
  const getCachedData = (key, fetchFn, ttl) => {
    const cached = cacheManager.get(key);
    if (cached) {
      return Promise.resolve(cached);
    }
    
    return fetchFn().then(data => {
      cacheManager.set(key, data, ttl);
      return data;
    });
  };

  const invalidateCache = (pattern) => {
    if (pattern) {
      // Remove entradas que correspondem ao padrão
      for (const key of cacheManager.cache.keys()) {
        if (key.includes(pattern)) {
          cacheManager.delete(key);
        }
      }
    } else {
      cacheManager.clear();
    }
  };

  return {
    getCachedData,
    invalidateCache,
    cacheManager
  };
};
