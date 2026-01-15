/**
 * Renderer 3D avec Three.js pour la vue à la première personne
 * Style Phantasy Star / Eye of the Beholder avec textures de briques
 */

import * as THREE from "three";
import { CellType } from "./DungeonGenerator";

// Taille d'une cellule du labyrinthe
const CELL_SIZE = 2;
const WALL_HEIGHT = 2;

/**
 * Classe pour le rendu 3D avec Three.js
 */
export class Renderer3DThree {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private wallMaterial: THREE.MeshStandardMaterial;
	private wallTexture: THREE.CanvasTexture;
	private floorMaterial: THREE.MeshStandardMaterial;
	private ceilingMaterial: THREE.MeshStandardMaterial;

	private wallMeshes: THREE.Mesh[] = [];
	private floorMesh: THREE.Mesh | null = null;
	private ceilingMesh: THREE.Mesh | null = null;

	private currentGrid: number[][] | null = null;

	// Éclairage
	private playerLight: THREE.PointLight;
	private ambientLight: THREE.AmbientLight;

	// Camera adjustments
	private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
	private cameraRotationOffset: number = 0;
	private cameraHeight: number = 0.5;

	// Couleurs du donjon (aléatoires)
	private brickColor: string = "#00aaaa";
	private borderColor: string = "#00ffff";
	private wallFillColor: string = "#0a1a2a";
	private floorColor: number = 0x004444;
	private ceilingColor: number = 0x0a1a2a;

	constructor(canvas: HTMLCanvasElement) {
		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		// Camera
		this.camera = new THREE.PerspectiveCamera(
			95,
			canvas.width / canvas.height,
			0.1,
			100,
		);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: false, // Style rétro
		});
		this.renderer.setSize(canvas.width, canvas.height);

		// Éclairage - Lumière du joueur (torche)
		this.playerLight = new THREE.PointLight(0xff8647, 5, 4, 1);
		this.playerLight.position.set(0, 0.5, 0);
		this.scene.add(this.playerLight);

		// Lumière ambiante très faible
		this.ambientLight = new THREE.AmbientLight(0x001e57, 0.25);
		this.scene.add(this.ambientLight);

		// Générer les couleurs initiales du donjon
		this.generateDungeonColors();

		// Créer la texture de briques
		this.wallTexture = this.createBrickTexture();

		// Matériaux - MeshStandardMaterial pour réagir à la lumière
		this.wallMaterial = new THREE.MeshStandardMaterial({
			map: this.wallTexture,
			roughness: 0.9,
			metalness: 0.0,
		});

		this.floorMaterial = new THREE.MeshStandardMaterial({
			color: this.floorColor,
			roughness: 0.8,
			metalness: 0.0,
		});

		this.ceilingMaterial = new THREE.MeshStandardMaterial({
			color: this.ceilingColor,
			roughness: 0.9,
			metalness: 0.0,
		});
	}

	/**
	 * Génère des couleurs aléatoires pour le donjon
	 */
	public generateDungeonColors(): void {
		// Générer une teinte aléatoire (0-360)
		const hue = Math.random() * 360;

		// Couleur des bordures (vive, saturée)
		this.borderColor = this.hslToHex(hue, 100, 50);

		// Couleur des briques (même teinte, moins saturée/lumineuse)
		this.brickColor = this.hslToHex(hue, 70, 35);

		// Couleur de remplissage des murs (très sombre avec la teinte)
		this.wallFillColor = this.hslToHex(hue, 40, 8);

		// Couleur du sol (teinte similaire, plus sombre)
		this.floorColor = parseInt(this.hslToHex(hue, 50, 15).replace("#", ""), 16);

		// Couleur du plafond (même que le remplissage des murs)
		this.ceilingColor = parseInt(this.wallFillColor.replace("#", ""), 16);
	}

	/**
	 * Convertit HSL en hexadécimal
	 */
	private hslToHex(h: number, s: number, l: number): string {
		s /= 100;
		l /= 100;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color)
				.toString(16)
				.padStart(2, "0");
		};
		return `#${f(0)}${f(8)}${f(4)}`;
	}

	/**
	 * Met à jour les couleurs du donjon et rafraîchit les matériaux
	 */
	public refreshDungeonColors(): void {
		this.generateDungeonColors();

		// Recréer la texture de briques avec les nouvelles couleurs
		this.wallTexture.dispose();
		this.wallTexture = this.createBrickTexture();
		this.wallMaterial.map = this.wallTexture;
		this.wallMaterial.needsUpdate = true;

		// Mettre à jour les couleurs du sol et plafond
		this.floorMaterial.color.setHex(this.floorColor);
		this.ceilingMaterial.color.setHex(this.ceilingColor);
	}

	/**
	 * Crée une texture de briques en canvas
	 */
	private createBrickTexture(): THREE.CanvasTexture {
		const size = 256; // Résolution doublée pour plus de finesse
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d")!;

		// Fond
		ctx.fillStyle = this.wallFillColor;
		ctx.fillRect(0, 0, size, size);

		// Briques (même nombre, mais plus de détails grâce à la résolution doublée)
		const rows = 6;
		const cols = 4;
		const brickHeight = size / rows;
		const brickWidth = size / cols;

		ctx.strokeStyle = this.brickColor;
		ctx.lineWidth = 1; // Lignes très fines

		// Lignes horizontales
		for (let i = 0; i <= rows; i++) {
			const y = i * brickHeight;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(size, y);
			ctx.stroke();
		}

		// Lignes verticales avec offset
		for (let row = 0; row < rows; row++) {
			const offset = (row % 2) * (brickWidth / 2);
			const y1 = row * brickHeight;
			const y2 = (row + 1) * brickHeight;

			for (let col = 0; col <= cols; col++) {
				const x = col * brickWidth + offset;
				if (x <= size) {
					ctx.beginPath();
					ctx.moveTo(x, y1);
					ctx.lineTo(x, y2);
					ctx.stroke();
				}
			}
		}

		// Contour (bordure)
		ctx.strokeStyle = this.borderColor;
		ctx.lineWidth = 1.5; // Lignes très fines
		ctx.strokeRect(1, 1, size - 2, size - 2);

		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;

		return texture;
	}

	/**
	 * Construit la géométrie du labyrinthe
	 */
	public buildMaze(grid: number[][]): void {
		this.currentGrid = grid;

		// Nettoyer l'ancienne géométrie
		this.clearMaze();

		const height = grid.length;
		const width = grid[0].length;

		// Créer le sol
		const floorGeometry = new THREE.PlaneGeometry(
			width * CELL_SIZE,
			height * CELL_SIZE,
		);
		this.floorMesh = new THREE.Mesh(floorGeometry, this.floorMaterial);
		this.floorMesh.rotation.x = -Math.PI / 2;
		this.floorMesh.position.set(
			(width * CELL_SIZE) / 2 - CELL_SIZE / 2,
			0,
			(height * CELL_SIZE) / 2 - CELL_SIZE / 2,
		);
		this.scene.add(this.floorMesh);

		// Créer le plafond
		const ceilingGeometry = new THREE.PlaneGeometry(
			width * CELL_SIZE,
			height * CELL_SIZE,
		);
		this.ceilingMesh = new THREE.Mesh(ceilingGeometry, this.ceilingMaterial);
		this.ceilingMesh.rotation.x = Math.PI / 2;
		this.ceilingMesh.position.set(
			(width * CELL_SIZE) / 2 - CELL_SIZE / 2,
			WALL_HEIGHT,
			(height * CELL_SIZE) / 2 - CELL_SIZE / 2,
		);
		this.scene.add(this.ceilingMesh);

		// Créer les murs
		const wallGeometry = new THREE.BoxGeometry(
			CELL_SIZE,
			WALL_HEIGHT,
			CELL_SIZE,
		);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (grid[y][x] === CellType.WALL) {
					const wall = new THREE.Mesh(wallGeometry, this.wallMaterial);
					wall.position.set(x * CELL_SIZE, WALL_HEIGHT / 2, y * CELL_SIZE);
					this.scene.add(wall);
					this.wallMeshes.push(wall);
				}
			}
		}
	}

	/**
	 * Nettoie le labyrinthe actuel
	 */
	private clearMaze(): void {
		for (const mesh of this.wallMeshes) {
			this.scene.remove(mesh);
			mesh.geometry.dispose();
		}
		this.wallMeshes = [];

		if (this.floorMesh) {
			this.scene.remove(this.floorMesh);
			this.floorMesh.geometry.dispose();
			this.floorMesh = null;
		}

		if (this.ceilingMesh) {
			this.scene.remove(this.ceilingMesh);
			this.ceilingMesh.geometry.dispose();
			this.ceilingMesh = null;
		}
	}

	/**
	 * Met à jour la position et rotation de la caméra
	 */
	public updateCamera(
		playerX: number,
		playerY: number,
		direction: number,
	): void {
		// Position de la caméra
		this.camera.position.set(
			playerX * CELL_SIZE,
			WALL_HEIGHT / 2,
			playerY * CELL_SIZE,
		);

		// Direction (0=Nord, 1=Est, 2=Sud, 3=Ouest)
		const angles = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
		this.camera.rotation.y = angles[direction];
	}

	/**
	 * Rendu de la scène
	 */
	public render(
		grid: number[][],
		playerX: number,
		playerY: number,
		direction: number,
		moveProgress: number = 0,
		rotationOffset: number = 0,
	): void {
		// Reconstruire le labyrinthe si nécessaire
		if (this.currentGrid !== grid) {
			this.buildMaze(grid);
		}

		// Calcul de la position avec interpolation de mouvement
		// Dans le jeu: 0=Nord(y-), 1=Est(x+), 2=Sud(y+), 3=Ouest(x-)
		// Dans Three.js: Z+ = vers nous, Z- = devant, X+ = droite
		// Donc Nord (y-) = Z-, Est (x+) = X+, Sud (y+) = Z+, Ouest (x-) = X-
		const dirVectors = [
			{ dx: 0, dz: -1 }, // Nord -> Z-
			{ dx: 1, dz: 0 }, // Est -> X+
			{ dx: 0, dz: 1 }, // Sud -> Z+
			{ dx: -1, dz: 0 }, // Ouest -> X-
		];

		const forward = dirVectors[direction];
		const right = dirVectors[(direction + 1) % 4]; // Vecteur droite relatif à la direction
		const baseX = playerX * CELL_SIZE;
		const baseZ = playerY * CELL_SIZE;

		// Interpolation de la position
		const posX = baseX + forward.dx * CELL_SIZE * moveProgress;
		const posZ = baseZ + forward.dz * CELL_SIZE * moveProgress;

		// Appliquer les offsets dans le référentiel de la caméra
		// X = droite/gauche relatif à la direction du regard
		// Z = avant/arrière relatif à la direction du regard
		const worldOffsetX =
			this.cameraOffset.x * right.dx + this.cameraOffset.z * forward.dx;
		const worldOffsetZ =
			this.cameraOffset.x * right.dz + this.cameraOffset.z * forward.dz;

		this.camera.position.set(
			posX + worldOffsetX,
			this.cameraHeight + this.cameraOffset.y,
			posZ + worldOffsetZ,
		);

		// La lumière suit la caméra
		this.playerLight.position.copy(this.camera.position);

		// Direction avec interpolation de rotation
		// 0=Nord(regarde Z-), 1=Est(regarde X+), 2=Sud(regarde Z+), 3=Ouest(regarde X-)
		// En Three.js, rotation.y = 0 regarde Z-, PI/2 regarde X-, PI regarde Z+, -PI/2 regarde X+
		const angles = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
		const baseAngle = angles[direction];
		this.camera.rotation.y =
			baseAngle - rotationOffset + this.cameraRotationOffset;

		// Rendu
		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * Ajuste l'offset de la caméra
	 */
	public setCameraOffset(x: number, y: number, z: number): void {
		this.cameraOffset.set(x, y, z);
	}

	/**
	 * Ajuste la rotation de la caméra (en radians)
	 */
	public setCameraRotationOffset(radians: number): void {
		this.cameraRotationOffset = radians;
	}

	/**
	 * Ajuste la hauteur de la caméra
	 */
	public setCameraHeight(height: number): void {
		this.cameraHeight = height;
	}

	/**
	 * Ajuste le FOV de la caméra
	 */
	public setFOV(fov: number): void {
		this.camera.fov = fov;
		this.camera.updateProjectionMatrix();
	}

	/**
	 * Ajuste l'intensité de la torche
	 */
	public setTorchIntensity(intensity: number): void {
		this.playerLight.intensity = intensity;
	}

	/**
	 * Ajuste la portée de la torche
	 */
	public setTorchDistance(distance: number): void {
		this.playerLight.distance = distance;
	}

	/**
	 * Ajuste la couleur de la torche
	 */
	public setTorchColor(color: string): void {
		this.playerLight.color.set(color);
	}

	/**
	 * Ajuste l'intensité de la lumière ambiante
	 */
	public setAmbientIntensity(intensity: number): void {
		this.ambientLight.intensity = intensity;
	}

	/**
	 * Ajuste la couleur de la lumière ambiante
	 */
	public setAmbientColor(color: string): void {
		this.ambientLight.color.set(color);
	}

	/**
	 * Redimensionne le renderer
	 */
	public resize(width: number, height: number): void {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	}

	/**
	 * Libère les ressources
	 */
	public dispose(): void {
		this.clearMaze();
		this.wallMaterial.dispose();
		this.wallTexture.dispose();
		this.floorMaterial.dispose();
		this.ceilingMaterial.dispose();
		this.renderer.dispose();
	}
}
