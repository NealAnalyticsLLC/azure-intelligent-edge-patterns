import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Stage,
  Image as KonvaImage,
  Shape as KonvaShape,
  Group,
  Line,
  Layer,
  Circle,
  Path,
} from 'react-konva';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/types/Node';

import { LiveViewProps, MaskProps, BoxProps, VideoAnnosGroupProps } from './LiveViewContainer.type';
import { CreatingState } from '../../store/videoAnnoSlice';
import { isBBox } from '../../store/shared/Box2d';
import { isPolygon } from '../../store/shared/Polygon';
import { Shape } from '../../store/shared/BaseShape';
import { isLine } from '../../store/shared/Line';
import { isAOIShape, isCountingLine, isDangerZone } from '../../store/shared/VideoAnnoUtil';

const getRelativePosition = (layer: Konva.Layer): { x: number; y: number } => {
  const transform = layer.getAbsoluteTransform().copy();
  transform.invert();
  const pos = layer.getStage().getPointerPosition();
  return transform.point(pos);
};

export const LiveViewScene: React.FC<LiveViewProps> = ({
  videoAnnos,
  creatingShape,
  onCreatingPoint,
  updateVideoAnno,
  removeVideoAnno,
  finishLabel,
  AOIVisible,
  countingLineVisible,
  imageInfo,
  creatingState,
  dangerZoneVisible,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const layerRef = useRef<Konva.Layer>(null);

  const [imgEle, status, { width: imgWidth, height: imgHeight }] = imageInfo;

  /* The component need to support image with Content-type "multipart/x-mixed-replace",
     which will keep updating the image data.
     Keep updating the canvas by using Konva.Animation so we can see the latest image.
  */
  useEffect(() => {
    const anim = new Konva.Animation(() => {}, layerRef.current);
    anim.start();

    return (): void => {
      anim.stop();
    };
  }, []);

  useEffect(() => {
    const { width: divWidth, height: divHeight } = divRef.current.getBoundingClientRect();
    stageRef.current.width(divWidth);
    stageRef.current.height(divHeight);
  }, []);

  /* Fit Image to Stage */
  useEffect(() => {
    if (imgWidth !== 0 && imgHeight !== 0) {
      const { width: stageWidth, height: stageHeight } = stageRef.current.size();
      const scale = Math.min(stageWidth / imgWidth, stageHeight / imgHeight);
      layerRef.current.scale({ x: scale, y: scale });

      const offsetX = (stageWidth - imgWidth * scale) / 2;
      const offsetY = (stageHeight - imgHeight * scale) / 2;
      layerRef.current.position({ x: offsetX, y: offsetY });
    }
  }, [imgHeight, imgWidth]);

  const onMouseDown = (e: KonvaEventObject<MouseEvent>): void => {
    if (creatingState === CreatingState.Disabled) return;

    const { x, y } = getRelativePosition(e.target.getLayer());
    onCreatingPoint({ x, y });
  };

  const onMouseMove = (e: KonvaEventObject<MouseEvent>): void => {
    if (creatingState !== CreatingState.Creating) return;

    const { x, y } = getRelativePosition(e.target.getLayer());
    if (creatingShape === Shape.BBox) updateVideoAnno(videoAnnos[videoAnnos.length - 1].id, { x2: x, y2: y });
    else if (creatingShape === Shape.Polygon || creatingShape === Shape.Line)
      updateVideoAnno(videoAnnos[videoAnnos.length - 1].id, { idx: -1, vertex: { x, y } });
  };

  useEffect(() => {
    const div = divRef.current;
    const handleFPress = (e) => {
      if (e.key === 'd') {
        finishLabel();
      }
    };
    div.addEventListener('keydown', handleFPress);
    return () => {
      div.removeEventListener('keydown', handleFPress);
    };
  }, []);

  const AOIs = useMemo(() => {
    return videoAnnos.filter(isAOIShape);
  }, [videoAnnos]);

  const countingLines = useMemo(() => {
    return videoAnnos.filter(isCountingLine);
  }, [videoAnnos]);

  const dangerZone = useMemo(() => {
    return videoAnnos.filter(isDangerZone);
  }, [videoAnnos]);

  return (
    <div ref={divRef} style={{ width: '100%', height: '100%' }} tabIndex={0}>
      <Stage ref={stageRef} style={{ cursor: creatingState !== CreatingState.Disabled ? 'crosshair' : '' }}>
        <Layer ref={layerRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove}>
          <KonvaImage image={imgEle} ref={imgRef} />
          {
            /* Render when image is loaded to prevent the shapes show in unscale size */
            status === 'loaded' && (
              <>
                {/** AOIs */}
                <VideoAnnosGroup
                  imgWidth={imgWidth}
                  imgHeight={imgHeight}
                  videoAnnos={AOIs}
                  updateVideoAnno={updateVideoAnno}
                  removeVideoAnno={removeVideoAnno}
                  visible={AOIVisible}
                  creatingState={creatingState}
                  needMask={true}
                />
                {/** Counting Lines */}
                <VideoAnnosGroup
                  imgWidth={imgWidth}
                  imgHeight={imgHeight}
                  videoAnnos={countingLines}
                  updateVideoAnno={updateVideoAnno}
                  removeVideoAnno={removeVideoAnno}
                  visible={countingLineVisible}
                  creatingState={creatingState}
                  needMask={false}
                />
                {/** Danger Zones */}
                <VideoAnnosGroup
                  imgWidth={imgWidth}
                  imgHeight={imgHeight}
                  videoAnnos={dangerZone}
                  updateVideoAnno={updateVideoAnno}
                  removeVideoAnno={removeVideoAnno}
                  visible={dangerZoneVisible}
                  creatingState={creatingState}
                  needMask={false}
                  color="yellow"
                />
              </>
            )
          }
        </Layer>
      </Stage>
    </div>
  );
};

const VideoAnnosGroup: React.FC<VideoAnnosGroupProps> = ({
  imgWidth,
  imgHeight,
  videoAnnos,
  updateVideoAnno,
  removeVideoAnno,
  visible,
  creatingState,
  needMask,
  color = 'white',
}): JSX.Element => {
  return (
    <>
      {needMask && <Mask width={imgWidth} height={imgHeight} holes={videoAnnos} visible={visible} />}
      {videoAnnos.map((e) => {
        if (isBBox(e)) {
          return (
            <Box
              key={e.id}
              box={{ ...e.vertices, id: e.id }}
              visible={visible}
              boundary={{ x1: 0, y1: 0, x2: imgWidth, y2: imgHeight }}
              onBoxChange={(changes): void => {
                updateVideoAnno(e.id, changes);
              }}
              removeBox={() => removeVideoAnno(e.id)}
              creatingState={creatingState}
              color={color}
            />
          );
        }
        if (isPolygon(e)) {
          return (
            <Polygon
              key={e.id}
              id={e.id}
              polygon={e.vertices}
              visible={visible}
              removeBox={() => removeVideoAnno(e.id)}
              creatingState={creatingState}
              handleChange={(idx, vertex) => updateVideoAnno(e.id, { idx, vertex })}
              boundary={{ x1: 0, y1: 0, x2: imgWidth, y2: imgHeight }}
              color={color}
            />
          );
        }
        if (isLine(e)) {
          return (
            <Polygon
              key={e.id}
              id={e.id}
              polygon={e.vertices}
              visible={visible}
              removeBox={() => removeVideoAnno(e.id)}
              creatingState={creatingState}
              handleChange={(idx, vertex) => updateVideoAnno(e.id, { idx, vertex })}
              boundary={{ x1: 0, y1: 0, x2: imgWidth, y2: imgHeight }}
              color={color}
            />
          );
        }
        return null;
      })}
    </>
  );
};

function polygonArea(vertices) {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return area / 2;
}

const Mask: React.FC<MaskProps> = ({ width, height, holes, visible }) => {
  return (
    <KonvaShape
      width={width}
      height={height}
      fill={'rgba(0,0,0,0.5)'}
      visible={visible}
      sceneFunc={(ctx, shape): void => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(shape.width(), 0);
        ctx.lineTo(shape.width(), shape.height());
        ctx.lineTo(0, shape.height());
        ctx.lineTo(0, 0);

        // Nonozero-rule
        holes.forEach((e) => {
          if (isBBox(e)) {
            const { x1, y1, x2, y2 } = e.vertices;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1, y2);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, y1);
            ctx.lineTo(x1, y1);
          } else if (isPolygon(e)) {
            const vertices = [...e.vertices];
            const head = vertices[0];
            ctx.moveTo(head.x, head.y);

            // check if the array is in counter clockwise
            if (polygonArea(vertices) > 0) vertices.reverse();

            vertices.forEach((p) => {
              ctx.lineTo(p.x, p.y);
            });
            ctx.lineTo(head.x, head.y);
          }
        });

        ctx.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};

const Polygon = ({ id, polygon, visible, removeBox, creatingState, handleChange, boundary, color }) => {
  const [cancelBtnVisible, setCanceBtnVisible] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  const scale = groupRef.current?.getLayer().scale().x || 1;

  const radius = 5 / scale;

  const borderPoints = useMemo(() => {
    return polygon
      .map((e, _, arr) => {
        return { x: e.x - arr[0].x, y: e.y - arr[0].y };
      })
      .reduce((acc, cur) => {
        acc.push(cur.x, cur.y);
        return acc;
      }, []);
  }, [polygon]);

  const onDragMove = (idx: number) => (e: KonvaEventObject<DragEvent>): void => {
    let { x, y } = e.target.position();

    if (x < boundary.x1) {
      x = boundary.x1;
      e.target.x(x);
    }

    if (x > boundary.x2) {
      x = boundary.x2;
      e.target.x(x);
    }

    if (y < boundary.y1) {
      y = boundary.y1;
      e.target.y(y);
    }

    if (y > boundary.y2) {
      y = boundary.y2;
      e.target.y(y);
    }

    handleChange(idx, { x, y });
  };

  const topPoint = useMemo(() => {
    let point = { x: null, y: Infinity };
    polygon.forEach((e) => {
      if (e.y < point.y) point = e;
    });
    return point;
  }, [polygon]);

  return (
    <Group
      visible={visible}
      onMouseEnter={(): void => setCanceBtnVisible(true)}
      onMouseLeave={(): void => setCanceBtnVisible(false)}
      cache={[{ drawBorder: true }]}
      ref={groupRef}
    >
      <Line
        x={polygon[0].x}
        y={polygon[0].y}
        points={borderPoints}
        closed
        stroke={color}
        strokeWidth={2 / scale}
        hitStrokeWidth={50 / scale}
      />
      {polygon.map((e, i) => (
        <Circle
          key={i}
          draggable
          name="leftTop"
          x={e.x}
          y={e.y}
          radius={radius}
          fill={color}
          onDragMove={onDragMove(i)}
          hitStrokeWidth={50 / scale}
        />
      ))}
      <Path
        x={topPoint.x}
        y={topPoint.y - 30 / scale}
        data="M 0 0 L 20 20 M 20 0 L 0 20"
        stroke="red"
        strokeWidth={5}
        visible={cancelBtnVisible && creatingState === CreatingState.Disabled}
        onMouseEnter={(e): void => {
          e.target.getStage().container().style.cursor = 'pointer';
        }}
        onMouseLeave={(e): void => {
          e.target.getStage().container().style.cursor = 'default';
        }}
        onClick={(): void => removeBox(id)}
        scale={{ x: 1 / scale, y: 1 / scale }}
      />
    </Group>
  );
};

const Box: React.FC<BoxProps> = ({
  box,
  onBoxChange,
  visible,
  boundary,
  removeBox,
  creatingState,
  color,
}) => {
  const { x1, y1, x2, y2 } = box;
  const [cancelBtnVisible, setCanceBtnVisible] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  const handleDrag = (e: KonvaEventObject<DragEvent>): void => {
    let { x, y } = e.target.position();

    if (x < boundary.x1) {
      x = boundary.x1;
      e.target.x(x);
    }

    if (x > boundary.x2) {
      x = boundary.x2;
      e.target.x(x);
    }

    if (y < boundary.y1) {
      y = boundary.y1;
      e.target.y(y);
    }

    if (y > boundary.y2) {
      y = boundary.y2;
      e.target.y(y);
    }

    switch (e.target.name()) {
      case 'leftTop':
        onBoxChange({ x1: x, y1: y });
        break;
      case 'rightTop':
        onBoxChange({ x2: x, y1: y });
        break;
      case 'rightBottom':
        onBoxChange({ x2: x, y2: y });
        break;
      case 'leftBottom':
        onBoxChange({ x1: x, y2: y });
        break;
      default:
        break;
    }
  };

  const scale = groupRef.current?.getLayer().scale().x || 1;

  const radius = 5 / scale;

  return (
    <Group
      visible={visible}
      onMouseEnter={(): void => setCanceBtnVisible(true)}
      onMouseLeave={(): void => setCanceBtnVisible(false)}
      cache={[{ drawBorder: true }]}
      ref={groupRef}
    >
      <Line
        x={x1}
        y={y1}
        points={[0, 0, 0, y2 - y1, x2 - x1, y2 - y1, x2 - x1, 0]}
        closed
        stroke={color}
        strokeWidth={2 / scale}
        hitStrokeWidth={50 / scale}
      />
      <Circle draggable name="leftTop" x={x1} y={y1} radius={radius} fill={color} onDragMove={handleDrag} />
      <Circle draggable name="rightTop" x={x2} y={y1} radius={radius} fill={color} onDragMove={handleDrag} />
      <Circle
        draggable
        name="rightBottom"
        x={x2}
        y={y2}
        radius={radius}
        fill={color}
        onDragMove={handleDrag}
      />
      <Circle
        draggable
        name="leftBottom"
        x={x1}
        y={y2}
        radius={radius}
        fill={color}
        onDragMove={handleDrag}
      />
      <Path
        x={x1}
        y={y1 - 30 / scale}
        data="M 0 0 L 20 20 M 20 0 L 0 20"
        stroke="red"
        strokeWidth={5}
        visible={cancelBtnVisible && creatingState === CreatingState.Disabled}
        onMouseEnter={(e): void => {
          e.target.getStage().container().style.cursor = 'pointer';
        }}
        onMouseLeave={(e): void => {
          e.target.getStage().container().style.cursor = 'default';
        }}
        onClick={(): void => removeBox(box.id)}
        scale={{ x: 1 / scale, y: 1 / scale }}
      />
    </Group>
  );
};
