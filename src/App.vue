<script setup>
import ErrorBoundary from './components/ErrorBoundary.vue';
</script>

<template>
  <div id="app">
    <nav>
      <RouterLink to="/"></RouterLink>
    </nav>
    <ErrorBoundary>
      <RouterView></RouterView>
    </ErrorBoundary>
  </div>
</template>

