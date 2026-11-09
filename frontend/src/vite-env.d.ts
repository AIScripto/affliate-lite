/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public address networks use for postbacks and pixels, e.g. https://track.example.com. Empty = the panel's own address. */
  readonly VITE_TRACKING_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
