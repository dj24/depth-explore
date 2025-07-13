import React from "react";

export const PointCloud = ({
  positions,
  colors,
}: {
  positions: Float32Array;
  colors: Uint8Array;
}) => {
  return (
    <points key={`${positions.length}-${colors.length}`}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3, true]} />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors={true} />
    </points>
  );
};
