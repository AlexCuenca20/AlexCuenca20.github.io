import * as THREE from '../libs/three.module.js'

class Punto extends THREE.Object3D {
    /**
     * Constructor de la clase. Construye un nuevo punto.
     * @param {number} radius Radio del punto.
     */
    constructor(radius) {
        super();

        // Crear material y geometria
        var material = new THREE.MeshPhongMaterial({ color: 0xfeffae });
        var geometry = new THREE.SphereBufferGeometry(radius, 15, 15);

        // Crear mesh y posicionarlo
        var punto = new THREE.Mesh(geometry, material);
        punto.position.y = 0.5;

        this.add(punto);
    }
}

export { Punto }