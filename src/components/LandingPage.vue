<script setup>
</script>

<template>
  <div class="main-container h-screen overflow-hidden">
    <div class=" w-11/12 m-auto h-full lg:w-[80%] xl:w-[65%]">
      <h1 class="text-center text-3xl mt-5 font-bold text-tinWhite md:text-5xl lg:text-4xl lg:mt-32">
        ASK<span class="text-base md:text-2xl lg:text-lg">.AI</span>
      </h1>
      <div class=" mt-7 grid gap-4 md:gap-8 lg:flex lg:gap-4">
        <div class="w-full grid h-auto">
          <h3 class="text-center text-lg text-tinWhite font-bold md:text-2xl lg:text-xl">Text generation model</h3>
          <div class="inner-container text-base border grid place-items-center border-secondary mt-2 bg-hover_color rounded-lg h-60 p-1 md:text-2xl md:h-64 lg:text-base">
            <p class="text-justify h-36">
              An AI model trained to understand natural language, code and images.
              This model provides text output in response to the prompts given to it.
              This model can answer questions ranging from how to lay your sheets to how to prepare your favorite dishes.
            </p>
            <button
              type="button"
              class="shimmer-button text-center mt-6 bg-hover_color2 w-40 p-1 rounded-lg hover:border hover:border-secondary"
            >
              <RouterLink class="text-tinWhite font-semibold" to="/chat-completion">Continue</RouterLink>
            </button>
          </div>
        </div>
        <div class="w-full h-auto">
          <h3 class="text-center text-lg text-tinWhite font-bold md:text-2xl lg:text-xl">Image generation model</h3>
          <div class="inner-container text-base border grid place-items-center border-secondary mt-2 bg-hover_color rounded-lg h-60 p-1 md:text-2xl md:h-64 lg:text-base">
            <p class="text-justify h-36">
              An AI model that creates images from scratch based on a text prompt or image description given to it.
            </p>
            <button
              type="button"
              class="shimmer-button text-center mt-6 bg-hover_color2 w-40 p-1 rounded-lg hover:border hover:border-secondary"
            >
              <RouterLink class="text-tinWhite font-semibold" to="/image-generation">Continue</RouterLink>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <RouterView></RouterView>
</template>


<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-button {
  position: relative;
  overflow: hidden;
}

.shimmer-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 4.5s forwards;
  z-index: 1;
  pointer-events: none;
}

.shimmer-button .text-tinWhite {
  position: relative;
  z-index: 2;
}
</style>
