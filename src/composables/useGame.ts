import { type Ref, ref } from 'vue'
import { CellType, DungeonGenerator, type SpawnPoint } from '../game/DungeonGenerator'
import { Player } from '../game/Player'
import { Renderer3DThree } from '../game/Renderer3DThree'
import { SeededRandom } from '../game/SeededRandom'

// Configuration
const GRID_SIZE = 16
const MOVE_DURATION = 200
const ROTATE_DURATION = 150
const FADE_DURATION = 400
const BLACK_SCREEN_DURATION = 200

const COLORS = {
    WALL: '#1a1a3e',
    CORRIDOR: '#e6f2ff',
    GRID_LINE: '#4a4a6e',
    PLAYER: '#ff0000',
    EXIT: '#00ff00',
    UNEXPLORED: '#000000',
}

// Rayon de vision du joueur (en cellules)
const VISION_RADIUS = 1

export interface CameraSettings {
    offsetX: number
    offsetY: number
    offsetZ: number
    fov: number
}

export interface TorchSettings {
    intensity: number
    distance: number
    color: string
}

export interface AmbientSettings {
    intensity: number
    color: string
}

export function useGame() {
    // State
    const seed: Ref<string> = ref('')
    const isTransitioning = ref(false)
    const fadeOpacity = ref(0)
    const currentLevel = ref(1)

    // Game RNG - contrôle toute la partie
    let gameRng: SeededRandom | null = null
    let gameSeed: number = 0

    // Camera settings
    const cameraSettings = ref<CameraSettings>({
        offsetX: 0,
        offsetY: 0.5,
        offsetZ: 0,
        fov: 95,
    })

    // Torch settings
    const torchSettings = ref<TorchSettings>({
        intensity: 5,
        distance: 4,
        color: '#ff8647',
    })

    // Ambient settings
    const ambientSettings = ref<AmbientSettings>({
        intensity: 0.25,
        color: '#001e57',
    })

    // Game instances (non-reactive for performance)
    const dungeonGenerator = new DungeonGenerator(GRID_SIZE, GRID_SIZE)
    const player = new Player()
    let renderer3D: Renderer3DThree | null = null
    let currentDungeon: number[][] | null = null
    let exitPoint = { x: 0, y: 0 }
    let isAnimating = false
    let animationStartTime = 0
    let moveDirection: 'forward' | 'backward' = 'forward'
    let minimapCanvas: HTMLCanvasElement | null = null
    let ctxMinimap: CanvasRenderingContext2D | null = null
    // Set des cellules explorées (format: "x,y")
    let exploredCells: Set<string> = new Set()

    function initRenderer(view3DCanvas: HTMLCanvasElement): void {
        renderer3D = new Renderer3DThree(view3DCanvas)
        applyCameraSettings()
        applyTorchSettings()
        applyAmbientSettings()
    }

    function initMinimap(canvas: HTMLCanvasElement): void {
        minimapCanvas = canvas
        ctxMinimap = canvas.getContext('2d')!
    }

    function applyCameraSettings(): void {
        if (!renderer3D) return
        const { offsetX, offsetY, offsetZ, fov } = cameraSettings.value
        renderer3D.setCameraOffset(offsetX, offsetY, offsetZ)
        renderer3D.setFOV(fov)
        redraw()
    }

    function applyTorchSettings(): void {
        if (!renderer3D) return
        const { intensity, distance, color } = torchSettings.value
        renderer3D.setTorchIntensity(intensity)
        renderer3D.setTorchDistance(distance)
        renderer3D.setTorchColor(color)
        redraw()
    }

    function applyAmbientSettings(): void {
        if (!renderer3D) return
        const { intensity, color } = ambientSettings.value
        renderer3D.setAmbientIntensity(intensity)
        renderer3D.setAmbientColor(color)
        redraw()
    }

    function setCameraOffset(x: number, y: number, z: number): void {
        cameraSettings.value.offsetX = x
        cameraSettings.value.offsetY = y
        cameraSettings.value.offsetZ = z
        applyCameraSettings()
    }

    function setCameraFOV(fov: number): void {
        cameraSettings.value.fov = fov
        applyCameraSettings()
    }

    function setTorchIntensity(intensity: number): void {
        torchSettings.value.intensity = intensity
        applyTorchSettings()
    }

    function setTorchDistance(distance: number): void {
        torchSettings.value.distance = distance
        applyTorchSettings()
    }

    function setTorchColor(color: string): void {
        torchSettings.value.color = color
        applyTorchSettings()
    }

    function setAmbientIntensity(intensity: number): void {
        ambientSettings.value.intensity = intensity
        applyAmbientSettings()
    }

    function setAmbientColor(color: string): void {
        ambientSettings.value.color = color
        applyAmbientSettings()
    }

    function resetCameraSettings(): void {
        cameraSettings.value = {
            offsetX: 0,
            offsetY: 0.5,
            offsetZ: 0,
            fov: 95,
        }
        applyCameraSettings()
    }

    function resetTorchSettings(): void {
        torchSettings.value = {
            intensity: 5,
            distance: 4,
            color: '#ff8647',
        }
        applyTorchSettings()
    }

    function resetAmbientSettings(): void {
        ambientSettings.value = {
            intensity: 0.25,
            color: '#001e57',
        }
        applyAmbientSettings()
    }

    function getMinimapCellSize(): number {
        return minimapCanvas ? minimapCanvas.width / GRID_SIZE : 16
    }

    /**
     * Révèle les cellules autour de la position du joueur
     */
    function revealAroundPlayer(): void {
        const px = player.x
        const py = player.y

        for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
            for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
                const nx = px + dx
                const ny = py + dy

                // Vérifier les limites de la grille
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    exploredCells.add(`${nx},${ny}`)
                }
            }
        }
    }

    function drawExit(): void {
        if (!ctxMinimap) return
        const cellSize = getMinimapCellSize()
        const x = exitPoint.x * cellSize
        const y = exitPoint.y * cellSize
        const poleWidth = cellSize * 0.1
        const poleHeight = cellSize * 0.8
        const flagWidth = cellSize * 0.5
        const flagHeight = cellSize * 0.35

        // Perche noire
        ctxMinimap.fillStyle = '#000000'
        ctxMinimap.fillRect(x + cellSize * 0.25, y + cellSize * 0.1, poleWidth, poleHeight)

        // Drapeau vert
        ctxMinimap.fillStyle = COLORS.EXIT
        ctxMinimap.beginPath()
        ctxMinimap.moveTo(x + cellSize * 0.25 + poleWidth, y + cellSize * 0.1)
        ctxMinimap.lineTo(x + cellSize * 0.25 + poleWidth + flagWidth, y + cellSize * 0.1 + flagHeight / 2)
        ctxMinimap.lineTo(x + cellSize * 0.25 + poleWidth, y + cellSize * 0.1 + flagHeight)
        ctxMinimap.closePath()
        ctxMinimap.fill()
    }

    function drawPlayer(offsetX: number = 0, offsetY: number = 0, rotationOffset: number = 0): void {
        if (!ctxMinimap) return
        const cellSize = getMinimapCellSize()
        const centerX = (player.x + offsetX) * cellSize + cellSize / 2
        const centerY = (player.y + offsetY) * cellSize + cellSize / 2
        const size = cellSize * 0.6

        ctxMinimap.save()
        ctxMinimap.translate(centerX, centerY)
        ctxMinimap.rotate(player.getRotationAngle() + rotationOffset)

        ctxMinimap.fillStyle = COLORS.PLAYER
        ctxMinimap.beginPath()
        ctxMinimap.moveTo(0, -size / 2)
        ctxMinimap.lineTo(-size / 3, size / 3)
        ctxMinimap.lineTo(size / 3, size / 3)
        ctxMinimap.closePath()
        ctxMinimap.fill()

        ctxMinimap.restore()
    }

    function drawMinimap(grid: number[][]): void {
        if (!ctxMinimap || !minimapCanvas) return
        const cellSize = getMinimapCellSize()

        // Fond noir (zones non explorées)
        ctxMinimap.fillStyle = COLORS.UNEXPLORED
        ctxMinimap.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height)

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Ne dessiner que les cellules explorées
                if (!exploredCells.has(`${x},${y}`)) continue

                const cellType = grid[y][x]

                switch (cellType) {
                    case CellType.WALL:
                        ctxMinimap.fillStyle = COLORS.WALL
                        break
                    case CellType.CORRIDOR:
                        ctxMinimap.fillStyle = COLORS.CORRIDOR
                        break
                }

                ctxMinimap.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

                ctxMinimap.strokeStyle = COLORS.GRID_LINE
                ctxMinimap.lineWidth = 0.5
                ctxMinimap.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize)
            }
        }

        // Ne dessiner la sortie que si elle est explorée
        if (exploredCells.has(`${exitPoint.x},${exitPoint.y}`)) {
            drawExit()
        }
    }

    function drawGame(grid: number[][], moveProgress: number = 0, rotationOffset: number = 0): void {
        let offsetX = 0
        let offsetY = 0

        if (moveProgress !== 0) {
            const dirVectors = [
                { dx: 0, dy: -1 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
            ]
            const dir = dirVectors[player.direction]
            const sign = moveDirection === 'forward' ? 1 : -1
            offsetX = dir.dx * moveProgress * sign
            offsetY = dir.dy * moveProgress * sign
        }

        const actualMoveProgress = moveDirection === 'backward' ? -moveProgress : moveProgress

        if (renderer3D) {
            renderer3D.render(grid, player.x, player.y, player.direction, actualMoveProgress, rotationOffset, exitPoint)
        }

        drawMinimap(grid)
        drawPlayer(offsetX, offsetY, rotationOffset)
    }

    function redraw(): void {
        if (currentDungeon) {
            drawGame(currentDungeon)
        }
    }

    function drawFadeOverlay(opacity: number): void {
        fadeOpacity.value = opacity

        if (ctxMinimap && minimapCanvas) {
            ctxMinimap.fillStyle = `rgba(0, 0, 0, ${opacity})`
            ctxMinimap.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height)
        }
    }

    function transitionToNewDungeon(forcedSpawn: SpawnPoint): void {
        if (isTransitioning.value) return
        isTransitioning.value = true

        let fadeOutStart: number | null = null

        function fadeOut(timestamp: number): void {
            if (!fadeOutStart) fadeOutStart = timestamp
            const elapsed = timestamp - fadeOutStart
            const progress = Math.min(elapsed / FADE_DURATION, 1)

            if (currentDungeon) {
                drawGame(currentDungeon)
            }
            drawFadeOverlay(progress)

            if (progress < 1) {
                requestAnimationFrame(fadeOut)
            } else {
                fadeOpacity.value = 1
                if (ctxMinimap && minimapCanvas) {
                    ctxMinimap.fillStyle = '#000'
                    ctxMinimap.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height)
                }

                seed.value = ''
                generateNewDungeon(forcedSpawn)

                setTimeout(() => {
                    let fadeInStart: number | null = null
                    function fadeIn(timestamp: number): void {
                        if (!fadeInStart) fadeInStart = timestamp
                        const elapsed = timestamp - fadeInStart
                        const progress = Math.min(elapsed / FADE_DURATION, 1)

                        if (currentDungeon) {
                            drawGame(currentDungeon)
                        }
                        drawFadeOverlay(1 - progress)

                        if (progress < 1) {
                            requestAnimationFrame(fadeIn)
                        } else {
                            isTransitioning.value = false
                        }
                    }
                    requestAnimationFrame(fadeIn)
                }, BLACK_SCREEN_DURATION)
            }
        }
        requestAnimationFrame(fadeOut)
    }

    function generateNewDungeon(forcedSpawn?: SpawnPoint): void {
        const seedValue = seed.value.trim()

        // Si c'est un nouveau donjon (pas de forcedSpawn), c'est une nouvelle partie
        if (!forcedSpawn) {
            gameSeed = seedValue ? parseInt(seedValue, 10) : Date.now()
            gameRng = new SeededRandom(gameSeed)
            currentLevel.value = 1
            seed.value = gameSeed.toString()
        } else {
            // Niveau suivant
            currentLevel.value++
        }

        // Utiliser le RNG de la partie pour générer la seed du donjon
        const dungeonSeed = gameRng!.randomInt(0, 2147483647)
        currentDungeon = dungeonGenerator.generate(dungeonSeed, forcedSpawn)

        if (renderer3D && gameRng) {
            renderer3D.refreshDungeonColors(gameRng)
        }
        player.spawn(dungeonGenerator.getSpawnPoint())
        exitPoint = dungeonGenerator.getExitPoint()

        // Réinitialiser et révéler la zone autour du spawn
        exploredCells = new Set()
        revealAroundPlayer()

        if (currentDungeon) {
            drawGame(currentDungeon)
        }
    }

    function randomizeSeed(): void {
        seed.value = Date.now().toString()
    }

    function easeOutCubic(t: number): number {
        return 1 - (1 - t) ** 3
    }

    function animateMove(direction: 'forward' | 'backward', onComplete: () => void): void {
        if (!currentDungeon) return

        isAnimating = true
        moveDirection = direction
        animationStartTime = performance.now()

        function animate(timestamp: number): void {
            const elapsed = timestamp - animationStartTime
            const rawProgress = Math.min(elapsed / MOVE_DURATION, 1)
            const animationProgress = easeOutCubic(rawProgress)

            drawGame(currentDungeon!, animationProgress, 0)

            if (rawProgress < 1) {
                requestAnimationFrame(animate)
            } else {
                isAnimating = false
                onComplete()
            }
        }

        requestAnimationFrame(animate)
    }

    function animateRotate(direction: 'cw' | 'ccw', onComplete: () => void): void {
        if (!currentDungeon) return

        isAnimating = true
        animationStartTime = performance.now()

        const targetRotation = direction === 'cw' ? Math.PI / 2 : -Math.PI / 2

        function animate(timestamp: number): void {
            const elapsed = timestamp - animationStartTime
            const rawProgress = Math.min(elapsed / ROTATE_DURATION, 1)
            const easedProgress = easeOutCubic(rawProgress)
            const rotationOffset = targetRotation * easedProgress

            drawGame(currentDungeon!, 0, rotationOffset)

            if (rawProgress < 1) {
                requestAnimationFrame(animate)
            } else {
                isAnimating = false
                onComplete()
            }
        }

        requestAnimationFrame(animate)
    }

    function isOnExit(): boolean {
        return player.x === exitPoint.x && player.y === exitPoint.y
    }

    function triggerExit(): void {
        const previousExit: SpawnPoint = {
            x: exitPoint.x,
            y: exitPoint.y,
            direction: player.direction,
        }
        transitionToNewDungeon(previousExit)
    }

    function handleKeydown(e: KeyboardEvent): void {
        if (!currentDungeon || isTransitioning.value || isAnimating) return

        switch (e.key) {
            case 'ArrowUp':
                // Si on est sur la sortie et qu'on avance vers le mur (fond du cul-de-sac), déclencher la transition
                if (isOnExit() && !player.canMove(currentDungeon, CellType.CORRIDOR, 'forward')) {
                    e.preventDefault()
                    triggerExit()
                    return
                }
                if (player.canMove(currentDungeon, CellType.CORRIDOR, 'forward')) {
                    e.preventDefault()
                    animateMove('forward', () => {
                        player.moveForward(currentDungeon!, CellType.CORRIDOR)
                        revealAroundPlayer()
                        drawGame(currentDungeon!)
                    })
                }
                break
            case 'ArrowDown':
                if (player.canMove(currentDungeon, CellType.CORRIDOR, 'backward')) {
                    e.preventDefault()
                    animateMove('backward', () => {
                        player.moveBackward(currentDungeon!, CellType.CORRIDOR)
                        revealAroundPlayer()
                        drawGame(currentDungeon!)
                    })
                }
                break
            case 'ArrowRight':
                e.preventDefault()
                animateRotate('cw', () => {
                    player.rotateClockwise()
                    drawGame(currentDungeon!)
                })
                break
            case 'ArrowLeft':
                e.preventDefault()
                animateRotate('ccw', () => {
                    player.rotateCounterClockwise()
                    drawGame(currentDungeon!)
                })
                break
        }
    }

    return {
        // State
        seed,
        isTransitioning,
        fadeOpacity,
        currentLevel,
        cameraSettings,
        torchSettings,
        ambientSettings,

        // Init
        initRenderer,
        initMinimap,

        // Actions
        generateNewDungeon,
        randomizeSeed,
        handleKeydown,

        // Camera controls
        setCameraOffset,
        setCameraFOV,
        resetCameraSettings,

        // Torch controls
        setTorchIntensity,
        setTorchDistance,
        setTorchColor,
        resetTorchSettings,

        // Ambient controls
        setAmbientIntensity,
        setAmbientColor,
        resetAmbientSettings,
    }
}

// Singleton instance
let gameInstance: ReturnType<typeof useGame> | null = null

export function useGameInstance() {
    if (!gameInstance) {
        gameInstance = useGame()
    }
    return gameInstance
}
