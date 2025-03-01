import { Camera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

  const newOrbitControl = (camera: Camera, canvas: HTMLElement): OrbitControls =>{
    const controls = new OrbitControls(camera, canvas);
    controls.minDistance = 1;
    controls.maxDistance = 95;
    controls.enablePan = true;
    return controls;
  }

export default newOrbitControl;