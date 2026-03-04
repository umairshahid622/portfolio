import { OrbitControls, Preload, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import CanvasLoader from "./CanvasLoader";

const TelePhoneCanvas = () => {
  return (
    <Canvas
      shadows
      frameloop="demand"
      camera={{ position: [25, 5, 20], fov: 30 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2.5}
        />
        <TelephoneModel />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

const TelephoneModel =  ()  =>{
    const { scene } = useGLTF("./antique_phone/scene.gltf");
  return (
    <mesh>
      <hemisphereLight intensity={10} groundColor="black" />
      <pointLight intensity={10} />
      <primitive object={scene} scale={3.5} position={[0,-4,0]} />
    </mesh>
  );
}

export default TelePhoneCanvas;
