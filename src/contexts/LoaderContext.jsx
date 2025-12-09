import { createContext, useContext, useState, useEffect } from "react";

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Vérifier si le loader a déjà été affiché
    const hasLoaded = localStorage.getItem("loaderCompleted");
    
    if (hasLoaded) {
      setIsLoading(false);
      return;
    }

    const preloadAssets = async () => {
      const assets = [
        "./bg_video.mp4",
        "./logo.png",
        "./codebar.png",
      ];

      let loaded = 0;

      const loadAsset = (src) => {
        return new Promise((resolve) => {
          if (src.endsWith(".mp4")) {
            const video = document.createElement("video");
            video.oncanplaythrough = () => {
              loaded++;
              setProgress(Math.round((loaded / assets.length) * 100));
              resolve();
            };
            video.onerror = () => {
              loaded++;
              setProgress(Math.round((loaded / assets.length) * 100));
              resolve();
            };
            video.src = src;
          } else {
            const img = new Image();
            img.onload = () => {
              loaded++;
              setProgress(Math.round((loaded / assets.length) * 100));
              resolve();
            };
            img.onerror = () => {
              loaded++;
              setProgress(Math.round((loaded / assets.length) * 100));
              resolve();
            };
            img.src = src;
          }
        });
      };

      await Promise.all(assets.map(loadAsset));
      
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem("loaderCompleted", "true");
      }, 500);
    };

    preloadAssets();
  }, []);

  return (
    <LoaderContext.Provider value={{ isLoading, progress }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return context;
};
