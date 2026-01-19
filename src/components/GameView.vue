<template>
	<div class="game-container">
		<canvas ref="view3DRef" id="view3D" width="640" height="480"></canvas>
        <canvas ref="minimapRef" id="minimapCanvas" width="256" height="256"></canvas>
		<!-- Fade overlay for transitions -->
		<div
			class="fade-overlay"
			:style="{ opacity: game.fadeOpacity.value }"
		></div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useGameInstance } from "../composables/useGame";

const game = useGameInstance();
const view3DRef = ref<HTMLCanvasElement | null>(null);
const minimapRef = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
	if (view3DRef.value) {
		game.initRenderer(view3DRef.value);
	}
	if (minimapRef.value) {
		game.initMinimap(minimapRef.value);
	}
	game.generateNewDungeon();

	document.addEventListener("keydown", game.handleKeydown);
});

onUnmounted(() => {
	document.removeEventListener("keydown", game.handleKeydown);
});
</script>

<style lang="scss" scoped>
.game-container {
	display: flex;
	gap: 20px;
	align-items: flex-start;
	position: relative;
}

#view3D {
	border: 2px solid #00ffff;
	image-rendering: crisp-edges;
}

#minimapCanvas {
	border: 2px solid #fff;
	image-rendering: crisp-edges;
}

.minimap-label {
	text-align: center;
	margin-bottom: 5px;
	color: #888;
	font-size: 12px;
}

.fade-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: black;
	pointer-events: none;
	z-index: 1000;
}
</style>
