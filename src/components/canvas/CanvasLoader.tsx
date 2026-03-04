import { Html, useProgress } from "@react-three/drei";

const CanvasLoader = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-current" />
      <div>{progress.toFixed(0)}%</div>
    </Html>
  );
};

export default CanvasLoader;

