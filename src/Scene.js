 import * as THREE from '../libs/three.module.js'
 import * as TWEEN from '../libs/tween.esm.js';

 import { PacMan } from './PacMan.js';
 import { Fantasma } from './Fantasma.js';
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

    // Puntos de spawn de los personajes
    this.pacmanSpawn = new THREE.Vector3(0, 0, 0);
    this.fantasmaSpawn = new THREE.Vector3(0, 0, 0);

    // Iniciamos el nivel directamente
    this.nivel = 0;
    this.siguienteNivel();

    // Mostramos la puntuación
    document.getElementById('puntuacion').textContent = 'Score: ' + this.game.getScore();

    // Mostramos las vidas restantes
    for (let i = 0; i < this.game.getRemainingLives(); i++) {
        let life = document.createElement("img");
        life.src = "img/pacman_icon.png";
        document.getElementById("vidas").appendChild(life);
    }

    // Animación que controla 'la furia de Pacman'
    var inicioVulnerables = {x: 0};
    var finAnimacion = {x: 1};

    this.pacmanFurioso = new TWEEN.Tween(inicioVulnerables)
      .to(finAnimacion, 8000)
      .easing(TWEEN.Easing.Linear.None)
      .onComplete(() => {
          this.fantasmas.forEach((fantasma) => {
            fantasma.setVulnerable(false);
          });
          this.pacman.setFury(false);
          document.getElementById("pacFury").style.display = "none";
      });
  }

  siguienteNivel(){
    // Eliminamos completamente la escena
    while(this.children.length > 0){ 
      this.remove(this.children[0]); 
    }

    // Cambiamos el nivel para cambiar de mapa
    this.cambiarNivel();
    // Creamos el mapa correspondiente
    this.map = [];
    this.createMap();

    // Spawneamos a los personajes para inicializar las camaras
    this.fantasmas = [];
    this.resetearPersonajes();

    // Añadimos las luces...
    this.createLights ();
    
    // y las camaras a la escena
    this.createCamera ();

    // Eliminamos los modelos de los personajes, para volver a crearlos cuando comencemos a jugar
    // así, solo inicializamos las camaras de la escena
    this.deletePacman();
    this.deleteFantasmas();

    // No indicamos el comienzo del juego hasta que se pulse el botón 'P'
    this.comienzaJuego = false;

    // Solo podremos pulsar el botón 'P' una vez: cuando iniciemos la partida
    this.botonPPulsado = false;

    // Mostramos el mensaje del inicio
    document.getElementById("botonInicio").style.display = "block";
  }

  
  createCamera () {    
    // Crear camara en perspectiva, siguiendo a Pacman en su espalda
    this.pacmanCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Se indica su posicion
    this.pacmanCamera.position.set(this.pacman.position.x, 3, this.pacman.position.z+2.75);
    // Hacia donde mira
    this.pacmanCamera.lookAt(this.pacman.position);
    // Y la insertamos en la escena
    this.add(this.pacmanCamera);

    this.terceraPersona = false;

    // Crear camara en perspectiva, siguiendo a Pacman desde arriba
    this.camera= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Se indica su posición
    this.camera.position.set(this.pacman.position.x, 20, this.pacman.position.z+10);
    // Hacia donde mira
    this.camera.lookAt(this.pacman.position);
    // Y la insertamos en la escena
    this.add(this.camera);

    // Obtener tamaños del minimapa
    var viewSizeX = this.map[0].length;
    var viewSizeY = this.map.length; 

    // Crear camara ortogonal, posicionarla correctamente para que mire hacia abajo
    // e insertarla en la escena
    this.mapCamera = new THREE.OrthographicCamera(-viewSizeX / 2, viewSizeX / 2, viewSizeY / 2, - viewSizeY / 2, 1, 1000);
    
    // La posicionamos correctamente mirando hacia abajo y la insertamos en la escena
    this.mapCamera.position.set(13.5, 4, 16);
    this.mapCamera.lookAt(13.5, 0, 16);
    this.add(this.mapCamera);
  }
  
  createLights () {
    // Se crea una luz ambiental, evita que se vean complentamente negras las zonas donde no incide de manera directa una fuente de luz
    // La luz ambiental solo tiene un color y una intensidad
    // Se declara como   var   y va a ser una variable local a este método
    // se hace así puesto que no va a ser accedida desde otros métodos
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

    var mapa = [];

    // Cargamos el mapa correspondiente al nivel
    if(that.nivel == 1){
      mapa = this.game.getLevelMap1();
    } else if(that.nivel == 2){
      mapa = this.game.getLevelMap2();
    }

    // Recorremos el mapa y añadimos los correspondientes objetos a la escena (comprobando el caracter que corresponde a cada casilla)
    // Primero, recorremos las filas...
    mapa.forEach(function(item, z) {

      let fila = [];

      // y después, la columna de cada fila
      for (let x = 0; x < item.length; x++) {
          let casilla = item.charAt(x);
          fila.push(casilla);

          if (casilla === '#') {
            that.createWall(x, z);
          } else if (casilla === '.') {
            that.createDot(x, z);
          } else if (casilla === 'o') {
            that.createPowerPellet(x, z);
          } else if (casilla === 'P') {
            that.pacmanSpawn.x = x;
            that.pacmanSpawn.z = z;
          } else if (casilla === 'G') {
            that.fantasmaSpawn.x = x;
            that.fantasmaSpawn.z = z;
          }
      }

      that.map.push(fila);
    });
  }

  // Creamos la pared correspondiente a la casilla indicada en el mapa
  createWall(x, z) {
    var wallMesh = new Muro();
    wallMesh.position.set(x, 0, z);
    wallMesh.name = "wall_" + z + "_" + x;
    this.add(wallMesh);
  }

  // Creamos el punto normal correspondiente a la casilla indicada en el mapa
  createDot(x, z) {
    var punto = new Punto(0.1);
    punto.position.set(x, 0, z);
    punto.name = "punto_" + z + "_" + x;
    this.add(punto);
    this.game.increaseRemainingDots();
  }

  // Creamos el punto grande correspondiente a la casilla indicada en el mapa
  createPowerPellet(x, z) {
      var puntoGrande = new Punto(0.2);
      puntoGrande.position.set(x, 0, z);
      puntoGrande.name = "punto_grande_" + z + "_" + x;
      this.add(puntoGrande);
      this.game.increaseRemainingDots();
  }
  
  // Spawneamos a los fantasmas
  spawnFantasma(fantasma) {
    // Establecemos que el fantasma ha spawneado
    fantasma.setSpawned(true);

    // Establecemos su velocidad
    fantasma.setVelocidad(this.game.getFantasmaSpeed());
  }

  // Volvemos a spawnear a los fantasmas comidos
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
  
  // Establecemos las camaras usadas en cada momento, cambiando así entre tercera persona y vista superior
  getCamera (camera) {
    if(camera === 'P'){
      return this.pacmanCamera;
    } else if(camera === 'M'){
      return this.mapCamera;
    } else if(camera === 'C'){
      return this.camera;
    }
  }
  
  // Actualizamos las camaras, dependiendo del tamaño de la ventana
  setCameraAspect (ratio) {
    this.pacmanCamera.aspect = ratio;
    this.pacmanCamera.updateProjectionMatrix();

    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();

    this.mapCamera.aspect = 1;
    this.mapCamera.updateProjectionMatrix();
  }
  
  // Cada vez que modificamos el tamaño de la ventana, actualizamos el ratio de aspecto y el tamaño del renderizador
  onWindowResize () {
    this.setCameraAspect (window.innerWidth / window.innerHeight);
  
    this.renderer.setSize (window.innerWidth, window.innerHeight);
  }

  onKeyDown(event) {
    var key = event.which;

    
    var orientacionPrevia = this.pacman.getOrientacion();
    var ajustarPosicion = false;

    // Procesar el movimiento del personaje
    if(!this.terceraPersona){
      switch(String.fromCharCode(key).toUpperCase()) {
        case "A":
          this.pacman.setOrientacion(orientaciones.LEFT);
          ajustarPosicion = orientacionPrevia != orientaciones.RIGHT && orientacionPrevia != orientaciones.LEFT;
          break;
        case "S":
          this.pacman.setOrientacion(orientaciones.DOWN);
          ajustarPosicion = orientacionPrevia != orientaciones.UP && orientacionPrevia != orientaciones.DOWN;
          break;
        case "D":
          this.pacman.setOrientacion(orientaciones.RIGHT);
          ajustarPosicion = orientacionPrevia != orientaciones.LEFT && orientacionPrevia != orientaciones.RIGHT;
          break;
        case "W":
          this.pacman.setOrientacion(orientaciones.UP);
          ajustarPosicion = orientacionPrevia != orientaciones.DOWN && orientacionPrevia != orientaciones.UP;
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
                ajustarPosicion = orientacionPrevia != orientaciones.UP && orientacionPrevia != orientaciones.DOWN;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.LEFT);
                ajustarPosicion = orientacionPrevia != orientaciones.RIGHT && orientacionPrevia != orientaciones.LEFT;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.UP);
                ajustarPosicion = orientacionPrevia != orientaciones.DOWN && orientacionPrevia != orientaciones.UP;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                ajustarPosicion = orientacionPrevia != orientaciones.LEFT && orientacionPrevia != orientaciones.RIGHT;
                break;
            }
            break;
          case "A":
            switch(this.pacman.getOrientacion()) {
              case orientaciones.UP:
                this.pacman.setOrientacion(orientaciones.LEFT);
                ajustarPosicion = orientacionPrevia != orientaciones.RIGHT && orientacionPrevia != orientaciones.LEFT;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.UP);
                ajustarPosicion = orientacionPrevia != orientaciones.DOWN && orientacionPrevia != orientaciones.UP;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                ajustarPosicion = orientacionPrevia != orientaciones.LEFT && orientacionPrevia != orientaciones.RIGHT;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.DOWN);
                ajustarPosicion = orientacionPrevia != orientaciones.UP && orientacionPrevia != orientaciones.DOWN;
                break;
            }
            break;
          case "D":
            switch(this.pacman.getOrientacion()) {
              case orientaciones.UP:
                this.pacman.setOrientacion(orientaciones.RIGHT);
                ajustarPosicion = orientacionPrevia != orientaciones.LEFT && orientacionPrevia != orientaciones.RIGHT;
                break;
              case orientaciones.RIGHT:
                this.pacman.setOrientacion(orientaciones.DOWN);
                ajustarPosicion = orientacionPrevia != orientaciones.UP && orientacionPrevia != orientaciones.DOWN;
                break;
              case orientaciones.DOWN:
                this.pacman.setOrientacion(orientaciones.LEFT);
                ajustarPosicion = orientacionPrevia != orientaciones.RIGHT && orientacionPrevia != orientaciones.LEFT;
                break;
              case orientaciones.LEFT:
                this.pacman.setOrientacion(orientaciones.UP);
                ajustarPosicion = orientacionPrevia != orientaciones.DOWN && orientacionPrevia != orientaciones.UP;
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
    if (ajustarPosicion) {
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

    // Indicamos el viewport y cortamos la imagen
    this.renderer.setViewport(l, t, w, h);
    this.renderer.setScissor(l, t, w, h);
    this.renderer.setScissorTest(true);

    // Actualizamos matriz de proyección y ratio de aspecto
    camera.aspect = w/h;
    camera.updateProjectionMatrix();

    // Visualizar escena 
    this.renderer.render(scene, camera);
  }

  // Actualizamos las camaras (dependiendo de si estamos en tercera persona o en camara desde arriba)
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

  // Movemos al fantasma: cuando detecta una colisión, calcula aleatoriamente una nueva orientación para avanzar
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

  // Updateamos los fantasmas en cada tick
  updateFantasmas() {
    var that = this;
    that.fantasmas.forEach(function(fantasma, i){
      that.moverFantasma(fantasma);
      that.teletransportarPersonaje(fantasma);
      fantasma.update();
    })
  }
  
  // Detectamos si el personaje ha colisionado con la pared o no, deteniendolo.
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

  // Detectamos colision entre un fantasma y Pacman, devolviendo el fantasma involucrado en la misma
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

  // Creamos la acción de comer puntos.
  // Dependiendo del punto, realizará una acción u otra
  // Si es un punto pequeño, incrementa la puntuación total
  // Si es un punto grande, además de incrementar la puntuación total, activa 'la furia de Pacman'
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

  // Si el personaje se encuentra en el limite del mapa, se teletransporta a la otra ubicación
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

  // Borramos el modelo de Pacman de la escena
  deletePacman(){
    this.remove(this.pacman);
  }

  // Spawneamos un nuevo Pacman en el punto de spawn (tras eliminar su antiguo modelo)
  spawnearPacman(){
    this.deletePacman();

    this.pacman = new PacMan(this.game.getPacmanSpeed());
    this.pacman.scale.set (0.1, 0.1, 0.1);
    this.add(this.pacman);

    this.pacman.position.set(this.pacmanSpawn.x, 0, this.pacmanSpawn.z);
  }
  
  // Eliminamos los modelos de todos los fantasmas de la escena
  deleteFantasmas(){
    this.fantasmas.forEach((fantasma) => {
      this.remove(fantasma);
    });
  }

  // Spawneamos los nuevos fantasmas en el punto de spawn (tras eliminar sus antiguos modelos)
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

  // Spawneamos todos los personajes
  resetearPersonajes(){
    this.spawnearPacman();
    this.spawnearFantasmas();
  }

  // Cambiamos el nivel al siguiente, creando un loop de niveles cada vez que se acaba uno
  cambiarNivel(){
    if(this.nivel == 1){
      this.nivel = 2;
    } else if(this.nivel == 2 || this.nivel == 0){
      this.nivel = 1;
    }
  }

  // Actualizamos la escena
  update () {
    var fin = false;

    // Establecemos el comienzo del juego
    if(this.comienzaJuego){
      // Establecemos si hemos ganado o no la partida (cuando se acaban los puntos en el mapa)
      if(this.game.getRemainingDots() > 0){
        // Actualizamos las camaras correspondientes
        this.updateCamera();

        // Actualizamos a Pacman y comprobamos si teletransportamos al personaje
        this.pacman.update(this.colisionWall(this.pacman.position, this.pacman.getOrientacion()));
        this.teletransportarPersonaje(this.pacman);

        // Actualizamos a todos los fantasmas
        this.updateFantasmas();

        // Comprobamos si comemos un punto o no
        this.eatPunto();

        // Actualizamos la vista de la puntuación total
        document.getElementById('puntuacion').textContent = 'Score: ' + this.game.getScore();

        // Comprobamos la colision de Pacman con un fantasma
        var fantasmaColision = this.colisionFantasma();

        // Si se produce colisión, comprobamos si es vulnerable o no
        if(fantasmaColision != undefined){
          // Si es vulnerable, actualizamos la puntuacion, respawneamos al fantasma y reproducimos el sonido correspondiente
          if(fantasmaColision.getVulnerable()){

            this.game.updateScore('G');
            this.respawnFantasma(fantasmaColision);
            this.game.getSonidoComer().play();

            // Si no es vulnerable, reproducimos el sonido correspondiente y disminuimos las vidas
          } else {
            document.getElementById("muerte").style.display = "block";
            this.game.getSonidoMuerte().play();

            this.game.decreaseRemainingLives();
            var vida = document.getElementById("vidas").getElementsByTagName("img");
            vida[this.game.getRemainingLives()].style.display = "none";

            // Si tenemos más vidas, reseteamos a todos los personajes
            if(this.game.getRemainingLives() > 0){
              this.resetearPersonajes();

              // Si no es así, perdemos la partida y finalizamos el juego
            } else {
              window.alert("HAS PERDIDO... Puntuación total: " + this.game.getScore() + "\nINTRODUCE UNA MONEDA (o pulsa F5, lo que prefieras...");
              fin = true;
            }
          }
        }

        // Si ganamos el nivel, cambiamos al siguiente
      } else{
        window.alert("¡HAS GANADO! Puntuación total: " + this.game.getScore() + "\nCargando el siguiente nivel...");
        this.siguienteNivel();
      }
    }

    // Renderizar escena (camara en vista desde arriba o tercera persona) y minimapa
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
