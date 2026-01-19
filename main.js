/**
 * Fichier principal du jeu
 */

// Initialisation
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const generateBtn = document.getElementById("generateBtn");

// Configuration
const GRID_SIZE = 16;
const CELL_SIZE = canvas.width / GRID_SIZE;

// Couleurs style rétro Phantasy Star
const COLORS = {
	WALL: "#1a1a3e",
	CORRIDOR: "#e6f2ff",
	GRID_LINE: "#4a4a6e",
};

// Instance du générateur
const dungeonGenerator = new DungeonGenerator(GRID_SIZE, GRID_SIZE);
let currentDungeon = null;

/**
 * Dessine le donjon sur le canvas
 */
function drawDungeon(grid) {
	// Efface le canvas
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Dessine chaque cellule
	for (let y = 0; y < GRID_SIZE; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			const cellType = grid[y][x];

			// Définit la couleur selon le type de cellule
			switch (cellType) {
				case dungeonGenerator.CELL_TYPES.WALL:
					ctx.fillStyle = COLORS.WALL;
					break;
				case dungeonGenerator.CELL_TYPES.CORRIDOR:
					ctx.fillStyle = COLORS.CORRIDOR;
					break;
			}

			// Dessine la cellule
			ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

			// Dessine la grille
			ctx.strokeStyle = COLORS.GRID_LINE;
			ctx.lineWidth = 0.5;
			ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
}

/**
 * Génère et affiche un nouveau donjon
 */
function generateNewDungeon() {
	currentDungeon = dungeonGenerator.generate();
	drawDungeon(currentDungeon);

	// Affiche aussi en console pour debug
	dungeonGenerator.printGrid();
}

// Event listeners
generateBtn.addEventListener("click", generateNewDungeon);

// Génère un donjon au chargement
generateNewDungeon();
