import * as THREE from '../libs/three.module.js'
import * as TWEEN from '../libs/tween.esm.js'
import { ThreeBSP } from '../libs/ThreeBSP.js'
import { Modelo3D } from './Modelo3D.js';
import { orientaciones } from './Orientacion.js';
import { Game } from './Game.js';

class PacMan extends Modelo3D {
  constructor(velocidad) {
    super(velocidad, orientaciones.LEFT);

    this.bocaAbre = true;

    var esfera = new THREE.SphereGeometry(4, 32, 32, Math.PI, 6 / 4 * Math.PI);
    var esfera2 = new THREE.SphereGeometry(4, 32, 32, 0, Math.PI / 2);
    var esferaOjo = new THREE.SphereGeometry(1, 32, 32);
    var esferaOjo2 = new THREE.SphereGeometry(1, 32, 32);

    esfera.rotateX(-Math.PI / 2);
    esfera.rotateZ(-Math.PI / 2);
    esfera2.rotateX(-Math.PI / 2);
    esfera2.rotateZ(Math.PI);
    esferaOjo.translate(2, 2, 2);
    esferaOjo2.translate(2, 2, -2);

    var esferaBSP = new ThreeBSP(esfera);
    var esferaOjoBSP = new ThreeBSP(esferaOjo);
    var esferaOjo2BSP = new ThreeBSP(esferaOjo2);
    var esferaParcialBSP = esferaBSP.subtract(esferaOjoBSP);
    var esferaFinBSP = esferaParcialBSP.subtract(esferaOjo2BSP);

    this.materialFury = new THREE.MeshPhongMaterial({ color: 0xac060a });
    this.materialPac = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    this.materialPac.flatShading = true;
    this.materialPac.side = THREE.DoubleSide;

    this.cuerpo = esferaFinBSP.toMesh(this.materialPac);
    this.boca = new THREE.Mesh(esfera2, this.materialPac);

    this.esferaBoca = new THREE.Object3D();
    this.esferaBoca.add(this.boca);

    this.esfera = new THREE.Object3D();
    this.esfera.add(this.cuerpo);

    this.comecocos = new THREE.Object3D();
    this.comecocos.add(this.esferaBoca);
    this.comecocos.add(this.esfera);

    this.comecocos.position.y += 4;

    this.add(this.comecocos);

    this.tiempoAnterior = Date.now();

    this.velocidadBoca = 2.0;

    this.sonidoMovimiento = new Audio("sounds/pacman_chomp.wav");
    this.sonidoMovimiento.preload = "auto";
    this.sonidoMovimiento.volume = 0.3;
  }

  setFury(fantasmasVulnerables){
    if(fantasmasVulnerables){
      this.cuerpo.material = this.materialFury;
      this.boca.material = this.materialFury;

      if(this.velocidad < this.MAX_PACMAN_SPEED){
        this.velocidad += this.SPEED_INCREMENT;
      }

    } else{
      this.cuerpo.material = this.materialPac;
      this.boca.material = this.materialPac;

      this.cuerpo.material.needsUpdate = true;
      this.boca.material.needsUpdate = true;

      this.velocidad = this.PACMAN_SPEED;
    }
  }

  update(colision) {
    var tiempoActual = Date.now();
    var segundos = (tiempoActual - this.tiempoAnterior)/1000;

    this.updateOrientacion();

    if(!colision){
      if(this.bocaAbre){
        this.esferaBoca.rotation.z -= segundos * this.velocidadBoca;

        if(this.esferaBoca.rotation.z <= -Math.PI/3){
            this.bocaAbre = false;
        }
      } else{
        this.esferaBoca.rotation.z += segundos * this.velocidadBoca;
        
        if(this.esferaBoca.rotation.z >= -0.05){
            this.bocaAbre = true;
        }
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

      this.sonidoMovimiento.play();
    } else{
      this.sonidoMovimiento.pause();
    }

    this.tiempoAnterior = tiempoActual;
  }
}

export { PacMan };