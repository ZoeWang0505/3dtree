import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { AxesHelper, BoxGeometry, ConeGeometry, CylinderGeometry, GridHelper, Group, MathUtils, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { createCamera } from './camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Button from '@mui/material/Button';

const radiusDefault: number = 0.2;
const levelColor = [0x00ff00, 0xE44C64, 0x3950E6,0x3AE4E6,0xE63A3A,0xE6823A];
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
  const [level, setLevel] = useState(5);
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

  const newCylinder= (radius:number, length:number, colorLevel: number) => {
    const geometry = new CylinderGeometry(radius,radius * 1.2, length, sigmentNumber);
    const material = new MeshBasicMaterial({ color: levelColor[colorLevel -1] });
    const cylinder = new Mesh(geometry, material);
    const translation = new Matrix4().makeTranslation(0, length/2, 0);
    cylinder.applyMatrix4(translation);
    return cylinder;
  }

  const createBranchs = (depth: number, branchNumber: number, parentLength : number, radius: number): Group => {

    if (depth <= 1) {
      const branch = new Group();
        const cylinder = newCylinder(radius, parentLength, depth);
        branch.userData = {depth};
        const rotation = new Matrix4().makeRotationX(MathUtils.degToRad(60));
        cylinder.applyMatrix4(rotation);
        branch.add(cylinder);
      return branch;
    }

    const childRadius = radius * 0.4;
    const parentGroup = new Group();
    const parent = newCylinder(radius, parentLength, depth);
    parentGroup.add(parent);
    for (let i = branchNumber; i !== 0; i-=1) {
      const child = createBranchs(depth - 1, branchNumber, parentLength /2,childRadius); 
      const rotation = new Matrix4().makeRotationY(360 * Math.random());
      child.applyMatrix4(rotation);

      const translation = new Matrix4().makeTranslation(0, parentLength / branchNumber * i, 0);
      child.applyMatrix4(translation); 
      parentGroup.add(child);
    }
    if (level !== depth) {
      const rotation = new Matrix4().makeRotationX(MathUtils.degToRad(60));
      parentGroup.applyMatrix4(rotation);
    }

    return parentGroup;
  }

const initScene = () => {
  if (scene.children.length == 0) {
    scene.add(camera);
    scene.add(newGridHelper());
    scene.add(newAxesHelper());
    setControl(newOrbitControl());
  } 

  if (myTree !== null) {
    myTree.removeFromParent();
    // TODO: dispose
  }
  const tree = createBranchs(level, branchNumber, branchLengthDefault, radiusDefault);
  setMyTree(tree);
  scene.add(tree);
  camera.position.z = 10;
}

  useEffect(() => {

    if (containerRef.current !== null) {
      camera.updateProjectionMatrix(); // automatically recalculate the frustrum
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.render(scene, camera);
    }

  //  window.addEventListener('resize', onResize);
  // Clean up on component unmount
  // return () => {
  //   containerRef.current?.removeChild(rendererRef.current.domElement);
  //   };
  }, []);
  
  useEffect(() => {
      initScene();
  }, []);

  useEffect(() => {
    containerRef.current?.appendChild(rendererRef.current.domElement);
      // Animation loop
   const animate = () => {
     requestAnimationFrame(animate);
     rendererRef.current.render(scene, camera);
   }; 
   animate();
  }, [])

  const handleClick = () =>{
    if (myTree !== null && myTree !== undefined) {
      myTree.rotation.z += 0.01;
    }
  }

  return (
    <div className="App">
      <Button variant="text" onClick={handleClick}>Play</Button>
      <div className="App-header" ref={containerRef}/>
    </div>
  );
}

export default App;
