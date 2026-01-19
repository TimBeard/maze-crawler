<template>
	<div class="controls">
		<div class="camera-controls">
			<h3>📷 Camera Adjustments</h3>
			<SliderControl
				label="X:"
				:modelValue="game.cameraSettings.value.offsetX"
				:min="-2"
				:max="2"
				:step="0.1"
				:decimals="1"
				@update:modelValue="handleCameraOffsetX"
				@reset="resetOffsetX"
			/>
			<SliderControl
				label="Y:"
				:modelValue="game.cameraSettings.value.offsetY"
				:min="-2"
				:max="2"
				:step="0.1"
				:decimals="1"
				@update:modelValue="handleCameraOffsetY"
				@reset="resetOffsetY"
			/>
			<SliderControl
				label="Z:"
				:modelValue="game.cameraSettings.value.offsetZ"
				:min="-2"
				:max="2"
				:step="0.1"
				:decimals="1"
				@update:modelValue="handleCameraOffsetZ"
				@reset="resetOffsetZ"
			/>
			<SliderControl
				label="FOV:"
				:modelValue="game.cameraSettings.value.fov"
				:min="30"
				:max="120"
				:step="5"
				:decimals="0"
				suffix="°"
				@update:modelValue="game.setCameraFOV"
				@reset="resetFOV"
			/>
		</div>

		<div class="camera-controls">
			<h3>🔦 Torche (Joueur)</h3>
			<SliderControl
				label="Intensité:"
				:modelValue="game.torchSettings.value.intensity"
				:min="0"
				:max="10"
				:step="0.1"
				:decimals="1"
				@update:modelValue="game.setTorchIntensity"
				@reset="resetTorchIntensity"
			/>
			<SliderControl
				label="Portée:"
				:modelValue="game.torchSettings.value.distance"
				:min="2"
				:max="20"
				:step="1"
				:decimals="0"
				@update:modelValue="game.setTorchDistance"
				@reset="resetTorchDistance"
			/>
			<ColorControl
				label="Couleur:"
				:modelValue="game.torchSettings.value.color"
				@update:modelValue="game.setTorchColor"
				@reset="resetTorchColor"
			/>
		</div>

		<div class="camera-controls">
			<h3>💡 Lumière Ambiante</h3>
			<SliderControl
				label="Intensité:"
				:modelValue="game.ambientSettings.value.intensity"
				:min="0"
				:max="1"
				:step="0.05"
				:decimals="2"
				@update:modelValue="game.setAmbientIntensity"
				@reset="resetAmbientIntensity"
			/>
			<ColorControl
				label="Couleur:"
				:modelValue="game.ambientSettings.value.color"
				@update:modelValue="game.setAmbientColor"
				@reset="resetAmbientColor"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useGameInstance } from '../composables/useGame'
import ColorControl from './ColorControl.vue'
import SliderControl from './SliderControl.vue'

const game = useGameInstance()

function handleCameraOffsetX(value: number) {
    game.setCameraOffset(value, game.cameraSettings.value.offsetY, game.cameraSettings.value.offsetZ)
}

function handleCameraOffsetY(value: number) {
    game.setCameraOffset(game.cameraSettings.value.offsetX, value, game.cameraSettings.value.offsetZ)
}

function handleCameraOffsetZ(value: number) {
    game.setCameraOffset(game.cameraSettings.value.offsetX, game.cameraSettings.value.offsetY, value)
}

function resetOffsetX() {
    handleCameraOffsetX(0)
}

function resetOffsetY() {
    handleCameraOffsetY(0.5)
}

function resetOffsetZ() {
    handleCameraOffsetZ(0)
}

function resetFOV() {
    game.setCameraFOV(95)
}

function resetTorchIntensity() {
    game.setTorchIntensity(5)
}

function resetTorchDistance() {
    game.setTorchDistance(4)
}

function resetTorchColor() {
    game.setTorchColor('#ff8647')
}

function resetAmbientIntensity() {
    game.setAmbientIntensity(0.25)
}

function resetAmbientColor() {
    game.setAmbientColor('#001e57')
}
</script>

<style lang="scss" scoped>
.controls {
    display: flex;
    gap: 16px;
	margin-top: 20px;
}

button {
	padding: 10px 20px;
	font-family: monospace;
	font-size: 14px;
	cursor: pointer;
	background-color: #333;
	color: #fff;
	border: 2px solid #fff;
	margin: 0 5px;

	&:hover {
		background-color: #555;
	}
}

.camera-controls {
	margin-top: 20px;
	padding: 15px;
	border: 1px solid #444;
	background-color: #111;

	h3 {
		margin: 0 0 10px 0;
		color: #00ffff;
		font-size: 14px;
	}
}
</style>
