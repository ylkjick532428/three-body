import { Body, Vector2, SimulationPreset } from '../types';

const MAX_TRAIL_LENGTH = 150;

export const generateInitialState = (preset: SimulationPreset, canvasWidth: number, canvasHeight: number): Body[] => {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  const createSun = (id: string, x: number, y: number, vx: number, vy: number, mass: number, color: string): Body => ({
    id,
    position: { x, y },
    velocity: { x: vx, y: vy },
    mass,
    radius: Math.sqrt(mass) * 2, // Visual radius
    color,
    trail: [],
    isPlanet: false
  });

  const createPlanet = (x: number, y: number, vx: number, vy: number): Body => ({
    id: 'trisolaris',
    position: { x, y },
    velocity: { x: vx, y: vy },
    mass: 10, // Tiny mass compared to suns
    radius: 5,
    color: '#38bdf8', // Sky blue
    trail: [],
    isPlanet: true
  });

  switch (preset) {
    case SimulationPreset.STABLE_FIGURE_8:
      // Famous stable 3-body solution
      return [
        createSun('sun1', cx + 97.000436, cy - 24.308753, 0.4662036850, 0.4323657300, 1000, '#fbbf24'),
        createSun('sun2', cx - 97.000436, cy + 24.308753, 0.4662036850, 0.4323657300, 1000, '#f87171'),
        createSun('sun3', cx, cy, -2 * 0.4662036850, -2 * 0.4323657300, 1000, '#a78bfa'),
        createPlanet(cx + 50, cy + 50, 0.5, 0.5)
      ];

    case SimulationPreset.HIERARCHICAL:
      // One big sun, one smaller sun orbiting it, one even smaller orbiting that
      return [
        createSun('sun1', cx, cy, 0, 0, 5000, '#fbbf24'), // Big yellow
        createSun('sun2', cx + 300, cy, 0, 3.5, 500, '#f87171'), // Med red
        createSun('sun3', cx + 350, cy, 0, 5.5, 50, '#a78bfa'), // Small purple
        createPlanet(cx + 360, cy, 0, 6.0)
      ];
    
    case SimulationPreset.COLLISION_COURSE:
       return [
        createSun('sun1', cx - 200, cy, 1.5, 0, 1500, '#fbbf24'),
        createSun('sun2', cx + 200, cy, -1.5, 0, 1500, '#f87171'),
        createSun('sun3', cx, cy - 200, 0, 1.5, 1500, '#a78bfa'),
        createPlanet(cx + 10, cy + 10, 0, 0)
       ];

    case SimulationPreset.CHAOTIC_RANDOM:
    default:
      // Totally random positions within a range
      return [
        createSun('sun1', cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, 800 + Math.random() * 400, '#fbbf24'),
        createSun('sun2', cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, 800 + Math.random() * 400, '#f87171'),
        createSun('sun3', cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, 800 + Math.random() * 400, '#a78bfa'),
        createPlanet(cx, cy, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
      ];
  }
};

export const updatePhysics = (bodies: Body[], gConstant: number, softening: number, timeStep: number): Body[] => {
  const newBodies = bodies.map(b => ({ ...b, trail: [...b.trail] })); // Deep copy for immutability

  for (let i = 0; i < newBodies.length; i++) {
    let fx = 0;
    let fy = 0;

    for (let j = 0; j < newBodies.length; j++) {
      if (i === j) continue;

      const b1 = newBodies[i];
      const b2 = newBodies[j];

      const dx = b2.position.x - b1.position.x;
      const dy = b2.position.y - b1.position.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // F = G * m1 * m2 / r^2
      // We use a softening parameter to avoid infinite forces at distance 0
      const f = (gConstant * b1.mass * b2.mass) / (distSq + softening);

      const cos = dx / dist;
      const sin = dy / dist;

      fx += f * cos;
      fy += f * sin;
    }

    const b = newBodies[i];
    // a = F / m
    const ax = fx / b.mass;
    const ay = fy / b.mass;

    // Update Velocity
    b.velocity.x += ax * timeStep;
    b.velocity.y += ay * timeStep;
  }

  // Update Positions and Trails
  for (const b of newBodies) {
    b.position.x += b.velocity.x * timeStep;
    b.position.y += b.velocity.y * timeStep;

    // Update trail
    if (Math.random() > 0.7) { // Don't save every frame to save memory
        b.trail.push({ x: b.position.x, y: b.position.y });
        if (b.trail.length > MAX_TRAIL_LENGTH) {
            b.trail.shift();
        }
    }
  }

  return newBodies;
};