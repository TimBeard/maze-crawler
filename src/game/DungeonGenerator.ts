/**
 * Générateur de donjons style Phantasy Star
 * Utilise l'algorithme de Recursive Backtracking
 * Contrainte: deux couloirs ne peuvent pas être adjacents
 */

export enum CellType {
	WALL = 0,
	CORRIDOR = 1,
}

interface Direction {
	dx: number;
	dy: number;
}

export interface SpawnPoint {
	x: number;
	y: number;
	direction: number; // 0=North, 1=East, 2=South, 3=West
}

export class DungeonGenerator {
	private width: number;
	private height: number;
	private grid: number[][];
	private seed: number;
	private currentSeed: number;
	private spawnPoint: SpawnPoint;
	private exitPoint: { x: number; y: number };
	public readonly CELL_TYPES = CellType;

	constructor(width: number = 16, height: number = 16) {
		this.width = width;
		this.height = height;
		this.grid = [];
		this.seed = Date.now();
		this.currentSeed = this.seed;
		this.spawnPoint = { x: 1, y: 1, direction: 0 };
		this.exitPoint = { x: width - 2, y: height - 2 };
	}

	/**
	 * Retourne le point de départ du joueur
	 */
	public getSpawnPoint(): SpawnPoint {
		return this.spawnPoint;
	}

	/**
	 * Retourne le point de sortie
	 */
	public getExitPoint(): { x: number; y: number } {
		return this.exitPoint;
	}

	/**
	 * Définit la seed pour la génération
	 */
	public setSeed(seed: number): void {
		this.seed = seed;
	}

	/**
	 * Retourne la seed actuelle
	 */
	public getSeed(): number {
		return this.seed;
	}

	/**
	 * Générateur de nombres pseudo-aléatoires (Mulberry32)
	 * Retourne un nombre entre 0 et 1
	 */
	private random(): number {
		let t = (this.currentSeed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/**
	 * Initialise la grille avec des murs
	 */
	private initGrid(): void {
		this.grid = [];
		for (let y = 0; y < this.height; y++) {
			this.grid[y] = [];
			for (let x = 0; x < this.width; x++) {
				this.grid[y][x] = CellType.WALL;
			}
		}
	}

	/**
	 * Génère un nouveau donjon
	 * @param seed - Optionnel: seed pour la génération (si non fourni, utilise la seed actuelle)
	 * @param forcedSpawn - Optionnel: position et direction forcées pour le spawn
	 */
	public generate(seed?: number, forcedSpawn?: SpawnPoint): number[][] {
		// Initialise la seed
		if (seed !== undefined) {
			this.seed = seed;
		}
		this.currentSeed = this.seed;

		this.initGrid();

		// Détermine le point de départ
		let startX: number;
		let startY: number;
		let initialDirection: number;

		if (forcedSpawn && this.isValid(forcedSpawn.x, forcedSpawn.y)) {
			// Utilise le spawn forcé
			startX = forcedSpawn.x;
			startY = forcedSpawn.y;

			const maxX = this.width - 2;
			const maxY = this.height - 2;

			// Vérifie si la direction du joueur est valide (ne sort pas de la grille)
			// Directions: 0=Nord, 1=Est, 2=Sud, 3=Ouest
			const dirVectors = [
				{ dx: 0, dy: -1 }, // Nord
				{ dx: 1, dy: 0 }, // Est
				{ dx: 0, dy: 1 }, // Sud
				{ dx: -1, dy: 0 }, // Ouest
			];

			const playerDir = forcedSpawn.direction;
			const nextX = startX + dirVectors[playerDir].dx;
			const nextY = startY + dirVectors[playerDir].dy;

			// Si la direction du joueur ne sort pas de la grille intérieure, on la garde
			if (this.isValid(nextX, nextY)) {
				initialDirection = playerDir;
			} else {
				// Sinon, on choisit une direction vers l'intérieur (escalier en colimaçon)
				const possibleDirections: number[] = [];

				if (startY === 1) possibleDirections.push(2); // Bord haut -> Sud
				if (startY === maxY) possibleDirections.push(0); // Bord bas -> Nord
				if (startX === 1) possibleDirections.push(1); // Bord gauche -> Est
				if (startX === maxX) possibleDirections.push(3); // Bord droit -> Ouest

				if (possibleDirections.length > 0) {
					initialDirection =
						possibleDirections[
							Math.floor(this.random() * possibleDirections.length)
						];
				} else {
					initialDirection = Math.floor(this.random() * 4);
				}
			}
		} else {
			// Choisit un point de départ aléatoire sur les bords intérieurs
			const possibleStarts: SpawnPoint[] = [];
			const maxX = this.width - 2;
			const maxY = this.height - 2;

			// Bord haut (y=1), direction vers le bas
			for (let x = 1; x <= maxX; x += 2) {
				possibleStarts.push({ x, y: 1, direction: 2 });
			}
			// Bord bas (y=maxY), direction vers le haut
			for (let x = 1; x <= maxX; x += 2) {
				possibleStarts.push({ x, y: maxY, direction: 0 });
			}
			// Bord gauche (x=1), direction vers la droite
			for (let y = 1; y <= maxY; y += 2) {
				possibleStarts.push({ x: 1, y, direction: 1 });
			}
			// Bord droit (x=maxX), direction vers la gauche
			for (let y = 1; y <= maxY; y += 2) {
				possibleStarts.push({ x: maxX, y, direction: 3 });
			}

			const startIndex = Math.floor(this.random() * possibleStarts.length);
			startX = possibleStarts[startIndex].x;
			startY = possibleStarts[startIndex].y;
			initialDirection = possibleStarts[startIndex].direction;
		}

		// Définit le spawnPoint
		this.spawnPoint = { x: startX, y: startY, direction: initialDirection };

		// Commence le recursive backtracking avec la direction initiale forcée
		this.carve(startX, startY, initialDirection, true);

		// Trouve le point de sortie (dans un autre cul-de-sac)
		this.findExitPoint();

		return this.grid;
	}

	/**
	 * Trouve le point de sortie dans un cul-de-sac différent du spawn
	 */
	private findExitPoint(): void {
		const directions = [
			{ dx: 0, dy: -1 }, // North
			{ dx: 1, dy: 0 }, // East
			{ dx: 0, dy: 1 }, // South
			{ dx: -1, dy: 0 }, // West
		];

		// Collecte tous les culs-de-sac sauf le spawn
		const deadEnds: { x: number; y: number }[] = [];

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (this.grid[y][x] === CellType.CORRIDOR) {
					// Ne pas inclure le spawn
					if (x === this.spawnPoint.x && y === this.spawnPoint.y) {
						continue;
					}

					let exitCount = 0;
					for (const d of directions) {
						const nx = x + d.dx;
						const ny = y + d.dy;
						if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width) {
							if (this.grid[ny][nx] === CellType.CORRIDOR) {
								exitCount++;
							}
						}
					}

					if (exitCount === 1) {
						deadEnds.push({ x, y });
					}
				}
			}
		}

		// Choisit un cul-de-sac aléatoire pour la sortie
		if (deadEnds.length > 0) {
			const exitIndex = Math.floor(this.random() * deadEnds.length);
			this.exitPoint = deadEnds[exitIndex];
		} else {
			// Fallback: trouve un couloir quelconque différent du spawn
			for (let y = this.height - 2; y >= 1; y--) {
				for (let x = this.width - 2; x >= 1; x--) {
					if (
						this.grid[y][x] === CellType.CORRIDOR &&
						(x !== this.spawnPoint.x || y !== this.spawnPoint.y)
					) {
						this.exitPoint = { x, y };
						return;
					}
				}
			}
		}
	}

	/**
	 * Algorithme de recursive backtracking
	 * @param initialDirection - Direction initiale forcée (optionnel)
	 * @param isFirstCall - Indique si c'est le premier appel (pour forcer la direction)
	 */
	private carve(
		x: number,
		y: number,
		initialDirection?: number,
		isFirstCall?: boolean,
	): void {
		// Marque la cellule courante comme couloir
		this.grid[y][x] = CellType.CORRIDOR;

		// Directions possibles (haut, droite, bas, gauche)
		const directions: Direction[] = [
			{ dx: 0, dy: -1 }, // Haut (0)
			{ dx: 1, dy: 0 }, // Droite (1)
			{ dx: 0, dy: 1 }, // Bas (2)
			{ dx: -1, dy: 0 }, // Gauche (3)
		];

		// Si c'est le premier appel, force la direction initiale
		if (isFirstCall && initialDirection !== undefined) {
			// Place la direction initiale en premier, mélange les autres
			const forcedDir = directions[initialDirection];
			const otherDirs = directions.filter((_, i) => i !== initialDirection);
			this.shuffle(otherDirs);
			directions.length = 0;
			directions.push(forcedDir, ...otherDirs);
		} else {
			// Mélange les directions pour un parcours aléatoire
			this.shuffle(directions);
		}

		// Pour chaque direction
		for (const dir of directions) {
			// Détermine le pas: 2 normalement, mais 1 si on est à 1 case du bord
			const maxX = this.width - 2;
			const maxY = this.height - 2;

			// Essaie d'abord avec un pas de 2
			let step = 2;
			let nx = x + dir.dx * step;
			let ny = y + dir.dy * step;

			// Si on sort de la zone valide avec un pas de 2, essaie avec un pas de 1
			// mais seulement si ça nous amène exactement au bord
			if (!this.isValid(nx, ny)) {
				step = 1;
				nx = x + dir.dx * step;
				ny = y + dir.dy * step;

				// On accepte le pas de 1 seulement si ça nous amène au bord
				const isAtEdge = nx === 1 || nx === maxX || ny === 1 || ny === maxY;
				if (!isAtEdge || !this.isValid(nx, ny)) {
					continue;
				}
			}

			// Vérifie si la nouvelle position est valide et est un mur
			if (this.grid[ny][nx] === CellType.WALL) {
				// Vérifie que la création du couloir ne violera pas la contrainte
				if (this.canCarveWithoutAdjacency(nx, ny, dir)) {
					// Si pas de 2, vérifie aussi le mur intermédiaire
					if (step === 2) {
						const mx = x + dir.dx;
						const my = y + dir.dy;

						// Vérifie que le mur intermédiaire peut être creusé
						if (!this.canCarveMiddle(mx, my, dir)) {
							continue;
						}

						this.grid[my][mx] = CellType.CORRIDOR;
					}

					// Récursion
					this.carve(nx, ny);
				}
			}
		}
	}

	/**
	 * Vérifie si on peut creuser sans créer des couloirs adjacents
	 */
	private canCarveWithoutAdjacency(
		x: number,
		y: number,
		direction: Direction,
	): boolean {
		// Vérifie toutes les cellules adjacentes (sauf celle d'où on vient)
		const adjacentChecks = [
			{ dx: 0, dy: -1 }, // Haut
			{ dx: 1, dy: 0 }, // Droite
			{ dx: 0, dy: 1 }, // Bas
			{ dx: -1, dy: 0 }, // Gauche
		];

		for (const check of adjacentChecks) {
			// Ignore la direction d'où on vient
			if (check.dx === -direction.dx && check.dy === -direction.dy) {
				continue;
			}

			const nx = x + check.dx;
			const ny = y + check.dy;

			if (this.isValid(nx, ny) && this.grid[ny][nx] === CellType.CORRIDOR) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Vérifie si le mur intermédiaire peut être creusé sans créer d'adjacence
	 */
	private canCarveMiddle(x: number, y: number, direction: Direction): boolean {
		// Vérifie les cellules perpendiculaires au couloir intermédiaire
		const perpendicular = [
			{ dx: -direction.dy, dy: direction.dx },
			{ dx: direction.dy, dy: -direction.dx },
		];

		for (const check of perpendicular) {
			const nx = x + check.dx;
			const ny = y + check.dy;

			if (this.isValid(nx, ny) && this.grid[ny][nx] === CellType.CORRIDOR) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Vérifie si une position est valide dans la grille (en respectant la bordure de 1 case)
	 */
	private isValid(x: number, y: number): boolean {
		return x >= 1 && x < this.width - 1 && y >= 1 && y < this.height - 1;
	}

	/**
	 * Mélange un tableau (algorithme de Fisher-Yates)
	 */
	private shuffle<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(this.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	/**
	 * Retourne la grille
	 */
	public getGrid(): number[][] {
		return this.grid;
	}
}
