import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { AxesHelper, BoxGeometry, ConeGeometry, CylinderGeometry, GridHelper, Group, MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { createCamera } from './camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const radiusDefault: number = 0.2;

const angle: number = 60;
const branchLengthDefault = 20;
const sigmentNumber = 32;
const App = () => {
  const containerRef = useRef<HTMLDivElement>(null); 

  const rendererRef = useRef<WebGLRenderer>(
    new WebGLRenderer({ antialias: true })
  )
  const [camera] = useState<PerspectiveCamera>(createCamera());
  const [scene, setScene] = useState(new Scene());
  const [branchNumber, setBranchNumber] = useState(6);
  const [level, setLevel] = useState(3);
  const [control, setControl] = useState<OrbitControls|null>(null);
  const [myTree, setMyTree] = useState<Group|Mesh| null>(null);

  const newAxesHelper = () => {
    const helper = new AxesHelper(3);
    helper.position.set(-3.5, 0, -3.5);
    return helper;
  }
  const newGridHelper = () => {
    const helper = new GridHelper(6);
    return helper;
  }

  const newOrbitControl = (): OrbitControls =>{
    const controls = new OrbitControls(camera, rendererRef.current.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 95;
    controls.enablePan = true;
    // damping & auto rotation require the controls to be updated each frame
    controls.enableDamping = true;
    return controls;
  }

  const createBranchs = (depth: number, branchNumber: number, parentLength : number, radius: number): Group => {

    if (depth <= 1) {
      const branch = new Group();
        const geometry = new CylinderGeometry(radius,radius * 1.2, parentLength, sigmentNumber);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const cone = new Mesh(geometry, material);
        cone.position.y = parentLength /2;
        branch.add(cone);
      return branch;
    }

    const childRadius = radius * 0.4;
    
    const childLength = parentLength / 2;
    const parent = createBranchs(0, branchNumber, parentLength,radius);
    for (let i = branchNumber; i !== 0; i-=1) {
      const child = createBranchs(depth - 1, branchNumber, childLength,childRadius);
      child.rotation.x = MathUtils.degToRad(angle);  
      child.position.y = parentLength / 6 * i;  
      parent.add(child);
    }
    return parent;
  }

const initScene = () => {
  scene.add(camera);
  scene.add(newGridHelper());
  scene.add(newAxesHelper());
  setControl(newOrbitControl());

  const tree = createBranchs(level, branchNumber, branchLengthDefault, radiusDefault);
  setMyTree(tree);
  scene.add(tree);
  camera.position.z = 5;
}

  useEffect(() => {
   const onResize = () => {
    if (containerRef.current !== null) {
      camera.updateProjectionMatrix(); // automatically recalculate the frustrum
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.render(scene, camera);
    }
   }
   containerRef.current?.appendChild(rendererRef.current.domElement);
   initScene();
   onResize();

   window.addEventListener('resize', onResize);



  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    rendererRef.current.render(scene, camera);
  };
  animate();
  // Clean up on component unmount
  return () => {
    containerRef.current?.removeChild(rendererRef.current.domElement);
    };
  }, []);

  return (
    <div className="App">
      <div className="App-header" ref={containerRef}/>
    </div>
  );
}

export default App;
