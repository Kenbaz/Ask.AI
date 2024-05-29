<script setup>
import ErrorBoundary from './components/ErrorBoundary.vue';
</script>

<template>
  <div id="app">
      <RouterLink to="/"></RouterLink>
    <ErrorBoundary>
      <RouterView></RouterView>
    </ErrorBoundary>
  </div>
</template>

