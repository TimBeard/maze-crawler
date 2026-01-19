/**
 * Générateur de nombres pseudo-aléatoires avec seed
 * Utilise l'algorithme Mulberry32
 */
export class SeededRandom {
	private currentSeed: number;

	constructor(seed: number) {
		this.currentSeed = seed;
	}

	/**
	 * Retourne un nombre entre 0 et 1
	 */
	public random(): number {
		let t = (this.currentSeed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/**
	 * Retourne un entier entre min (inclus) et max (exclus)
	 */
	public randomInt(min: number, max: number): number {
		return Math.floor(this.random() * (max - min)) + min;
	}

	/**
	 * Retourne la seed courante
	 */
	public getSeed(): number {
		return this.currentSeed;
	}

	/**
	 * Réinitialise avec une nouvelle seed
	 */
	public setSeed(seed: number): void {
		this.currentSeed = seed;
	}
}
