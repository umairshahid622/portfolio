/// <reference types="vite/client" />

declare module "troika-three-text" {
  export const Text: any;
  export function createTextDerivedMaterial(baseMaterial: any, options?: any): any;
  export function preloadFont(options: any, callback?: () => void): void;
  export function getTextRenderInfo(args: any, callback: (info: any) => void): void;
}

declare module "troika-three-utils" {
  export function createDerivedMaterial(baseMaterial: any, options?: any): any;
  export const voidMainRegExp: RegExp;
}
