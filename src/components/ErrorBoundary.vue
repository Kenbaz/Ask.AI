<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue';

const hasError = ref(false);
const error = ref(null);

const errorCaptured = (err) => {
  hasError.value = true;
  error.value = err;
  return false;
};

defineExpose({ errorCaptured });

onMounted(() => {
  onErrorCaptured((err, instance, info) => errorCaptured(err, instance, info));
});
</script>

<template>
  <div class="h-screen">
    <slot v-if="!hasError" />
    <div v-else class="error-message grid place-content-center text-lg mt-40 md:text-3xl lg:text-4xl">
      <h2>Something went wrong <font-awesome-icon :icon="['fas', 'exclamation']"/></h2>
      <p>Please reload page.</p>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: red;
}
</style>
