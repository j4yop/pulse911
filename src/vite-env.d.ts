/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOSS_PROJECT_ID?: string;
  readonly VITE_MOSS_PROJECT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
