/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BETFAIR_APP_KEY: string;
  readonly VITE_BETFAIR_USERNAME: string;
  readonly VITE_BETFAIR_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
