export interface LoadingContextType {
  isLoaded: boolean;
  isCurtainComplete: boolean;
  curtainParting: boolean;
  progress: number;
  setProgress: (val: number) => void;
  avatarReady?: boolean;
  setAvatarReady?: (ready: boolean) => void;
}
