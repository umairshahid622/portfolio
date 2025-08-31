import { Html, useProgress } from "@react-three/drei";

const CanvasLoader = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div>{progress.toFixed(0)}%</div>
    </Html>
  );
};

export default CanvasLoader;

