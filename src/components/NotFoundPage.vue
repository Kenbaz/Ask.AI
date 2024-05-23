<script setup></script>
<template>
  <div class=" h-screen text-tinWhite">
    <div class="grid place-content-center mt-40 md:mt-44">
    <h1 class="text-center text-xl font-semibold mb-1 md:text-3xl md:mb-[18px] lg:text-5xl">404 Page Not Found</h1>
    <p class="mb-5 text-base md:text-2xl md:mb-7 lg:text-3xl">
      <font-awesome-icon
        :icon="['fas', 'exclamation-circle']"
        class="h-[17px] md:h-[24px] lg:h-[30px]"
      />
      The page you are looking for does not exist
    </p>
    <div class="cursor-pointer text-center bg-hover_color w-32 p-2 rounded-lg ml-[105px] hover:border border-secondary md:w-40 md:p-3 md:ml-[175px] lg:ml-[200px] lg:w-60 lg:h-20">
        <RouterLink to="/" class="font-semibold text-xl md:text-3xl lg:text-4xl">Home</RouterLink>
    </div>
  </div>
  </div>
</template>
