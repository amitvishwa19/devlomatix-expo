import React, { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';

export default function InteractiveBoundary() {
  const layoutRef = useRef({ x: 40, y: 60, width: 260, height: 120 });
  const baseLayout = useRef({ ...layoutRef.current });
  const [revision, setRevision] = useState(0);

  const triggerRender = () => setRevision(r => r + 1);

  const createPanResponder = (type) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    // ensure children don't block
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    
    onPanResponderGrant: (evt, gestureState) => {
      // Lock in the base positions at the start of a drag
      baseLayout.current = { ...layoutRef.current };
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dx, dy } = gestureState;
      let { x, y, width, height } = baseLayout.current;

      if (type === 'drag') {
        x += dx;
        y += dy;
      } else if (type === 'top-left') {
        x += dx; y += dy; width -= dx; height -= dy;
      } else if (type === 'top-right') {
        y += dy; width += dx; height -= dy;
      } else if (type === 'bottom-left') {
        x += dx; width -= dx; height += dy;
      } else if (type === 'bottom-right') {
        width += dx; height += dy;
      }

      // Constrain minimum sizes
      if (width < 60) {
        if (type === 'top-left' || type === 'bottom-left') x = baseLayout.current.x + baseLayout.current.width - 60;
        width = 60;
      }
      if (height < 60) {
        if (type === 'top-left' || type === 'top-right') y = baseLayout.current.y + baseLayout.current.height - 60;
        height = 60;
      }

      layoutRef.current = { x, y, width, height };
      triggerRender();
    },
    onPanResponderRelease: () => {
      baseLayout.current = { ...layoutRef.current };
    }
  });

  const dragResponder = useRef(createPanResponder('drag')).current;
  const tlResponder = useRef(createPanResponder('top-left')).current;
  const trResponder = useRef(createPanResponder('top-right')).current;
  const blResponder = useRef(createPanResponder('bottom-left')).current;
  const brResponder = useRef(createPanResponder('bottom-right')).current;

  const l = layoutRef.current;

  return (
    <View 
      className="absolute border-2 border-amber-500 rounded-xl bg-amber-500/10"
      style={{ left: l.x, top: l.y, width: l.width, height: l.height }}
      {...dragResponder.panHandlers}
    >
      <View 
        className="absolute top-[-10px] left-[-10px] w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-xl"
        {...tlResponder.panHandlers} 
      />
      <View 
        className="absolute top-[-10px] right-[-10px] w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-xl"
        {...trResponder.panHandlers} 
      />
      <View 
        className="absolute bottom-[-10px] left-[-10px] w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-xl"
        {...blResponder.panHandlers} 
      />
      <View 
        className="absolute bottom-[-10px] right-[-10px] w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-xl"
        {...brResponder.panHandlers} 
      />
    </View>
  );
}
