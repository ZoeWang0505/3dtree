import { MathUtils, PerspectiveCamera } from 'three';

const createCamera = (): PerspectiveCamera => {
  const camera = new PerspectiveCamera(
    35, // fov = Field Of View
    1, // aspect ratio (dummy value)
    0.1, // near clipping plane
    200 // far clipping plane
  );

  camera.position.set(0, 4, 35);

  return camera;
}

export { createCamera };