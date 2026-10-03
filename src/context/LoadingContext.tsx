import React, { createContext, useContext, useState } from "react";
import type { LoadingContextType } from "../interfaces";

const LoadingContext = createContext<
  | (LoadingContextType & {
      setIsCurtainComplete: (val: boolean) => void;
      setCurtainParting: (val: boolean) => void;
    })
  | undefined
>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [avatarReady, setAvatarReady] = useState(false);
  const [curtainParting, setCurtainParting] = useState(false);
  const [isCurtainComplete, setIsCurtainComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const isLoaded = avatarReady && progress >= 100;

  return (
    <LoadingContext.Provider
      value={{
        isLoaded,
        isCurtainComplete,
        curtainParting,
        avatarReady,
        setAvatarReady,
        progress,
        setProgress,
        setIsCurtainComplete,
        setCurtainParting,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
