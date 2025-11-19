import React, { useRef, useEffect, useState } from 'react';
import { Body } from '../types';
import { updatePhysics } from '../services/physicsUtils';

interface SimulationCanvasProps {
  bodies: Body[];
  setBodies: React.Dispatch<React.SetStateAction<Body[]>>;
  isRunning: boolean;
  gConstant: number;
  timeScale: number;
  width: number;
  height: number;
}

// Helper to project 3D point to 2D screen space
// We use an Orthographic projection for X/Y but track Z for depth sorting
const projectPoint = (
  x: number, 
  y: number, 
  z: number, 
  cx: number, 
  cy: number, 
  zoom: number, 
  yaw: number, 
  pitch: number, 
  panX: number, 
  panY: number
) => {
  // 1. Rotate around Z axis (Yaw)
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const x1 = x * cosYaw - y * sinYaw;
  const y1 = x * sinYaw + y * cosYaw;

  // 2. Rotate around X axis (Pitch)
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  // Standard rotation: y' = y*cos - z*sin, z' = y*sin + z*cos
  // Since input z is usually 0 for our 2D physics plane:
  const y2 = y1 * cosPitch - z * sinPitch; 
  const z2 = y1 * sinPitch + z * cosPitch;

  // 3. Screen Space transform
  // We apply pan offset AFTER rotation (screen-space pan)
  const screenX = cx + panX + x1 * zoom;
  const screenY = cy + panY + y2 * zoom;

  return { x: screenX, y: screenY, z: z2 };
};

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  bodies,
  setBodies,
  isRunning,
  gConstant,
  timeScale,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [fps, setFps] = useState(0);
  const lastTimeRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());

  // Camera State
  const viewRef = useRef({
      offset: { x: 0, y: 0 },
      zoom: 1,
      yaw: 0,   // Rotation around Z (A/D)
      pitch: 0, // Rotation around X (W/S)
      isDragging: false,
      lastPos: { x: 0, y: 0 }
  });
  const [cursor, setCursor] = useState('cursor-grab');

  // Physics State Ref
  const bodiesRef = useRef<Body[]>(bodies);

  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // --- Input Handlers ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
      viewRef.current.isDragging = true;
      viewRef.current.lastPos = { x: e.clientX, y: e.clientY };
      setCursor('cursor-grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!viewRef.current.isDragging) return;
      
      const dx = e.clientX - viewRef.current.lastPos.x;
      const dy = e.clientY - viewRef.current.lastPos.y;
      
      viewRef.current.offset.x += dx;
      viewRef.current.offset.y += dy;
      viewRef.current.lastPos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      viewRef.current.isDragging = false;
      setCursor('cursor-grab');
  };

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const factor = 1 - e.deltaY * zoomSensitivity;
      const newZoom = Math.max(0.1, Math.min(50, viewRef.current.zoom * factor));
      viewRef.current.zoom = newZoom;
  };

  const handleDoubleClick = () => {
      // Reset view
      viewRef.current.offset = { x: 0, y: 0 };
      viewRef.current.zoom = 1;
      viewRef.current.yaw = 0;
      viewRef.current.pitch = 0;
  };

  // --- Rendering ---

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, currentBodies: Body[]) => {
    const { offset, zoom, yaw, pitch } = viewRef.current;
    const cx = width / 2;
    const cy = height / 2;

    // 1. Clear Screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Stars (Static Background)
    // We rotate stars slightly based on yaw to give a sense of turning
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(yaw * 0.1); // Subtle rotation for stars
    ctx.translate(-cx, -cy);
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<80; i++) {
        const x = (Math.sin(i * 132.1) * 43758.5453 % 1) * width;
        const y = (Math.cos(i * 432.1) * 32453.234 % 1) * height;
        if(x < 0) continue;
        const size = (Math.sin(i) + 1) * 0.8;
        ctx.globalAlpha = Math.random() * 0.5 + 0.1;
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // 3. Calculate projected positions for sorting
    const renderList = currentBodies.map(b => {
      const projected = projectPoint(b.position.x, b.position.y, 0, cx, cy, zoom, yaw, pitch, offset.x, offset.y);
      
      // Project trail
      const trailProjected = b.trail.map(p => 
        projectPoint(p.x, p.y, 0, cx, cy, zoom, yaw, pitch, offset.x, offset.y)
      );

      return {
        ...b,
        screenX: projected.x,
        screenY: projected.y,
        depth: projected.z,
        trailProjected
      };
    });

    // Sort by depth (Z). Positive Z is "down/in" depending on rotation, but generally 
    // if we pitch back, the top part of the plane goes "into" the screen (positive Z).
    // We want to draw furthest items first.
    renderList.sort((a, b) => a.depth - b.depth);

    // 4. Draw Content
    renderList.forEach(body => {
        // Draw Trail
        if (body.trailProjected.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = body.color;
            ctx.lineWidth = (body.isPlanet ? 1 : 2) / Math.pow(zoom, 0.2); // Less aggressive line scaling
            ctx.globalAlpha = body.isPlanet ? 0.5 : 0.3;
            
            ctx.moveTo(body.trailProjected[0].x, body.trailProjected[0].y);
            for (let i = 1; i < body.trailProjected.length; i++) {
                ctx.lineTo(body.trailProjected[i].x, body.trailProjected[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Draw Body (Sphere)
        // Note: In Orthographic projection, size doesn't change with depth, 
        // which is cleaner for this type of abstract physics viz.
        ctx.beginPath();
        ctx.arc(body.screenX, body.screenY, body.radius * zoom, 0, 2 * Math.PI);
        ctx.fillStyle = body.color;
        
        // Shadow/Glow
        ctx.shadowBlur = (body.isPlanet ? 5 : 30); // Fixed shadow size looks better in 3D view
        ctx.shadowColor = body.color;
        
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        if (!body.isPlanet && zoom > 0.2) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            const fontSize = Math.max(10, 12); 
            ctx.font = `${fontSize}px monospace`;
            ctx.fillText(body.id, body.screenX + 15, body.screenY - 15);
        }
    });

    // 5. HUD
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.fillText(`Zoom: ${zoom.toFixed(2)}x | Pitch: ${(pitch * 180 / Math.PI).toFixed(0)}° | Yaw: ${(yaw * 180 / Math.PI).toFixed(0)}°`, 10, height - 24);
    ctx.fillText(`Pan: ${offset.x.toFixed(0)}, ${offset.y.toFixed(0)} | FPS: ${fps}`, 10, height - 10);
  };

  const animate = (time: number) => {
    // Calculate FPS
    if (lastTimeRef.current !== 0) {
        const delta = time - lastTimeRef.current;
        setFps(Math.round(1000/delta));
    }
    lastTimeRef.current = time;

    // Update Physics
    if (isRunning) {
        const updatedBodies = updatePhysics(bodiesRef.current, gConstant, 1000, 0.1 * timeScale);
        bodiesRef.current = updatedBodies;
    }

    // Update Camera Rotation from Keys
    const rotSpeed = 0.03;
    if (keysPressed.current.has('a')) viewRef.current.yaw += rotSpeed;
    if (keysPressed.current.has('d')) viewRef.current.yaw -= rotSpeed;
    // Limit pitch to prevent flipping upside down (approx +/- 80 degrees)
    if (keysPressed.current.has('w')) viewRef.current.pitch = Math.min(viewRef.current.pitch + rotSpeed, 1.4);
    if (keysPressed.current.has('s')) viewRef.current.pitch = Math.max(viewRef.current.pitch - rotSpeed, -1.4);

    // Draw
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx, width, height, bodiesRef.current);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, gConstant, timeScale, width, height]); 

  // Sync state for Oracle
  useEffect(() => {
      const interval = setInterval(() => {
          if (isRunning) {
              setBodies(bodiesRef.current);
          }
      }, 500); 
      return () => clearInterval(interval);
  }, [isRunning, setBodies]);


  return (
    <div 
        className={`relative w-full h-full overflow-hidden bg-slate-950 ${cursor}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block touch-none outline-none"
        tabIndex={0} // Make div focusable for key events if needed, though we use window listener
      />
      <div className="absolute top-4 left-4 text-xs text-slate-500 font-mono pointer-events-none select-none space-y-1">
        <div>W/S: Tilt View</div>
        <div>A/D: Rotate View</div>
        <div>Double Click: Reset</div>
        <div>Scroll: Zoom</div>
        <div>Drag: Pan</div>
      </div>
    </div>
  );
};

export default SimulationCanvas;