class Game {
    constructor() {
        this.remainingLives = 3;
        this.remainingDots = 0;
        this.score = 0;

        this.pacmanSpeed = 3;
        this.ghostSpeed = 2.5;
        this.SPEED_INCREMENT = 0.5;
        this.MAX_PACMAN_SPEED = 5.5;
        this.MAX_GHOST_SPEED = 5;

        this.DOT_POINTS = 10;
        this.POWER_PELLET_POINTS = 50;
        this.GHOST_POINTS = 200;

        this.sonidoMuerte = new Audio("sounds/pacman_death.wav");
        this.sonidoMuerte.preload = "auto";
        this.sonidoMuerte.volume = 0.3;
        
        this.sonidoInicioJuego = new Audio("sounds/pacman_beginning.wav");
        this.sonidoInicioJuego.preload = "auto";
        this.sonidoInicioJuego.volume = 0.3;

        this.LEVEL_MAP = [
            "############################",
            "############################",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#o####.#####.##.#####.####o#",
            "#.####.#####.##.#####.####.#",
            "#..........................#",
            "#.####.##.########.##.####.#",
            "#.####.##.########.##.####.#",
            "#......##....##....##......#",
            "######.#####.##.#####.######",
            "     #.#####.##.#####.#     ",
            "     #.##     G    ##.#     ",
            "     #.## ######## ##.#     ",
            "######.## #      # ##.######",
            "      .   #      #   .      ",
            "######.## #      # ##.######",
            "     #.## ######## ##.#     ",
            "     #.##          ##.#     ",
            "     #.## ######## ##.#     ",
            "######.## ######## ##.######",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#.####.#####.##.#####.####.#",
            "#o..##........P.......##..o#",
            "###.##.##.########.##.##.###",
            "###.##.##.########.##.##.###",
            "#......##....##....##......#",
            "#.##########.##.##########.#",
            "#.##########.##.##########.#",
            "#..........................#",
            "############################",
            "############################"
        ];
    }

    getRemainingLives() {
        return this.remainingLives;
    }

    decreaseRemainingLives() {
        this.remainingLives--;
    }

    getRemainingDots() {
        return this.remainingDots;
    }

    increaseRemainingDots() {
        this.remainingDots++;
    }

    decreaseRemainingDots() {
        this.remainingDots--;
    }

    getScore() {
        return this.score;
    }

    updateScore(type){
        if(type === '.'){
            this.score += this.DOT_POINTS;
        } else if(type === 'o'){
            this.score += this.POWER_PELLET_POINTS;
        } else if(type === 'G'){
            this.score += this.GHOST_POINTS;
        }
    }

    getSonidoMuerte(){
        return this.sonidoMuerte;
    }

    getSonidoInicio(){
        return this.sonidoInicioJuego;
    }

    getPacmanSpeed() {
        return this.pacmanSpeed;
    }

    getFantasmaSpeed() {
        return this.ghostSpeed;
    }

    getLevelMap() {
        return this.LEVEL_MAP;
    }
}

export { Game }