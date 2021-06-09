import * as THREE from '../libs/three.module.js'
import { orientaciones } from './Orientacion.js';

/**
 * Clase base que representa un personaje 3D.
 */
 class Modelo3D extends THREE.Object3D {
    /**
     * Constructor de la clase. Crea un nuevo personaje 3D.
     * @param {number} velocidad Velocidad del personaje.
     * @param {orientation} orientacion Orientacion del personaje.
     */
    constructor(velocidad, orientacion) {
        super();

        this.SPEED_INCREMENT = 1;
        this.MAX_PACMAN_SPEED = 6;
        this.MAX_GHOST_SPEED = 5;
        this.PACMAN_SPEED = 3;

        this.velocidad = velocidad;
        this.orientacion = orientacion;

        // Se obtiene tambien el tiempo en el que se ha creado el objeto
        // Se usa en los metodos update() de las clases derivadas.
        this.lastUpdateTime = Date.now();
    }

    getOrientacion() {
        return this.orientacion;
    }

    setOrientacion(orientacion) {
        this.orientacion = orientacion;
    }

    getVelocidad() {
        return this.velocidad;
    }

    setVelocidad(velocidad) {
        this.velocidad = velocidad;
    }

    /**
     * Metodo para actualizar la orientacion. Se utiliza en el metodo update()
     * de las clases derivadas para orientar correctamente al personaje.
     */
    updateOrientacion() {
        switch(this.orientacion) {
            case orientaciones.UP:
                this.rotation.y = Math.PI / 2;
                break;
            case orientaciones.DOWN:
                this.rotation.y = -Math.PI / 2;
                break;
            case orientaciones.LEFT:
                this.rotation.y = Math.PI;
                break;
            case orientaciones.RIGHT:
                this.rotation.y = 0;
                break;
        }
    }
}

export { Modelo3D }