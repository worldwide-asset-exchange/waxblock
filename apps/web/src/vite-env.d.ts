/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_ENDPOINTS?: string;
  readonly VITE_HISTORY_ENDPOINTS?: string;
  readonly VITE_LIGHTAPI_ENDPOINTS?: string;
  readonly VITE_ATOMIC_ENDPOINTS?: string;
  readonly VITE_IPFS_ENDPOINTS?: string;
  readonly VITE_SIMPLEASSETS?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_NETWORK_TYPE?: string;
  readonly VITE_CF_NETWORK_TYPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
