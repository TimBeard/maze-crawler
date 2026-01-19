<template>
	<div class="slider-row">
		<label>{{ label }}</label>
		<input type="color" :value="modelValue" @input="handleInput" />
		<span class="value">{{ modelValue }}</span>
		<button @click="$emit('reset')">↺</button>
	</div>
</template>

<script setup lang="ts">
const { label, modelValue } = defineProps<{
    label: string
    modelValue: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    reset: []
}>()

function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
}
</script>

<style lang="scss" scoped>
.slider-row {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 5px 0;

	label {
		width: 80px;
		font-size: 12px;
		color: #aaa;
	}

	.value {
		width: 50px;
		font-size: 12px;
		color: #00ffff;
		text-align: right;
	}

	button {
		padding: 2px 8px;
		font-size: 10px;
		margin: 0;
	}
}
</style>
