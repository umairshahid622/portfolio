export interface LoadingContextType {
  isLoaded: boolean;
  isCurtainComplete: boolean;
  curtainParting: boolean;
  avatarReady: boolean;
  setAvatarReady: (ready: boolean) => void;
  progress: number;
  setProgress: (val: number) => void;
}
