import Header from "./components/Header";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import SmoothCursor from "./components/SmoothCursor";
import CurtainLoader from "./components/CurtainLoader";
import { LoadingProvider } from "./context/LoadingContext";

export default function App() {
  return (
    <LoadingProvider>
      <CurtainLoader />
      <div className="min-h-screen w-full relative bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300 overflow-x-hidden selection:bg-earth-terracotta selection:text-earth-cream">
        <Header />
        <main className="w-full">
          <Hero />
          <Overview />
        </main>
        <SmoothCursor />
      </div>
    </LoadingProvider>
  );
}
