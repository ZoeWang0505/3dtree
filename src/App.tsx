import { useEffect, useRef, useState, MouseEvent } from 'react';
import './App.css';
import { AxesHelper, CylinderGeometry, GridHelper, Group, MathUtils, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from 'three';
import { createCamera } from './camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Grid2, Slider, Button, Switch, Box } from '@mui/material';

const radiusDefault: number = 0.2;
const levelColor = [0x00ff00, 0xE44C64, 0x3950E6,0x3AE4E6,0xE63A3A,0xE6823A];
const angle: number = 60;
const branchLengthDefault = 20;
const sigmentNumber = 32;
const childLengthScale = 1/3;
const childRadiusSacle = 1/3;
const App = () => {
  const containerRef = useRef<HTMLDivElement>(null); 

  const levelMarks = [
    {
      value: 1,
      label: '1',
    },
    {
      value: 2,
      label: '2',
    },
    {
      value: 3,
      label: '3',
    },
    {
      value: 4,
      label: '4',
    },
    {
      value: 5,
      label: '5',
    },
    {
      value: 6,
      label: '6',
    },
  ];

  const rendererRef = useRef<WebGLRenderer>(
    new WebGLRenderer({ antialias: true })
  )
  const [camera] = useState<PerspectiveCamera>(createCamera());
  const [scene] = useState(new Scene());
  const [branchNumber, setBranchNumber] = useState(6);
  const [level, setLevel] = useState(3);
  const [control, setControl] = useState<OrbitControls|null>(null);
  const myTree = useRef<Group|Mesh| null>(null);
  const [raycaster] = useState(new Raycaster());
  const [addBranch, setAddBranch] = useState(false);
  const [animation, setAnimation] = useState(false);
  const selectedObj = useRef<Group|null>(null); 
  const animateId = useRef<number>(null);

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

  const creatChildBranch = (depth: number, branchNumber: number, parentLength : number, radius: number) : Group | null => {
    if ( depth === 1) return null;
    const child = createBranchs(depth - 1, branchNumber, parentLength * childLengthScale,radius * childLengthScale); 
    const rotationY = new Matrix4().makeRotationY(360 /branchNumber * Math.floor(Math.random() * branchNumber));
    child.applyMatrix4(rotationY);

    const translation = new Matrix4().makeTranslation(0, parentLength / branchNumber * Math.floor(Math.random() * branchNumber), 0);
    child.applyMatrix4(translation); 
    return child;
  }

  const createBranchs = (depth: number, branchNumber: number, parentLength : number, radius: number): Group => {

    if (depth <= 1) {
      const branch = new Group();
        const cylinder = newCylinder(radius, parentLength, depth);
        branch.userData = {depth, parentLength, radius};
        if (depth !== level) {
          const rotation = new Matrix4().makeRotationX(MathUtils.degToRad(30));
          cylinder.applyMatrix4(rotation);
        }
        branch.add(cylinder);
      return branch;
    }

    const childRadius = radius * childRadiusSacle;
    const parentGroup = new Group();
    const parent = newCylinder(radius, parentLength, depth);
    parentGroup.add(parent);
    for (let i = branchNumber; i !== 0; i-=1) {
      const child = createBranchs(depth - 1, branchNumber, parentLength * childLengthScale,childRadius); 
      const rotationY = new Matrix4().makeRotationY(360 /branchNumber * i);
      child.applyMatrix4(rotationY);

      const translation = new Matrix4().makeTranslation(0, parentLength / branchNumber * i, 0);
      child.applyMatrix4(translation); 
      parentGroup.add(child);
    }
    if (level !== depth) {
      const rotation = new Matrix4().makeRotationX(MathUtils.degToRad(30));
      parentGroup.applyMatrix4(rotation);
    }

    parentGroup.userData = {depth, parentLength, radius};
    return parentGroup;
  }

const createTree = (level:number, branchNumber:number) => {
  if (myTree.current !== null) {
    myTree.current?.removeFromParent();
    // TODO: dispose
  }
  myTree.current = createBranchs(level, branchNumber, branchLengthDefault, radiusDefault);
  scene.add(myTree.current);
}
const initScene = () => {
  if (scene.children.length == 0) {
    scene.add(camera);
    scene.add(newGridHelper());
    scene.add(newAxesHelper());
    setControl(newOrbitControl());
  } 
  createTree(level, branchNumber);
}

  useEffect(() => {

    if (containerRef.current !== null) {
      const box = containerRef.current?.getBoundingClientRect();
      camera.updateProjectionMatrix(); // automatically recalculate the frustrum
      rendererRef.current.setSize(box.width, box.height);
      rendererRef.current.setPixelRatio(box.width /box.height);
      rendererRef.current.render(scene, camera);
      containerRef.current?.appendChild(rendererRef.current.domElement);
    }

    const moveBranchs = (branch: Group) => {
      if (branch === null) return;

      branch.children.forEach((child) => {
        if (child.type !== 'mesh') 
          moveBranchs(child as Group);
      })

      const rotationY = new Matrix4().makeRotationY(MathUtils.degToRad(1));
      branch.applyMatrix4(rotationY);
    }


      // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (animation) {
        animateId.current = requestAnimationFrame(animate);
        moveBranchs(myTree.current as Group);
      } else {
        if ( animateId.current !== null) {
          cancelAnimationFrame(animateId.current);
          animateId.current = null;
        }
      }
      rendererRef.current.render(scene, camera);
    }; 

   animate();
   
  }, [animation]);

  useEffect(() => {
    if ( control !== null) {
    if (!addBranch)
        control.enableRotate = true;
    else
        control.enableRotate = false;
    }
  }, [addBranch, control])

  const handleChangeBrancheNumber = (e: Event) =>{
    //@ts-ignore
    const n = e.target?.value;
    setBranchNumber(n);

  }

  const handleChangeDepth = (e: Event) =>{
    //@ts-ignore
    const n = e.target?.value;
    setLevel(n);
  }

  useEffect(() =>{
    initScene();
  }, [level, branchNumber])

  useEffect(() => {
    const HighlightBranch = (obj: Group, highLight: boolean) => {
      if (obj !== null) {

        const mesh = obj.children[0] as Mesh;
        if (highLight) {
          //@ts-ignore
          mesh.material.color.set(0xFFDE59);
        } else {
          //@ts-ignore
          mesh.material.color.set(levelColor[selectedObj.current.userData.depth - 1]);
        }
      }
    }
    const getBranch = (object: Group|Mesh): any => {
      if (object.userData.depth !== undefined) {
        return object;
      }
      if (object.parent !== null && object.parent.type !== 'Scene') {
        return getBranch(object.parent as Group);
      }
      return null;
    }
    const handleOnClick = (event: any) => {
      if (!addBranch || selectedObj.current === null) return;
      
      const {depth, parentLength, radius} = selectedObj.current.userData;
      const branch = creatChildBranch(depth, branchNumber, parentLength, radius);
      if ( branch !== null) {
        selectedObj.current.add(branch);
      }
    }

    const handleMove = (event: any) => {
      if (!addBranch) return;
      const mouse = new Vector2();
      // Convert mouse position to normalized device coordinates (-1 to +1)
      const box = containerRef.current?.getBoundingClientRect();
      if (box === undefined) return;

      mouse.x = ((event.clientX - box.x) / box.width) * 2 - 1;
      mouse.y = (-(event.clientY - box.y) / box.height) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Get the objects intersected by the ray
      const intersects = raycaster.intersectObjects(scene.children);

      let newSelection = null;
      for (let i = 0; i < intersects.length; i++) {
        const object = getBranch(intersects[i].object as Group);
        if (object !== null) {
          newSelection = object;
          break;
        }
      }

        //@ts-ignore
        if ( newSelection !== null) {
            // unselect the object
           if (selectedObj.current !== null && newSelection.uuid === selectedObj.current.uuid) {
            console.log("same obj");
            return;
           } else {
            HighlightBranch(selectedObj.current as Group, false);
            HighlightBranch(newSelection, true);
            selectedObj.current = newSelection;
            return;
          }
        }
        HighlightBranch(selectedObj.current as Group, false);
        selectedObj.current = null;
    }

    containerRef.current?.addEventListener('mousemove', handleMove);
    containerRef.current?.addEventListener('mousedown', handleOnClick);

    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMove);
      containerRef.current?.removeEventListener('mousedown', handleOnClick);
    }

  }, [addBranch])


  return (
    <Grid2 container direction="column" style={{ height: '100vh' }}>
        <Box component={'div'}
            ref={containerRef}
            sx={{
              height: '90vh',
            }}
          >
        </Box>
        <Grid2 container spacing={3} paddingLeft={2}  alignContent={'center'}
        sx={{
        height: '10vh',
        backgroundColor: 'lightgreen',
      }}>
        <Grid2 size={3}>
            Depth
            <Slider
              aria-label="Restricted values"
              defaultValue={level}
              step={1}
              min={1}
              max={6}
              valueLabelDisplay="auto"
              marks={levelMarks}
              onChange={handleChangeDepth}/>
        </Grid2>
        <Grid2 size={3}>
          Number of branches
          <Slider
            aria-label="Restricted values"
            defaultValue={branchNumber}
            step={1}
            min={1}
            max={6}
            valueLabelDisplay="auto"
            marks={levelMarks}
            onChange={handleChangeBrancheNumber}/>
        </Grid2> 
        <Grid2 size={3}>
          Add Branch
          <Switch 
            defaultChecked={addBranch} 
            checked={addBranch} 
            onClick={() => {setAddBranch(!addBranch)}}/>
        </Grid2>
        <Grid2 size={3}>
          <Button         
           sx={{
            backgroundColor: 'ButtonHighlight',
          }}
          onClick={() => {setAnimation(!animation)}}>Animation </Button>
        </Grid2>
      </Grid2>
    </Grid2>
  );
}

export default App;
