/**
 * Classe représentant le joueur
 */

export enum Direction {
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
}

export class Player {
	public x: number;
	public y: number;
	public direction: Direction;

	constructor(
		x: number = 1,
		y: number = 1,
		direction: Direction = Direction.NORTH,
	) {
		this.x = x;
		this.y = y;
		this.direction = direction;
	}

	/**
	 * Place le joueur sur un point de départ donné
	 * @param spawnPoint - Le point de départ avec position et direction
	 */
	public spawn(spawnPoint: { x: number; y: number; direction: number }): void {
		this.x = spawnPoint.x;
		this.y = spawnPoint.y;
		this.direction = spawnPoint.direction as Direction;
	}

	/**
	 * Retourne le caractère de flèche correspondant à la direction
	 */
	public getArrowChar(): string {
		switch (this.direction) {
			case Direction.NORTH:
				return "▲";
			case Direction.EAST:
				return "▶";
			case Direction.SOUTH:
				return "▼";
			case Direction.WEST:
				return "◀";
		}
	}

	/**
	 * Retourne l'angle de rotation en radians pour dessiner la flèche
	 */
	public getRotationAngle(): number {
		switch (this.direction) {
			case Direction.NORTH:
				return 0;
			case Direction.EAST:
				return Math.PI / 2;
			case Direction.SOUTH:
				return Math.PI;
			case Direction.WEST:
				return -Math.PI / 2;
		}
	}

	/**
	 * Retourne le vecteur de direction actuel
	 */
	private getDirectionVector(): { dx: number; dy: number } {
		switch (this.direction) {
			case Direction.NORTH:
				return { dx: 0, dy: -1 };
			case Direction.EAST:
				return { dx: 1, dy: 0 };
			case Direction.SOUTH:
				return { dx: 0, dy: 1 };
			case Direction.WEST:
				return { dx: -1, dy: 0 };
		}
	}

	/**
	 * Vérifie si une case est praticable
	 */
	private canMoveTo(
		x: number,
		y: number,
		grid: number[][],
		corridorType: number,
	): boolean {
		if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
			return false;
		}
		return grid[y][x] === corridorType;
	}

	/**
	 * Vérifie si le joueur peut se déplacer dans une direction
	 */
	public canMove(
		grid: number[][],
		corridorType: number,
		direction: "forward" | "backward",
	): boolean {
		const dir = this.getDirectionVector();
		const sign = direction === "forward" ? 1 : -1;
		const newX = this.x + dir.dx * sign;
		const newY = this.y + dir.dy * sign;
		return this.canMoveTo(newX, newY, grid, corridorType);
	}

	/**
	 * Avance d'une case dans la direction actuelle
	 */
	public moveForward(grid: number[][], corridorType: number): boolean {
		const dir = this.getDirectionVector();
		const newX = this.x + dir.dx;
		const newY = this.y + dir.dy;

		if (this.canMoveTo(newX, newY, grid, corridorType)) {
			this.x = newX;
			this.y = newY;
			return true;
		}
		return false;
	}

	/**
	 * Recule d'une case (sens inverse de la direction actuelle)
	 */
	public moveBackward(grid: number[][], corridorType: number): boolean {
		const dir = this.getDirectionVector();
		const newX = this.x - dir.dx;
		const newY = this.y - dir.dy;

		if (this.canMoveTo(newX, newY, grid, corridorType)) {
			this.x = newX;
			this.y = newY;
			return true;
		}
		return false;
	}

	/**
	 * Tourne dans le sens horaire (droite)
	 */
	public rotateClockwise(): void {
		this.direction = ((this.direction + 1) % 4) as Direction;
	}

	/**
	 * Tourne dans le sens antihoraire (gauche)
	 */
	public rotateCounterClockwise(): void {
		this.direction = ((this.direction + 3) % 4) as Direction;
	}
}
