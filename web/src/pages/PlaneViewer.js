import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import "./PlaneViewer.css";

// set true if your backend x/y/z are DEGREES
const INPUT_IS_DEGREES = true;
const toRad = (v) => (INPUT_IS_DEGREES ? (Number(v) * Math.PI) / 180 : Number(v));

function Plane({ rotation }) {
  const group = useRef();
  const { scene } = useGLTF("/models/scene.gltf");

  const target = useRef({ x: 0, y: 0, z: 0 });
  useEffect(() => {
    target.current = rotation;
  }, [rotation]);

  useFrame(() => {
    if (!group.current) return;

    const s = 0.18; // visual smoothing
    group.current.rotation.x += (target.current.x - group.current.rotation.x) * s;
    group.current.rotation.y += (target.current.y - group.current.rotation.y) * s;
    group.current.rotation.z += (target.current.z - group.current.rotation.z) * s;
  });

  return (
    <group ref={group} className="plane-group">
      <primitive object={scene} />
    </group>
  );
}

function PlaneViewer({ deviceId = "esp32-01", apiBase = "http://localhost:3001", pollMs = 100 }) {
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });

  // NEW: smooth incoming network values (helps with polling jitter)
  const filtered = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const res = await axios.get(`${apiBase}/gyro/latest/${deviceId}`);
        if (!alive) return;

        const x = toRad(res.data?.x ?? 0);
        const y = toRad(res.data?.y ?? 0);
        const z = toRad(res.data?.z ?? 0);

        // Axis mapping (your original)
        const mapped = { x: y, y: z, z: -x };

        // NEW: input smoothing (0.2–0.35 sweet spot)
        const a = 0.25;

        filtered.current.x += (mapped.x - filtered.current.x) * a;
        filtered.current.y += (mapped.y - filtered.current.y) * a;
        filtered.current.z += (mapped.z - filtered.current.z) * a;

        setRot({
          x: filtered.current.x,
          y: filtered.current.y,
          z: filtered.current.z,
        });
      } catch (e) {
        // ignore
      }
    };

    tick();
    const id = setInterval(tick, pollMs);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [apiBase, deviceId, pollMs]);

  return (
    <div className="planeViewer">
      <div className="planeHeader">
        <div className="planeTitle">Live Plane Orientation</div>
        <div className="planeSub">Device: {deviceId}</div>
      </div>

      <div className="planeCanvasWrap">
        <Canvas className="planeCanvas" camera={{ position: [4, 3.5, 6], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} />
          <Plane rotation={rot} />
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload("/models/scene.gltf");

export default PlaneViewer;
