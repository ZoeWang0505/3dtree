import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CylinderGeometry, Group, MathUtils, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from 'three';
import { createCamera } from './camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Grid2, Slider, Button, Switch, Box } from '@mui/material';
import { newAxesHelper, newGridHelper } from './helper';
import newOrbitControl from './control';
import { branchLengthDefault, childLengthScale, childRadiusSacle, levelColor, radiusDefault, sigmentNumber } from './constants';


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

  /**
   * Initialize fr the canvas
   */
  useEffect(() => {

    if (containerRef.current !== null) {
      const box = containerRef.current?.getBoundingClientRect();
      camera.updateProjectionMatrix(); // automatically recalculate the frustrum
      rendererRef.current.setSize(box.width, box.height);
      rendererRef.current.setPixelRatio(box.width /box.height);
      rendererRef.current.render(scene, camera);
      containerRef.current?.appendChild(rendererRef.current.domElement);
    }

      // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      rendererRef.current.render(scene, camera);
    }; 

   animate();
   
  }, []);


    //recursion functions for creating branches
  
    const createRootBranch = (depth: number, length: number, radius: number): Group => {
      const branch = new Group();
  
      const geometry = new CylinderGeometry(radius,radius * 1.2, length, sigmentNumber);
      const material = new MeshBasicMaterial({ color: levelColor[depth -1] });
      const cylinder = new Mesh(geometry, material);
      const translation = new Matrix4().makeTranslation(0, length/2, 0);
      cylinder.applyMatrix4(translation);
  
      branch.add(cylinder);
      branch.userData = {depth, length, radius};
      if (level !== depth) {
        const rotation = new Matrix4().makeRotationX(MathUtils.degToRad(30));
        branch.applyMatrix4(rotation);
      }
      return branch;
    }
  
  
    const creatChildBranch = (depth: number, branchNumber: number, parentLength : number, radius: number, order: number = -1) : Group | null => {
      const child = createBranchs(depth - 1, branchNumber, parentLength * childLengthScale,radius * childLengthScale); 
      const rotationY = new Matrix4().makeRotationY(360 /branchNumber * (order == -1 ? Math.floor(Math.random() * branchNumber): order));
      child.applyMatrix4(rotationY);
  
      const translation = new Matrix4().makeTranslation(0, parentLength / branchNumber * (order == -1 ? Math.floor(Math.random() * branchNumber): order), 0);
      child.applyMatrix4(translation); 
      return child;
    }
  
    const createBranchs = (depth: number, branchNumber: number, parentLength : number, radius: number): Group => {
      const root = createRootBranch(depth, parentLength, radius);
      if (depth > 1) {
        for (let i = branchNumber; i !== 0; i-=1) {
          const child = creatChildBranch(depth, branchNumber, parentLength, radius, i);
          if (child !== null)
            root.add(child);
        }
      }
      return root;
    }


  /**
   * changing branch number
   */
  const handleChangeBrancheNumber = (e: Event) =>{
    //@ts-ignore
    const n = e.target?.value;
    setBranchNumber(n);

  }

  /**
   * changing depth number
   */
  const handleChangeDepth = (e: Event) =>{
    //@ts-ignore
    const n = e.target?.value;
    setLevel(n);
  }

  /**Task1: create tree by given depth and number of branch
   * when depth or branch number changed, regenerate the branches 
   */
  useEffect(() =>{

    if (scene.children.length == 0) {
      scene.add(camera);
      scene.add(newGridHelper());
      scene.add(newAxesHelper());
      setControl(newOrbitControl(camera, rendererRef.current.domElement));
    } 

    const createTree = (level:number, branchNumber:number) => {
      if (myTree.current !== null) {
        myTree.current?.removeFromParent();
        // TODO: dispose
      }
      myTree.current = createBranchs(level, branchNumber, branchLengthDefault, radiusDefault);
      scene.add(myTree.current);
    }
    createTree(level, branchNumber);

  }, [level, branchNumber])


  /**
   * Task2: add branch on a parent branch
   * Hover on a branch, it will be highlighted
   * Click on the branch, a new child branch will be added to it
   */
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
      
      const {depth, length, radius} = selectedObj.current.userData;
      if (depth > 1) {
        const branch = creatChildBranch(depth, branchNumber, length,radius); 
        if ( branch !== null) {
          selectedObj.current.add(branch);
        }
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


  /**
   * task3: for making animation
   */
  useEffect( () => {
    const moveBranchs = (branch: Group) => {
      if (branch === null) return;

      branch.children.forEach((child) => {
        if (child.type !== 'mesh') 
          moveBranchs(child as Group);
      })

      const rotationY = new Matrix4().makeRotationY(MathUtils.degToRad(1));
      branch.applyMatrix4(rotationY);
    }

    const play = () => {
      animateId.current = requestAnimationFrame(play);
      moveBranchs(myTree.current as Group);
    }

    const stop = () => {
      if ( animateId.current !== null) {
        cancelAnimationFrame(animateId.current);
        animateId.current = null;
      }
    }

    if (animation) {
      play();
    } else {
      stop();
    }
  }, [animation])

  useEffect(() => {
    if ( control !== null) {
    if (!addBranch)
        control.enableRotate = true;
    else
        control.enableRotate = false;
    }
  }, [addBranch, control])

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
          onClick={() => {setAnimation(!animation)}}>{animation?"Stop": "Play" } </Button>
        </Grid2>
      </Grid2>
    </Grid2>
  );
}

export default App;
