<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import openai from "../config/openaiConfig.js";

const descriptionAndResponses = ref([]);
const prompt = ref("");
const inputField = ref(null);
const isLoading = ref(false);
const error = ref(false);
const loadingDots = ref(0);
const responseContainer = ref(null);

let loadingInterval = null;

const STORAGE_KEY = "descriptionAndResponses";
const STORAGE_TIMESTAMP_KEY = "descriptionAndResponsesTimestamp";
const EXPIRATION_TIME = 3600000; // 1 hour in milliseconds

function savePromptsToLocalStorage() {
  const timestamp = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptionAndResponses.value));
  localStorage.setItem(STORAGE_TIMESTAMP_KEY, timestamp.toString());
}

function loadPromptsFromLocalStorage() {
  const storedPrompts = localStorage.getItem(STORAGE_KEY);
  const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

  if (storedPrompts && storedTimestamp) {
    const now = Date.now();
    const timestamp = parseInt(storedTimestamp, 10);

    if (now - timestamp < EXPIRATION_TIME) {
      descriptionAndResponses.value = JSON.parse(storedPrompts);
    }
  }
}

function clearPromptsAfterExpiration() {
  setInterval(() => {
    const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (storedTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(storedTimestamp, 10);
      if (now - timestamp >= EXPIRATION_TIME) {
        descriptionAndResponses.value = [];
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    }
  }, 60000); // Check every minute
}

async function generateImage(description) {
  if (!prompt.value) return;

  const currentPrompt = prompt.value;

  prompt.value = ""
  if (inputField.value) {
    inputField.value.focus()
  }

  isLoading.value = true;
  error.value = false;
  startLoadingAnimation();

  descriptionAndResponses.value.push({
    prompt: currentPrompt,
    response: "",
  });

  const currentIndex = descriptionAndResponses.value.length - 1;

  await nextTick();
  scrollToBottom();

  try {
    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
    });
    const imageUrl = image.data[0].url;

    descriptionAndResponses.value[currentIndex].response = imageUrl;

    savePromptsToLocalStorage();
  } catch (err) {
    error.value = true;
    descriptionAndResponses.value[currentIndex].response =
      "Failed to generate response.";
  } finally {
    isLoading.value = false;
    startLoadingAnimation();
    await nextTick();
    scrollToBottom();
    if (inputField.value) {
      inputField.value.focus();
    }
  }
}

function scrollToBottom() {
  if (responseContainer.value) {
    responseContainer.value.scroll({
      top: responseContainer.value.scrollHeight,
      behavior: "smooth",
    });
  }
}

function clearPrompts() {
  descriptionAndResponses.value = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  prompt.value = "";
  if (inputField.value) {
    inputField.value.focus();
  }
}

async function regenerateImage(selectedPrompt) {
  prompt.value = selectedPrompt;
  await generateImage();
}

function startLoadingAnimation() {
  stopLoadingAnimation();
  loadingDots.value = 0;
  loadingInterval = setInterval(() => {
    loadingDots.value = (loadingDots.value + 1) % 4;
  }, 500);
}

function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  loadingDots.value = 0;
}

const loadingText = computed(() => {
  return "Generating" + ".".repeat(loadingDots.value);
});

onMounted(() => {
  loadPromptsFromLocalStorage();
  clearPromptsAfterExpiration();
  if (inputField.value) {
    inputField.value.focus();
  }
});

onUnmounted(() => {
  stopLoadingAnimation();
});
</script>

<template>
  <div class="main-container md:block lg:block w-full flex flex-col pt-4 h-screen md:pt-10 lg:pt-5">
    <header class=" h-16 border border-t-0 border-r-0 border-l-0 border-b-hover_color2 pb-2 flex gap-4 items-center md:pb-5 md:gap-8 lg:h-[50px]">
    <font-awesome-icon
      @click="clearPrompts"
      :icon="['fas', 'edit']"
      class="clear-icon z-10 top-[4px] h-[24px] cursor-pointer hover:bg-hover_color2 rounded-lg md:-top-[0px] md:h-10 lg:h-[23px] lg:left-[70px] lg:top-[9px]"
    />
    <button
        type="button"
        class="shimmer-button relative text-center mt-6 bg-hover_color2 w-40 p-1 rounded-lg -top-3 md:-top-[11px] md:text-2xl md:w-56 md:p-2 lg:p-1 lg:text-base lg:w-40"
      >
        <RouterLink class="text-tinWhite font-semibold" to="/chat-completion"
          >Text generation</RouterLink
        >
      </button>
  </header>
  
  <main class="flex flex-col w-full h-full overflow-auto justify-between items-center gap-4 md:h-[95%] lg:h-[93%] xl:h-[95%]">
    <div
        class="inner-content flex-grow flex flex-col overflow-y-scroll w-11/12 m-auto h-full lg:w-[600px] xl:w-[800px] "
        ref="responseContainer"
      >
        <div
          v-if="descriptionAndResponses.length === 0"
          class="placeholder text-3xl font-bold md:text-4xl lg:text-3xl"
        >
          ASK<span class="text-base font-semibold">.AI</span>
        </div>
        <div v-for="(item, index) in descriptionAndResponses" :key="index">
          <div
            class="prompt-container rounded-xl bg-hover_color2 h-auto p-2 text-tinWhite text-base md:text-2xl lg:text-base"
          >
            {{ item.prompt }}
          </div>
          <div class="prompt-response w-full text-tinWhite text-base">
              <img :src="item.response" class="w-60" />
          </div>
        </div>
        <div
          v-if="isLoading"
          class="loading-message text-base bg-hover_color2 text-tinWhite p-2 rounded-xl"
        >
          {{ loadingText }}
        </div>
        <div v-if="error" class="error-message">
          <p>Failed to generate</p>
          <button @click="regenerateImage(prompt)">Regenerate</button>
        </div>
      </div>
    <div
    class="input-section h-[60px] w-11/12 m-auto rounded-[30px] border border-hover_color2 relative bg-hover_color flex md:rounded-[40px] md:h-[80px] lg:w-[650px] lg:h-[60px] lg:rounded-[40px] xl:w-[850px]"
  >
    <textarea
      ref="inputField"
      class="text-tinWhite rounded-[30px] w-[85%] p-[15px] text-[18px] placeholder:font-semibold md:p-[20px] md:rounded-[40px] md:text-xl md:w-[90%] bg-hover_color lg:p-[15px] lg:text-[18px] lg:placeholder:font-semibold lg:placeholder:text-base lg:rounded-[40px]"
      v-model="prompt"
      placeholder="Ask anything.."
      @keydown.enter.prevent="generateImage(prompt)"
      rows="2"
    ></textarea>
    <button
      class="enter-btn absolute right-[10px] top-[7px] h-[45px] w-[45px] border border-hover_color2 rounded-full text-base text-tinWhite bg-hover_color2 font-bold md:h-[60px] md:w-[60px] md:top-[8px] md:right-[14px] md:text-xl md:text-center lg:right-[10px] lg:top-[7px] lg:h-[45px] lg:w-[45px] lg:font-semibold lg:text-base"
      @click="generateImage(prompt)"
    >
      Ask
    </button>
  </div>
</main>
 
  </div>
</template>

<style scoped>

.toggle-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.inner-content {
  margin-block-end: 2px;
}

.inner-content::-webkit-scrollbar {
  display: none;
}

.clear-icon {
  font-size: 16px;
  padding: 10px 20px;
}

.prompt-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 10px auto;
  width: fit-content;
  margin-inline-end: 0;
  text-align: justify;
}

.inner-content-container {
  margin-block-end: 3px;
}

.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
}

.prompt-response {
  display: block;
  font-size: 16px;
  margin: 10px auto;
  width: 100%;
  line-height: 25px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  text-align: justify;
}

textarea {
  outline: none;
  resize: none;
}

div {
  text-align: center;
  margin-bottom: 20px;
}

.loading-message,
.error-message {
  text-align: start;
  margin-top: 20px;
  width: fit-content;
}

.error-message {
  color: red;
}

.error-message button {
  display: inline-block;
  margin-top: 10px;
  padding: 5px 10px;
  font-size: 16px;
  cursor: pointer;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-button {
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
