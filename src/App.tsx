import Header from "./components/Header";
import Hero from "./components/Hero";
import SmoothCursor from "./components/SmoothCursor";

export default function App() {
  return (
    <div className="min-h-screen w-full relative bg-earth-cream dark:bg-earth-forest text-earth-forest dark:text-earth-cream transition-colors duration-300 overflow-x-hidden selection:bg-earth-terracotta selection:text-earth-cream">
      <Header />
      <main className="w-full">
        <Hero />
      </main>
      <SmoothCursor />
    </div>
  );
}
