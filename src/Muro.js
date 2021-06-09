import * as THREE from '../libs/three.module.js'

class Muro extends THREE.Object3D {
    /**
     * Constructor de la clase. Crea un nuevo muro.
     */
    constructor() {
        super();

        // Materiales del muro
        var material = new THREE.MeshLambertMaterial({color: 'blue'});

        // Geometria del muro
        var height = 1;
        var geom = new THREE.BoxBufferGeometry(1, height, 1);
        geom.translate(0, height/2, 0);

        var muro = new THREE.Mesh(geom, material);

        this.add(muro);
    }
}

export { Muro }