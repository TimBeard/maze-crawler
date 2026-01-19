<template>
	<div class="app">
		<GameView />
		<ControlsPanel />
	</div>
</template>

<script setup lang="ts">
import ControlsPanel from './components/ControlsPanel.vue'
import GameView from './components/GameView.vue'
</script>

<style lang="scss" scoped>
.app {
	display: flex;
	flex-direction: column;
	align-items: center;
}
</style>
