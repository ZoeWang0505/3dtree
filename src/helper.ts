import { AxesHelper, GridHelper } from "three";

const newAxesHelper = () => {
    const helper = new AxesHelper(3);
    helper.position.set(-3.5, 0, -3.5);
    return helper;
  }

  const newGridHelper = () => {
    const helper = new GridHelper(6);
    return helper;
  }

  export {
    newAxesHelper,
    newGridHelper
  }