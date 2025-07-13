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
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          normalized={true}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors={true} />
    </points>
  );
};
