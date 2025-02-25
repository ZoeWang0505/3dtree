import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { AxesHelper, GridHelper, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { createCamera } from './camera';

const App = () => {
  const containerRef = useRef<HTMLDivElement>(null); 

  const rendererRef = useRef<WebGLRenderer>(
    new WebGLRenderer({ antialias: true })
  )
  const [camera] = useState<PerspectiveCamera>(createCamera());
  const [scene, setScene] = useState(new Scene());

  const newAxesHelper = () => {
    const helper = new AxesHelper(3);
    helper.position.set(-3.5, 0, -3.5);
    return helper;
  }
  const newGridHelper = () => {
    const helper = new GridHelper(6);
    return helper;
  }

  const initScene = () => {
    scene.add(camera);
    scene.add(newGridHelper());
    scene.add(newAxesHelper());
    rendererRef.current.render(scene, camera);
  }

  useEffect(() => {
   const onResize = () => {
    if (containerRef.current !== null) {
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix(); // automatically recalculate the frustrum
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.render(scene, camera);
    }
   }
   containerRef.current?.appendChild(rendererRef.current.domElement);
   initScene();
   onResize();

   window.addEventListener('resize', onResize);

  }, []);

  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <div className="App-header" ref={containerRef}/>
    </div>
  );
}

export default App;
