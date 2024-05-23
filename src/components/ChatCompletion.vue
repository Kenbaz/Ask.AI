<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import openai from "../config/openaiConfig.js";

const promptsAndResponses = ref([]);
const promptHistory = ref([]);
const prompt = ref("");
const sidebarVisible = ref(true);
const inputField = ref(null);
const isLoading = ref(false);
const error = ref(false);
const loadingDots = ref(0);
const responseContainer = ref(null);

let isRegenerating = false;
let loadingInterval = null;

const STORAGE_KEY = "promptsAndResponses";
const STORAGE_TIMESTAMP_KEY = "promptsAndResponsesTimestamp";
const HISTORY_KEY = "promptsHistory";
const HISTORY_TIMESTAMP_KEY = "promptHistoryTimestamp";
const EXPIRATION_TIME = 3600000; // 1 hour in milliseconds

function savePromptsToLocalStorage() {
  const timestamp = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(promptsAndResponses.value));
  localStorage.setItem(STORAGE_TIMESTAMP_KEY, timestamp.toString());
}

function saveHistoryToLocalStorage() {
  const timestamp = Date.now();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(promptHistory.value));
  localStorage.setItem(HISTORY_TIMESTAMP_KEY, timestamp.toString());
}

function loadHistoryFromLocalStorage() {
  const storedHistory = localStorage.getItem(HISTORY_KEY);
  const storedTimestamp = localStorage.getItem(HISTORY_TIMESTAMP_KEY);

  if (storedHistory && storedTimestamp) {
    const now = Date.now();
    const timestamp = parseInt(storedTimestamp, 10);

    if (now - timestamp < EXPIRATION_TIME) {
      promptHistory.value = JSON.parse(storedHistory);
    } else {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(HISTORY_TIMESTAMP_KEY);
    }
  }
}

function clearHistoryAfterExpiration() {
  setInterval(() => {
    const storedTimestamp = localStorage.getItem(HISTORY_TIMESTAMP_KEY);
    if (storedTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(storedTimestamp, 10);
      if (now - timestamp >= EXPIRATION_TIME) {
        promptHistory.value = [];
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(HISTORY_TIMESTAMP_KEY);
      }
    }
  }, 60000);
}

function loadPromptsFromLocalStorage() {
  const storedPrompts = localStorage.getItem(STORAGE_KEY);
  const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

  if (storedPrompts && storedTimestamp) {
    const now = Date.now();
    const timestamp = parseInt(storedTimestamp, 10);

    if (now - timestamp < EXPIRATION_TIME) {
      promptsAndResponses.value = JSON.parse(storedPrompts);
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
        promptsAndResponses.value = [];
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    }
  }, 60000); // Check every minute
}

async function generateResponse() {
  if (!prompt.value) return;
  isLoading.value = true;
  error.value = false;
  startLoadingAnimation();

  promptsAndResponses.value.push({
    prompt: prompt.value,
    response: "",
  });

  if (!isRegenerating) {
    promptHistory.value.push({
      prompt: prompt.value,
      response: "",
    });
  }

  const currentIndex = promptsAndResponses.value.length - 1;

  await nextTick();
  scrollToBottom();

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt.value }],
      max_tokens: 100,
    });
    const newResponse = res.choices[0].message.content;

    promptsAndResponses.value[currentIndex].response = newResponse;

    if (!isRegenerating) {
      promptHistory.value[promptHistory.value.length - 1].response =
        newResponse;
    }

    prompt.value = "";
    savePromptsToLocalStorage();
    saveHistoryToLocalStorage();
  } catch (err) {
    error.value = true;
    promptsAndResponses.value[currentIndex].response =
      "Failed to generate response.";
  } finally {
    isLoading.value = false;
    isRegenerating = false;
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

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value;
}

function clearPrompts() {
  promptsAndResponses.value = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  prompt.value = "";
  if (inputField.value) {
    inputField.value.focus();
  }
}

async function regenerateResponse(selectedPrompt) {
  isRegenerating = true;
  prompt.value = selectedPrompt;
  await generateResponse();
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
  loadHistoryFromLocalStorage();
  clearHistoryAfterExpiration();
  if (inputField.value) {
    inputField.value.focus();
  }
});

onUnmounted(() => {
  stopLoadingAnimation();
});
</script>

<template>
  <div class="main-container h-screen">
    <font-awesome-icon
      @click="toggleSidebar"
      class="z-10 toggle-btn h-[23px] hover:bg-hover_color2 hover:rounded-lg hidden lg:block"
      :icon="['fas', sidebarVisible ? 'columns' : 'columns']"
    />
    <div
      :class="['sidebar', { close: !sidebarVisible }]"
      class="hidden lg:block lg:bg-hover_color"
    >
      <h2 class="mt-14 font-semibold text-tinWhite">History</h2>
      <ul class="h-auto">
        <li
          v-for="(item, index) in promptHistory"
          :key="index"
          @click="regenerateResponse(item.prompt)"
          class="sidebar-prompt cursor-pointer text-tinWhite grid justify-start h-auto p-2 hover:bg-hover_color2 rounded-lg"
        >
          {{ item.prompt }}
        </li>
      </ul>
      <button
        type="button"
        class="shimmer-button text-center mt-6 bg-hover_color2 w-40 p-1 lg:absolute lg:left-8"
      >
        <RouterLink class="text-tinWhite font-semibold" to="/image-generation"
          >Image generation</RouterLink
        >
      </button>
    </div>
    <font-awesome-icon
      @click="clearPrompts"
      :icon="['fas', 'edit']"
      class="clear-icon z-10 top-[5px] left-[20px] h-[30px] cursor-pointer hover:bg-hover_color2 rounded-lg md:h-10 lg:h-[23px] lg:left-[70px] lg:top-[9px]"
    />

    <div
      :class="['content', { expanded: !sidebarVisible }]"
      class="absolute left-0 w-full overflow-hidden h-full lg:top-0 lg:left-[250px] lg:content-custom"
    >
      <button
        type="button"
        class="shimmer-button fixed text-center mt-6 bg-hover_color2 w-40 p-1 rounded-lg -top-2 left-[100px] md:-top-[13px] md:text-2xl md:w-56 md:left-40 md:p-2 lg:hidden"
      >
        <RouterLink class="text-tinWhite font-semibold" to="/image-generation"
          >Image generation</RouterLink
        >
      </button>
      
        <div
          class="inner-content w-11/12 m-auto border mt-[14%] min-h-[85%] md:mt-16 lg:mt-3 lg:w-[600px] lg:rounded-xl xl:w-[800px] xl:h-[89%]"
          ref="responseContainer"
        >
          <div
            v-if="promptsAndResponses.length === 0"
            class="placeholder text-3xl font-bold md:text-4xl lg:text-3xl"
          >
            ASK<span class="text-base font-semibold">.AI</span>
          </div>
          <div v-for="(item, index) in promptsAndResponses" :key="index">
            <div
              class="prompt-container rounded-xl bg-hover_color2 h-auto p-2 text-tinWhite text-base md:text-2xl lg:text-base"
            >
              {{ item.prompt }}
            </div>
            <div
              class="prompt-response justify-text text-tinWhite text-pretty text-base leading-8 md:text-xl md:leading-8 lg:text-base lg:leading-8"
            >
              {{ item.response.trim() }}
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
            <button @click="regenerateResponse(prompt)">Regenerate</button>
          </div>
        </div><!--inner-content stop-->
      <div
          class="input-section h-[60px] w-11/12 m-auto rounded-[30px] border border-hover_color2 relative bg-hover_color flex md:rounded-[40px] md:h-[80px] lg:w-[650px] lg:h-[60px] lg:rounded-[40px] xl:w-[850px]"
        >
          <textarea
            ref="inputField"
            class="text-tinWhite rounded-[30px] w-[85%] p-[15px] text-[18px] placeholder:font-semibold md:p-[20px] md:rounded-[40px] md:text-xl md:w-[90%] bg-hover_color lg:p-[15px] lg:text-[18px] lg:placeholder:font-semibold lg:placeholder:text-base lg:rounded-[40px]"
            v-model="prompt"
            placeholder="Ask anything.."
            @keydown.enter.prevent="generateResponse"
            rows="2"
          ></textarea>
          <button
            class="enter-btn absolute right-[10px] top-[7px] h-[45px] w-[45px] border border-hover_color2 rounded-full text-base text-tinWhite bg-hover_color2 font-bold md:h-[60px] md:w-[60px] md:top-[8px] md:right-[14px] md:text-xl md:text-center lg:right-[10px] lg:top-[7px] lg:h-[45px] lg:w-[45px] lg:font-semibold lg:text-base"
            @click="generateResponse"
          >
            Ask
          </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
}

.toggle-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.inner-content {
  overflow-y: scroll;
  margin-block-end: 3px;
}

.inner-content::-webkit-scrollbar {
  display: none;
}

.clear-icon {
  position: fixed;
  font-size: 16px;
  padding: 10px 20px;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 250px;
  padding: 10px 14px;
  border-right: 1px solid #18191a;
  /* box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); */
  transition: transform 0.3s ease;
}

.sidebar.close {
  transform: translateX(-100%);
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

.placeholder {
  position: absolute;
  top: 43%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
}

.justify-text {
  text-align: justify !important;
}

.content.expanded {
  left: 0;
  width: 100%;
}

.input-section {
  /* border: 1px solid #ddd; */
  max-width: 100%;
  margin: 0 auto;
  /* border-radius: 40px; */
}

textarea {
  height: 100%;
  outline: none;
  /* border: 1px solid; */
  resize: none;
  /* border-radius: 40px; */
}

div {
  text-align: center;
  margin-bottom: 20px;
}

p {
  font-size: 18px;
  white-space: pre-wrap;
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

.shimmer-button::before {
  content: "";
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

/* .shimmer-button .text-tinWhite {
  position: relative;
  z-index: 2;
} */
</style>
