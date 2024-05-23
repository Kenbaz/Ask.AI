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
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
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
  isLoading.value = true;
  error.value = false;
  startLoadingAnimation();

  descriptionAndResponses.value.push({
    prompt: prompt.value,
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

    prompt.value = "";
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
    <div class="main-container overflow-hidden h-screen">
        <font-awesome-icon @click="clearPrompts" :icon="['fas', 'edit']"
            class="clear-icon z-10 top-[9px] left-0 h-[28px] cursor-pointer hover:bg-hover_color2 rounded-lg md:h-[40px] lg:h-[30px]" />
            <div class="fixed left-20 -top-2 md:left-24">
            <button
              type="button"
              class="shimmer-button text-center mt-[25px] bg-hover_color2 w-40 p-1 rounded-lg text-base md:text-2xl md:p-2 md:w-48 lg:text-base lg:w-40 "
            >
              <RouterLink class="text-tinWhite font-semibold" to="/chat-completion">Text generation</RouterLink>
            </button>
          </div>  
        <div class="inner-content-container w-11/12 m-auto mt-14 h-[82%] md:w-[80%] md:mt-20 lg:mt-16 lg:h-[77%] lg:w-[650px] xl:w-[800px] xl:h-[82%]">
          
            <div class=" h-full">
                <div class="m-auto inner-content h-full rounded-lg" ref="responseContainer">
                    <div v-if="descriptionAndResponses.length === 0" class="placeholder">
                        ASK<span class="text-sm font-semibold">.AI</span>
                    </div>
                    <div v-for="(item, index) in descriptionAndResponses" :key="index">
                        <div class="prompt-container rounded-xl bg-hover_color2 h-auto p-2 text-tinWhite text-base md:text-xl">
                            {{ item.prompt }}
                        </div>
                        <div class="prompt-response w-full text-tinWhite text-base">
                            <img :src="item.response" class="w-60" />
                        </div>
                    </div>
                    <div v-if="isLoading"
                        class="loading-message text-base bg-hover_color2 text-tinWhite p-2 rounded-xl">
                        {{ loadingText }}
                    </div>
                    <div v-if="error" class="error-message">
                        <p>Failed to generate</p>
                        <button @click="regenerateImage(prompt)">Regenerate</button>
                    </div>
                </div>   
            </div> <!--inner-content-container ends-->    
        </div>
        <div class="input-section h-[55px] w-[96%] m-auto rounded-[30px] relative bg-hover_color flex border border-hover_color2 md:w-11/12 md:h-[80px] md:rounded-[40px] lg:w-[700px] lg:h-[55px] xl:w-[870px]">
                    <textarea ref="inputField" class="text-tinWhite bg-hover_color rounded-[30px] p-[14px] h-full w-[85%] placeholder:font-semibold md:rounded-[40px] md:p-[24px] md:placeholder:text-xl md:w-[88%] lg:p-[14px] lg:placeholder:text-base lg:w-[91%]" v-model="prompt"
                        placeholder="Describe picture" @keydown.enter.prevent="generateImage(prompt)"
                        rows="2"></textarea>
                    <button class="enter-btn border border-hover_color2 absolute h-[44px] w-[44px] rounded-full right-[7px] top-[4.7px] text-tinWhite bg-hover_color2 font-semibold md:h-[60px] md:w-[60px] md:right-[14px] md:top-[10px] md:text-xl lg:w-[46px] lg:h-[46px] lg:right-[12px] lg:top-[4.4px] lg:text-base"
                        @click="generateImage(prompt)">
                        Ask
                    </button>
                </div>
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
  /* width: 776px; */
  /* border: 1px solid; */
  overflow-y: scroll;
  margin-block-end: 2px;
}

.inner-content::-webkit-scrollbar {
  display: none;
}

.clear-icon {
  position: fixed;
  font-size: 16px;
  padding: 10px 20px;
}

/* .content {
  position: absolute;
  top: 0;
  left: 250px;
  height: 100vh;
  width: calc(100% - 250px);
  flex-grow: 1;
  padding: 20px;
  transition: left 0.3s ease, width 0.3s ease;
} */

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
  /* border: 1px solid; */
  resize: none;
}

/* .enter-btn {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  top: 4.5px;
  right: 10px;
} */

div {
  text-align: center;
  margin-bottom: 20px;
}

/* p {
  font-size: 18px;
  white-space: pre-wrap;
} */

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
