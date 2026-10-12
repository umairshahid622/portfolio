/// <reference types="vite/client" />

declare module "troika-three-text" {
  export const Text: any;
  export function createTextDerivedMaterial(baseMaterial: any, options?: any): any;
  export function preloadFont(options: any, callback?: () => void): void;
  export function getTextRenderInfo(args: any, callback: (info: any) => void): void;
}

declare module "troika-three-utils" {
  export const createDerivedMaterial: any;
  export const voidMainRegExp: RegExp;
}

interface ImportMetaEnv {
  readonly VITE_APP_EMAILJS_SERVICE_ID?: string;
  readonly VITE_APP_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_APP_EMAILJS_PUBLIC_ID?: string;
  readonly VITE_APP_EMAILJS_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
