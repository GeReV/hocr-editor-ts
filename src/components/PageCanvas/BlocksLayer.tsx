import React from 'react';
import Konva from 'konva';
import { Layer } from 'react-konva';

interface Props {
  children?: React.ReactNode;
  isDrawing?: boolean;
}

const BlocksLayer = React.forwardRef<Konva.Layer, Props>(({ children, isDrawing }, ref) => {
  return <Layer ref={ref}>{children}</Layer>;
});

export default BlocksLayer;
