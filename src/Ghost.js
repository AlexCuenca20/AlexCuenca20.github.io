import * as THREE from '../libs/three.module.js'
import * as TWEEN from '../libs/tween.esm.js'
import { ThreeBSP } from '../libs/ThreeBSP.js'
import { Modelo3D } from './Modelo3D.js';
import { orientaciones } from './Orientacion.js';
import { OBJLoader} from '../libs/OBJLoader.js';

class Fantasma extends Modelo3D {
  constructor(velocidad, colorFantasma) {
    super(velocidad, orientaciones.RIGHT);

    this.spawned = false;

    // Indica si el fantasma puede ser comido o no
    this.vulnerable = false;

    // Establecemos el material del fantasma en función de su color
    this.materialFantasma = new THREE.MeshPhongMaterial({ color: colorFantasma });
    // Establecemos también los colores del fantasma cuando es vulnerable
    this.materialVulnerable = new THREE.MeshPhongMaterial({color: 0x0037C2});

    var that = this;
    var objectLoader = new OBJLoader();
    objectLoader.load('../models/ghost3.obj',
        function(object){
            object.traverse( function ( obj ) {
              if ( obj instanceof THREE.Mesh ) {
                  obj.material = that.materialFantasma;
                }
              } 
            );

            that.modelo = object;

            that.add (that.modelo);
        }, 
        null, 
        null
    );

    this.tiempoAnterior = Date.now();
    this.rotation.x = -Math.PI / 2;
  }

  getSpawned() {
    return this.spawned;
  }

  setSpawned(spawned) {
    this.spawned = spawned;
  }

  getVulnerable() {
    return this.vulnerable;
  }

  setVulnerable(vulnerable){
    this.vulnerable = vulnerable;

    if(this.vulnerable){
      document.getElementById("pacFury").style.display = "block";
    }
  }

  update() {
    var tiempoActual = Date.now();
    var segundos = (tiempoActual - this.tiempoAnterior)/1000;

    if (this.spawned) {
      switch(this.orientacion) {
        case orientaciones.UP:
          this.rotation.z = Math.PI;
          break;
        case orientaciones.DOWN:
          this.rotation.z = 0;
          break;
        case orientaciones.LEFT:
          this.rotation.z = -Math.PI / 2;
          break;
        case orientaciones.RIGHT:
          this.rotation.z = Math.PI / 2;
          break;
      }
      
      // Obtener incremento en la distancia recorrida desde la ultima actualizacion
      switch(this.getOrientacion()) {
        case orientaciones.UP:
          this.position.z -= segundos * this.velocidad;
          break;
        case orientaciones.RIGHT:
          this.position.x += segundos * this.velocidad;
          break;
        case orientaciones.DOWN:
          this.position.z += segundos * this.velocidad;
          break;
        case orientaciones.LEFT:
          this.position.x -= segundos * this.velocidad;
          break;
      }
    }

    this.tiempoAnterior = tiempoActual;
  }
}

export { Fantasma };