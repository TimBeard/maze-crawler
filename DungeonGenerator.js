/**
 * Générateur de donjons style Phantasy Star
 * Utilise l'algorithme de Recursive Backtracking
 * Contrainte: deux couloirs ne peuvent pas être adjacents
 */
class DungeonGenerator {
	constructor(width = 16, height = 16) {
		this.width = width;
		this.height = height;
		this.grid = [];

		// Types de cellules
		this.CELL_TYPES = {
			WALL: 0,
			CORRIDOR: 1,
		};
	}

	/**
	 * Initialise la grille avec des murs
	 */
	initGrid() {
		this.grid = [];
		for (let y = 0; y < this.height; y++) {
			this.grid[y] = [];
			for (let x = 0; x < this.width; x++) {
				this.grid[y][x] = this.CELL_TYPES.WALL;
			}
		}
	}

	/**
	 * Génère un nouveau donjon
	 */
	generate() {
		this.initGrid();

		// Point de départ au centre
		const startX = Math.floor(this.width / 2);
		const startY = Math.floor(this.height / 2);

		// Commence le recursive backtracking
		this.carve(startX, startY);

		return this.grid;
	}

	/**
	 * Algorithme de recursive backtracking
	 */
	carve(x, y) {
		// Marque la cellule courante comme couloir
		this.grid[y][x] = this.CELL_TYPES.CORRIDOR;

		// Directions possibles (haut, droite, bas, gauche)
		const directions = [
			{ dx: 0, dy: -1 }, // Haut
			{ dx: 1, dy: 0 }, // Droite
			{ dx: 0, dy: 1 }, // Bas
			{ dx: -1, dy: 0 }, // Gauche
		];

		// Mélange les directions pour un parcours aléatoire
		this.shuffle(directions);

		// Pour chaque direction
		for (const dir of directions) {
			// On avance de 2 cases pour respecter la contrainte
			// que deux couloirs ne soient pas adjacents
			const nx = x + dir.dx * 2;
			const ny = y + dir.dy * 2;

			// Vérifie si la nouvelle position est valide
			if (this.isValid(nx, ny) && this.grid[ny][nx] === this.CELL_TYPES.WALL) {
				// Vérifie que la création du couloir ne violera pas la contrainte
				if (this.canCarveWithoutAdjacency(nx, ny, dir)) {
					// Creuse le mur intermédiaire
					const mx = x + dir.dx;
					const my = y + dir.dy;
					this.grid[my][mx] = this.CELL_TYPES.CORRIDOR;

					// Récursion
					this.carve(nx, ny);
				}
			}
		}
	}

	/**
	 * Vérifie si on peut creuser sans créer des couloirs adjacents
	 */
	canCarveWithoutAdjacency(x, y, direction) {
		// Vérifie les cellules perpendiculaires à la direction
		if (direction.dx !== 0) {
			// Direction horizontale
			// Vérifie au-dessus et en-dessous
			if (
				this.isValid(x, y - 1) &&
				this.grid[y - 1][x] === this.CELL_TYPES.CORRIDOR
			) {
				return false;
			}
			if (
				this.isValid(x, y + 1) &&
				this.grid[y + 1][x] === this.CELL_TYPES.CORRIDOR
			) {
				return false;
			}
		} else {
			// Direction verticale
			// Vérifie à gauche et à droite
			if (
				this.isValid(x - 1, y) &&
				this.grid[y][x - 1] === this.CELL_TYPES.CORRIDOR
			) {
				return false;
			}
			if (
				this.isValid(x + 1, y) &&
				this.grid[y][x + 1] === this.CELL_TYPES.CORRIDOR
			) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Vérifie si une position est valide dans la grille
	 */
	isValid(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	/**
	 * Mélange un tableau (algorithme de Fisher-Yates)
	 */
	shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	/**
	 * Retourne la grille
	 */
	getGrid() {
		return this.grid;
	}

	/**
	 * Affiche la grille en console (debug)
	 */
	printGrid() {
		console.log("Donjon généré:");
		for (let y = 0; y < this.height; y++) {
			let row = "";
			for (let x = 0; x < this.width; x++) {
				const cell = this.grid[y][x];
				switch (cell) {
					case this.CELL_TYPES.WALL:
						row += "█";
						break;
					case this.CELL_TYPES.CORRIDOR:
						row += " ";
						break;
				}
			}
			console.log(row);
		}
	}
}
