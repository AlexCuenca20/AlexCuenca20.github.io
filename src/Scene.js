
/// La clase fachada del modelo
/**
 * Usaremos una clase derivada de la clase Scene de Three.js para llevar el control de la escena y de todo lo que ocurre en ella.
 */

 import * as THREE from '../libs/three.module.js'
 import * as TWEEN from '../libs/tween.esm.js';
 
 
 // Clases de mi proyecto
 
 import { PacMan } from './PacMan.js';
 import { Fantasma } from './Ghost.js';
 import { Muro } from './Muro.js';
 import { Punto } from './Punto.js';
 import { Game } from './Game.js';
 import { orientaciones } from './Orientacion.js';

 class MyScene extends THREE.Scene {
  constructor (myCanvas) {
    super();
    
    // Lo primero, crear el visualizador, pasándole el lienzo sobre el que realizar los renderizados.
    this.renderer = this.createRenderer(myCanvas);

    // Creamos el objeto con la información del juego
    this.game = new Game();

    this.comienzaJuego = false;

    this.botonPPulsado = false;

    // Puntos de spawn del PacMan y de los fantasmas
    this.pacmanSpawn = new THREE.Vector3(0, 0, 0);
    this.fantasmaSpawn = new THREE.Vector3(0, 0, 0);

    // Creamos el mapa
    this.map = [];
    this.createMap();

    this.spawnearPacman();

    this.fantasmas = [];
    this.spawnearFantasmas();

    // Todo elemento que se desee sea tenido en cuenta en el renderizado de la escena debe pertenecer a esta. Bien como hijo de la escena (this en esta clase) o como hijo de un elemento que ya esté en la escena.
    // Tras crear cada elemento se añadirá a la escena con   this.add(variable)
    this.createLights ();
    
    // Tendremos una cámara con un control de movimiento con el ratón
    this.createCamera ();

    this.deletePacman();
    this.deleteFantasmas();

    this.fantasmas.forEach((fantasma) => {
      this.remove(fantasma);
    });    

    document.getElementById('puntuacion').textContent = 'Score: ' + this.game.getScore();

    // Crear imagenes que representan la vida
    for (let i = 0; i < this.game.getRemainingLives(); i++) {
        let life = document.createElement("img");
        life.src = "img/pacman_icon.png";
        document.getElementById("vidas").appendChild(life);
    }

    //ANIMACIONES
    var inicioVulnerables = {x: 0};
    var finAnimacion = {x: 1};

    this.pacmanFurioso = new TWEEN.Tween(inicioVulnerables)
      .to(finAnimacion, 8000)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        console.log("Furia activada");
      })
      .onComplete(() => {
          console.log("Furia desactivada");
          this.fantasmas.forEach((fantasma) => {
            fantasma.setVulnerable(false);
          });
          this.pacman.setFury(false);
          document.getElementById("pacFury").style.display = "none";
      });
  }
  
  createCamera () {    
    // Crear camara en perspectiva que seguira al PacMan
    // Posicionarla, indicar hacia donde mira e insertarla en la escena
    this.pacmanCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    // También se indica dónde se coloca
    this.pacmanCamera.position.set(this.pacman.position.x, 3, this.pacman.position.z+2.75);
    this.pacmanCamera.lookAt(this.pacman.position);
    this.add(this.pacmanCamera);

    this.terceraPersona = false;

    // Crear camara en perspectiva que seguira al PacMan
    // Posicionarla, indicar hacia donde mira e insertarla en la escena
    this.camera= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // También se indica dónde se coloca
    this.camera.position.set(this.pacman.position.x, 20, this.pacman.position.z+10);
    this.camera.lookAt(this.pacman.position);
    this.add(this.camera);

    // Obtener tamaños de las vistas en los ejes X, Y
    var viewSizeX = this.map[0].length;
    var viewSizeY = this.map.length; 

    // Crear camara ortogonal, posicionarla correctamente para que mire hacia abajo
    // e insertarla en la escena
    this.mapCamera = new THREE.OrthographicCamera(-viewSizeX / 2, viewSizeX / 2, viewSizeY / 2, - viewSizeY / 2, 1, 1000);
    
    this.mapCamera.position.set(13.5, 4, 16);
    this.mapCamera.lookAt(13.5, 0, 16);
    this.add(this.mapCamera);
  }
  
  createLights () {
    // Se crea una luz ambiental, evita que se vean complentamente negras las zonas donde no incide de manera directa una fuente de luz
    // La luz ambiental solo tiene un color y una intensidad
    // Se declara como   var   y va a ser una variable local a este método
    //    se hace así puesto que no va a ser accedida desde otros métodos
    var ambientLight = new THREE.AmbientLight(0xccddee, 0.35);
    // La añadimos a la escena
    this.add (ambientLight);
    
    // Se crea una luz focal que va a ser la luz principal de la escena
    // La luz focal, además tiene una posición, y un punto de mira
    // Si no se le da punto de mira, apuntará al (0,0,0) en coordenadas del mundo
    // En este caso se declara como   this.atributo   para que sea un atributo accesible desde otros métodos.
    this.spotLight = new THREE.SpotLight( 0xffffff, 0.5 );
    this.spotLight.position.set( 60, 60, 40 );
    this.add (this.spotLight);
  }

  createMap() {
    var that = this;

    this.game.getLevelMap().forEach(function(item, z) {

      let row = [];

      for (let x = 0; x < item.length; x++) {
          let cell = item.charAt(x);
          row.push(cell);

          if (cell === '#') {
            that.createWall(x, z);
          } else if (cell === '.') {
            that.createDot(x, z);
          } else if (cell === 'o') {
            that.createPowerPellet(x, z);
          } else if (cell === 'P') {
            that.pacmanSpawn.x = x;
            that.pacmanSpawn.z = z;
          } else if (cell === 'G') {
            that.fantasmaSpawn.x = x;
            that.fantasmaSpawn.z = z;
          }
      }

      that.map.push(row);
    });
  }

  createWall(x, z) {
    var wallMesh = new Muro();
    wallMesh.position.set(x, 0, z);
    wallMesh.name = "wall_" + z + "_" + x;
    this.add(wallMesh);
  }

  createDot(x, z) {
    var punto = new Punto(0.1);
    punto.position.set(x, 0, z);
    punto.name = "punto_" + z + "_" + x;
    this.add(punto);
    this.game.increaseRemainingDots();
  }

  createPowerPellet(x, z) {
      var puntoGrande = new Punto(0.2);
      puntoGrande.position.set(x, 0, z);
      puntoGrande.name = "punto_grande_" + z + "_" + x;
      this.add(puntoGrande);
      this.game.increaseRemainingDots();
  }
  
  spawnFantasma(fantasma) {
    // Establecer que el fantasma ha spawneado
    fantasma.setSpawned(true);

    // Establecer velocidad
    fantasma.setVelocidad(this.game.getFantasmaSpeed());
  }

  respawnFantasma(fantasma){
    fantasma.position.set(this.fantasmaSpawn.x, 0, this.fantasmaSpawn.z);
    this.spawnFantasma(fantasma);
  }

  createRenderer (myCanvas) {
    // Se recibe el lienzo sobre el que se van a hacer los renderizados. Un div definido en el html.
    
    // Se instancia un Renderer   WebGL
    var renderer = new THREE.WebGLRenderer();
    
    // Se establece un color de fondo en las imágenes que genera el render
    renderer.setClearColor(new THREE.Color(0x000000), 1.0);
    
    // Se establece el tamaño, se aprovecha la totalidad de la ventana del navegador
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // La visualización se muestra en el lienzo recibido
    $(myCanvas).append(renderer.domElement);
    
    return renderer;  
  }
  
  getCamera (camera) {
    // Devolvemos la cámara de PacMan o la cámara del minimapa en función del argumento
    if(camera === 'P'){
      return this.pacmanCamera;
    } else if(camera === 'M'){
      return this.mapCamera;
    } else if(camera === 'C'){
      return this.camera;
    }
  }
  
  setCameraAspect (ratio) {
    // Cada vez que el usuario modifica el tamaño de la ventana desde el gestor de ventanas de
    // su sistema operativo hay que actualizar el ratio de aspecto de la cámara
    this.pacmanCamera.aspect = ratio;
    // Y si se cambia ese dato hay que actualizar la matriz de proyección de la cámara
    this.pacmanCamera.updateProjectionMatrix();

    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();

    // La camara ortogonal tiene un ratio de aspecto de 1 (es cuadrada)
    this.mapCamera.aspect = 1;
    this.mapCamera.updateProjectionMatrix();
  }
  
  onWindowResize () {
    // Este método es llamado cada vez que el usuario modifica el tamaño de la ventana de la aplicación
    // Hay que actualizar el ratio de aspecto de la cámara
    this.setCameraAspect (window.innerWidth / window.innerHeight);
    
    // Y también el tamaño del renderizador
    this.renderer.setSize (window.innerWidth, window.innerHeight);
  }

  onKeyDown(event) {
    var key = event.which;

    // Obtener orientacion anterior y establecer booleano para ajustar la
    // posicion del PacMan
    var prevorientacion = this.pacman.getOrientacion();
    var adjustPosition = false;

    // Procesar el movimiento del personaje
    if(!this.terceraPersona){
      switch(String.fromCharCode(key).toUpperCase()) {
        case "A":
          this.pacman.setOrientacion(orientaciones.LEFT);
          adjustPosition = prevorientacion != orientaciones.RIGHT && prevorientacion != orientaciones.LEFT;
          break;
        case "S":
          this.pacman.setOrientacion(orientaciones.DOWN);
          adjustPosition = prevorientacion != orientaciones.UP && prevorientacion != orientaciones.DOWN;
          break;
        case "D":
          this.pacman.setOrientacion(orientaciones.RIGHT);
          adjustPosition = prevorientacion != orientaciones.LEFT && prevorientacion != orientaciones.RIGHT;
          break;
        case "W":
          this.pacman.setOrientacion(orientaciones.UP);
          adjustPosition = prevorientacion != orientaciones.DOWN && prevorientacion != orientaciones.UP;
          break;
        case "C":
          this.terceraPersona = !this.terceraPersona;
          break;
        case "P":
          if(!this.botonPPulsado){
            this.game.getSonidoInicio().play();

            document.getElementById("botonInicio").style.display = "none";
            
            this.spawnearPacman();
            this.spawnearFantasmas();
            
            this.comienzaJuego = true;
            this.botonPPulsado = true;
          }
          break;
      }
    } else{
        switch(String.fromCharCode(key).toUpperCase()) {
          case "S":
            switch(this.pacman.getOrientacion()) {
              case orientaciones.UP:
                this.pacman.setOrientacion(orientaciones.DOWN);
                adjustPosition = prevorientacion != orientaciones.UP && prevorientacion != orientaciones.DOWN;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.LEFT);
                adjustPosition = prevorientacion != orientaciones.RIGHT && prevorientacion != orientaciones.LEFT;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.UP);
                adjustPosition = prevorientacion != orientaciones.DOWN && prevorientacion != orientaciones.UP;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                adjustPosition = prevorientacion != orientaciones.LEFT && prevorientacion != orientaciones.RIGHT;
                break;
            }
            break;
          case "A":
            switch(this.pacman.getOrientacion()) {
              case orientaciones.UP:
                this.pacman.setOrientacion(orientaciones.LEFT);
                adjustPosition = prevorientacion != orientaciones.RIGHT && prevorientacion != orientaciones.LEFT;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.UP);
                adjustPosition = prevorientacion != orientaciones.DOWN && prevorientacion != orientaciones.UP;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                adjustPosition = prevorientacion != orientaciones.LEFT && prevorientacion != orientaciones.RIGHT;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.DOWN);
                adjustPosition = prevorientacion != orientaciones.UP && prevorientacion != orientaciones.DOWN;
                break;
            }
            break;
          case "D":
            switch(this.pacman.getOrientacion()) {
              case orientaciones.UP:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                adjustPosition = prevorientacion != orientaciones.LEFT && prevorientacion != orientaciones.RIGHT;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.DOWN);
                adjustPosition = prevorientacion != orientaciones.UP && prevorientacion != orientaciones.DOWN;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.LEFT);
                adjustPosition = prevorientacion != orientaciones.RIGHT && prevorientacion != orientaciones.LEFT;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.UP);
                adjustPosition = prevorientacion != orientaciones.DOWN && prevorientacion != orientaciones.UP;
                break;
            }
            break;
          case "C":
            this.terceraPersona = !this.terceraPersona;
            break;
          }
    }

    // Se ajusta la posicion del personaje redondeandola si se ha producido
    // un giro en una direccion perpendicular a la que tenia anteriormente
    if (adjustPosition) {
       this.pacman.position.round();
    }

    if(document.getElementById("muerte").style.display == "block"){
      document.getElementById("muerte").style.display = "none";
    }
    
  }

  renderViewport(scene, camera, left, top, width, height, squareView) {
    var l, w, t, h;
    
    // Obtener pixeles sin normalizar
    if (squareView) {
        l = left * window.innerHeight;
        t = top * window.innerHeight;

        w = width * window.innerHeight;
        h = height * window.innerHeight;            
    } else {
        l = left * window.innerWidth;
        t = top * window.innerHeight;

        w = width * window.innerWidth;
        h = height * window.innerHeight;
    };

    // Indicar al renderer qué viewport debe usar y recortar el resto
    // de la imagen
    this.renderer.setViewport(l, t, w, h);
    this.renderer.setScissor(l, t, w, h);
    this.renderer.setScissorTest(true);

    // Actualizar ratio de aspecto y matriz de proyeccion de la camara
    camera.aspect = w/h;
    camera.updateProjectionMatrix();

    // Visualizar escena segun la camara
    this.renderer.render(scene, camera);
  }

  updateCamera() {
    if(this.terceraPersona){
      switch(this.pacman.getOrientacion()){
        case orientaciones.UP:
          this.pacmanCamera.position.set(this.pacman.position.x, 3, this.pacman.position.z+2.75);
          this.pacmanCamera.lookAt(this.pacman.position);
          break;
        case orientaciones.DOWN:
          this.pacmanCamera.position.set(this.pacman.position.x, 3, this.pacman.position.z-2.75);
          this.pacmanCamera.lookAt(this.pacman.position);
          break;
        case orientaciones.LEFT:
          this.pacmanCamera.position.set(this.pacman.position.x+2.75, 3, this.pacman.position.z);
          this.pacmanCamera.lookAt(this.pacman.position);
          break;
        case orientaciones.RIGHT:
          this.pacmanCamera.position.set(this.pacman.position.x-2.75, 3, this.pacman.position.z);
          this.pacmanCamera.lookAt(this.pacman.position);
          break;
      }
    } else{
      this.camera.position.set(this.pacman.position.x, 20, this.pacman.position.z+10);
      this.camera.lookAt(this.pacman.position);
    }
  }

  moverFantasma(fantasma){
    var orientacion = fantasma.getOrientacion();
    
    var cambioOrientacion = [orientaciones.UP, orientaciones.DOWN, orientaciones.LEFT, orientaciones.RIGHT];

    if (this.colisionWall(fantasma.position, fantasma.getOrientacion()))
    {
          var nuevaOrientacion = cambioOrientacion[Math.floor(Math.random() * cambioOrientacion.length)];

          if (nuevaOrientacion != orientacion) {
            fantasma.setOrientacion(nuevaOrientacion);
            fantasma.position.round();
          }
        }
  }

  updateFantasmas() {
    var that = this;
    that.fantasmas.forEach(function(fantasma, i){
      that.moverFantasma(fantasma);
      that.teletransportarPersonaje(fantasma);
      fantasma.update();
    })
  }
  
  colisionWall(position, orientacion) {
    
    var colision = false;

    var xPos = Math.floor(position.x);
    var zPos = Math.floor(position.z);
    
    switch(orientacion){
      case orientaciones.UP:
        colision = this.map[zPos][xPos] == '#';
        break;
      case orientaciones.DOWN:
        colision = this.map[zPos+1][xPos] == '#';
        break;
      case orientaciones.LEFT:
        colision = this.map[zPos][xPos] == '#';
        break;
      case orientaciones.RIGHT:
        colision = this.map[zPos][xPos+1] == '#';
        break;
    }
    
    return colision;
  }

  colisionFantasma(){
    var colision = false;
    var fantasmaColision = undefined;

    var zPac = Math.floor(this.pacman.position.z);
    var xPac = Math.floor(this.pacman.position.x);

    this.fantasmas.forEach((fantasma) => {
      if(fantasma.getSpawned()){
        var zFantasma = Math.floor(fantasma.position.z);
        var xFantasma = Math.floor(fantasma.position.x);

        if(!colision){
          colision = (xPac == xFantasma) && (zPac == zFantasma);

          if (colision){
            fantasmaColision = fantasma;
          }
        }
      }
    });
    
    return fantasmaColision;
  }

  eatPunto(){
    var xPos = Math.round(this.pacman.position.x);
    var zPos = Math.round(this.pacman.position.z);

    var punto = this.getObjectByName("punto_" + zPos + "_" + xPos);
    var puntoGrande = this.getObjectByName("punto_grande_" + zPos + "_" + xPos)

    if(punto != undefined || puntoGrande != undefined){
      this.game.decreaseRemainingDots();
      if(punto != undefined){
        this.game.updateScore('.');
        this.remove(punto);
      } else if(puntoGrande != undefined){
        this.game.updateScore('o');
        this.remove(puntoGrande);

        // Activamos vulnerabilidad y modo furia
        this.fantasmas.forEach((fantasma) => {
          fantasma.setVulnerable(true);
        });
        
        this.pacman.setFury(true);

        this.pacmanFurioso.start();
      }
    }
  }

  teletransportarPersonaje(personaje){
    var xPos = Math.round(personaje.position.x);
    var zPos = Math.round(personaje.position.z);

    if(zPos == 15){
      if(xPos == 0){
        personaje.position.x = this.map[zPos].length-2;
      } else if (xPos == this.map[zPos].length-1){
        personaje.position.x = 1;
      }
    }
  }

  deletePacman(){
    this.remove(this.pacman);
  }

  spawnearPacman(){
    this.deletePacman();

    this.pacman = new PacMan(this.game.getPacmanSpeed());
    this.pacman.scale.set (0.1, 0.1, 0.1);
    this.add(this.pacman);

    this.pacman.position.set(this.pacmanSpawn.x, 0, this.pacmanSpawn.z);
  }
  
  deleteFantasmas(){
    this.fantasmas.forEach((fantasma) => {
      this.remove(fantasma);
    });
  }

  spawnearFantasmas(){
    this.deleteFantasmas();

    this.fantasmas = [
      new Fantasma(this.game.getFantasmaSpeed(), 0xFF0000),
      new Fantasma(this.game.getFantasmaSpeed(), 0xFFB8FF),
      new Fantasma(this.game.getFantasmaSpeed(), 0x00FFFF),
      new Fantasma(this.game.getFantasmaSpeed(), 0xFFB852)
    ];

    this.fantasmas.forEach((fantasma) => {
      fantasma.scale.set (0.035, 0.035, 0.035);
      fantasma.position.set(this.fantasmaSpawn.x, 0, this.fantasmaSpawn.z);

      this.add(fantasma);
      this.spawnFantasma(fantasma);
    });
  }

  resetearPersonajes(){
    this.spawnearPacman();
    this.spawnearFantasmas();
  }

  update () {
    var fin = false;

    if(this.comienzaJuego){
      if(this.game.getRemainingDots() > 0){
        this.updateCamera();

        this.pacman.update(this.colisionWall(this.pacman.position, this.pacman.getOrientacion()));
        this.teletransportarPersonaje(this.pacman);

        this.updateFantasmas();

        this.eatPunto();
        document.getElementById('puntuacion').textContent = 'Score: ' + this.game.getScore();

        var fantasmaColision = this.colisionFantasma();

        if(fantasmaColision != undefined){
          if(fantasmaColision.getVulnerable()){

            this.game.updateScore('G');
            this.respawnFantasma(fantasmaColision);

          } else {
            document.getElementById("muerte").style.display = "block";
            this.game.getSonidoMuerte().play();

            this.game.decreaseRemainingLives();
            var vida = document.getElementById("vidas").getElementsByTagName("img");
            vida[this.game.getRemainingLives()].style.display = "none";

            if(this.game.getRemainingLives() > 0){
              this.resetearPersonajes();
            } else {
              window.alert("HAS PERDIDO... Puntuación total: " + this.game.getScore() + "\nINTRODUCE UNA MONEDA (o pulsa F5, lo que prefieras...");
              fin = true;
            }
          }
        }
      } else{
        window.alert("¡HAS GANADO! Puntuación total: " + this.game.getScore() + "\nINTRODUCE UNA MONEDA (o pulsa F5, lo que prefieras...");
        fin = true;
      }
    }

    // Renderizar escena (camara en vista isométrica y tercera persona) y minimapa
    if(this.terceraPersona){
      this.renderViewport(this, this.getCamera('P'), 0, 0, 1, 1, false);
    }else{
      this.renderViewport(this, this.getCamera('C'), 0, 0, 1, 1, false);
    }
    this.renderViewport(this, this.getCamera('M'), 1.5, 0.05, 0.4, 0.4, true);

    // Este método debe ser llamado cada vez que queramos visualizar la escena de nuevo.
    // Literalmente le decimos al navegador: "La próxima vez que haya que refrescar la pantalla, llama al método que te indico".
    // Si no existiera esta línea,  update()  se ejecutaría solo la primera vez.
    if(!fin){
      requestAnimationFrame(() => this.update());
      TWEEN.update();
    }
  }
}

/// La función   main
$(function () {

  // Se instancia la escena pasándole el  div  que se ha creado en el html para visualizar
  var scene = new MyScene("#WebGL-output");

  // Se añaden los listener de la aplicación. En este caso, el que va a comprobar cuándo se modifica el tamaño de la ventana de la aplicación.
  window.addEventListener ("resize", () => scene.onWindowResize());

  window.addEventListener("keydown", (event) => scene.onKeyDown(event));
  
  // Que no se nos olvide, la primera visualización.
  scene.update();
});
