import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";

gsap.registerPlugin(ScrollTrigger);

// Enforce that the app always starts at the Hero section (top) on refresh
if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  ScrollTrigger.clearScrollMemory("manual");

  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
