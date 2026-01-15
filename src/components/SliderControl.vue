<template>
	<div class="slider-row">
		<label>{{ label }}</label>
		<input
			type="range"
			:value="modelValue"
			:min="min"
			:max="max"
			:step="step"
			@input="handleInput"
		/>
		<span class="value">{{ displayValue }}</span>
		<button @click="$emit('reset')">↺</button>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		label: string;
		modelValue: number;
		min: number;
		max: number;
		step: number;
		decimals?: number;
		suffix?: string;
	}>(),
	{
		decimals: 1,
		suffix: "",
	},
);

const emit = defineEmits<{
	"update:modelValue": [value: number];
	reset: [];
}>();

const displayValue = computed(() => {
	return props.modelValue.toFixed(props.decimals) + props.suffix;
});

function handleInput(event: Event) {
	const target = event.target as HTMLInputElement;
	emit("update:modelValue", parseFloat(target.value));
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

	input[type="range"] {
		flex: 1;
		max-width: 150px;
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
