import React, {useRef, useState} from "react";
import {Mesh} from "three";
import {useFrame} from "@react-three/fiber";

export function Box() {
  const ref = useRef<Mesh>(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  useFrame((state, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x += delta
  });

  return (
    <mesh
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}>
      <boxGeometry args={[1, 1, 1]}/>
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'}/>
    </mesh>
  )
}
