/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_TWOGIS_API_KEY?: string;
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly NEXT_PUBLIC_TWOGIS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
