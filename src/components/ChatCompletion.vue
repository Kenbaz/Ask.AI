<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import openai from "../config/openaiConfig.js";

const promptsAndResponses = ref([]);
const promptHistory = ref([]);
const prompt = ref("");
const sidebarVisible = ref(true);
const inputField = ref(null);
const inputField2 = ref(null);
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

  //save prompt.value into a new variable
  const currentPrompt = prompt.value;

  //clear prompt from input field and focus the input field
  prompt.value = "";
  if (inputField.value) {
    inputField.value.focus();
  }

  isLoading.value = true;
  error.value = false;
  startLoadingAnimation();

  //make a placeholder prompt to hold the prompt while the response is fetching
  promptsAndResponses.value.push({
    prompt: currentPrompt,
    response: "",
  });

  //if a prompt is being generated push the prompt to the promptHistory ref
  if (!isRegenerating) {
    promptHistory.value.push({
      prompt: currentPrompt,
      
    });
  }

  // the last index is the current index
  const currentIndex = promptsAndResponses.value.length - 1;

  await nextTick();
  scrollToBottom();

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: currentPrompt }],
      
    });
    const newResponse = res.choices[0].message.content;

    //replace the placeholder response with the generated response
    promptsAndResponses.value[currentIndex].response = newResponse;

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

function adjustTextareaHeight() {
  if (inputField.value) {
    inputField.value.style.height = "auto"; // Reset height to auto to shrink if needed
    const scrollHeight = inputField.value.scrollHeight;

    // Set the new height or keep it at max-height
    inputField.value.style.height = `${Math.min(scrollHeight, 200)}px`; 

     // If scrollHeight exceeds 150px, enable scroll
    if (scrollHeight > 200) {
      inputField.value.style.overflowY = "auto"; // Enable scrolling
      
    } else {
      inputField.value.style.overflowY = "hidden"; // Disable scrolling when under max-height
    }
  }
}

function adjustTextareaHeight2() {
  if (inputField2.value) {
    inputField2.value.style.height = "auto"; // Reset height to auto to shrink if needed
    const scrollHeight = inputField2.value.scrollHeight;

    // Set the new height or keep it at max-height
    inputField2.value.style.height = `${Math.min(scrollHeight, 200)}px`; 

     // If scrollHeight exceeds 150px, enable scroll
    if (scrollHeight > 200) {
      inputField2.value.style.overflowY = "auto"; // Enable scrolling
      
    } else {
      inputField2.value.style.overflowY = "hidden"; // Disable scrolling when under max-height
    }
  }
}


const buttonStyle = computed(() => ({
  backgroundColor: prompt.value.trim() ? "white" : "#3a3b3c",
  color: prompt.value.trim() ? "#374151" : "white",
  borderColor: prompt.value.trim() ? "white" : "#3a3b3c",
}));


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
  <!--Small and Medium screens UI-->
  <div class="main-container h-screen w-full overflow-auto flex flex-col pt-4 pb-3 lg:hidden">
  <header class="lg:hidden fixed z-50 top-0 bg-primary right-0 left-0 h-16 border border-t-0 border-r-0 border-l-0 border-b-hover_color2 pb-2 flex gap-4 items-center md:gap-8">
    <font-awesome-icon
      @click="clearPrompts"
      :icon="['fas', 'edit']"
      class="clear-icon ml-4 z-10 top-[4px] h-[24px] cursor-pointer hover:bg-hover_color2 rounded-lg md:-top-[0px] md:h-10 lg:h-[23px] lg:left-[70px] lg:top-[9px]"
    />
    <button
      type="button"
      class="shimmer-button relative text-center mt-6 bg-hover_color2 w-40 p-1 rounded-lg -top-2 md:-top-[11px] md:text-2xl md:w-56 md:p-2 lg:hidden"
    >
      <RouterLink class="text-tinWhite font-semibold" to="/image-generation">
        Image generation
      </RouterLink>
    </button>
  </header>

  <div class="content-container grid grid-cols-1 mt-[3.1rem] pb-2 md:pb-4 w-full h-screen justify-between gap-4 box-border">
    <div
      class="inner-content pb-10 flex min-h-[91%] flex-grow flex-col overflow-y-scroll w-[94%] m-auto h-full lg:hidden"
      ref="responseContainer"
    >
      <div v-if="promptsAndResponses.length === 0" class="placeholder text-3xl font-bold md:text-4xl lg:text-3xl">
        ASK<span class="text-base font-semibold">.AI</span>
      </div>
      <div v-for="(item, index) in promptsAndResponses" :key="index">
        <div class="prompt-container rounded-xl bg-hover_color2 h-auto p-2 text-white text-base md:text-2xl lg:text-base">
          {{ item.prompt }}
        </div>
        <div
          class="prompt-response text-white text-pretty text-base leading-8 md:text-xl md:leading-8 lg:text-base lg:leading-8"
        >
          {{ item.response.trim() }}
        </div>
      </div>
      <div v-if="isLoading" class="loading-message text-base bg-hover_color2 text-tinWhite p-2 rounded-xl">
        {{ loadingText }}
      </div>
      <div v-if="error" class="error-message flex-shrink-0">
        <p>Failed to generate</p>
        <button @click="regenerateResponse(prompt)">Regenerate</button>
      </div>
    </div>

    <!-- Updated input-section -->
     <div
    class="input-section w-11/12 m-auto rounded-[30px] border border-hover_color2 relative bg-hover_color lg:items-end lg:max-h-[200px] flex lg:w-[650px] lg:h-auto lg:rounded-[40px] xl:w-[850px] lg:bottom-0"
  >
    <textarea
      ref="inputField2"
      class="text-tinWhite rounded-[30px] w-[84%] p-[15px] text-[18px] placeholder:font-semibold md:p-[20px] md:rounded-[40px] md:text-xl md:w-[88%] bg-hover_color lg:p-[15px] lg:max-h-[200px] lg:text-[18px] lg:placeholder:font-semibold lg:placeholder:text-base lg:h-full lg:rounded-[40px] overflow-y-auto"
      v-model="prompt"
      placeholder="Ask anything.."
      @keydown.enter.prevent="generateResponse"
       @input="adjustTextareaHeight2"
      rows="1"
      
    ></textarea>
    <button
      class="enter-btn self-end absolute right-[5px] bottom-[7px] h-[45px] w-[45px] border border-hover_color2 rounded-full text-base text-tinWhite bg-hover_color2 font-bold md:h-[60px] md:w-[60px] md:bottom-[4px] md:right-[10px] md:text-xl md:text-center lg:right-[14px] lg:bottom-[7px] lg:h-[45px] lg:w-[45px] lg:font-semibold lg:text-base"
      @click="generateResponse"
      :style="buttonStyle"
    >
      Ask
    </button>
  </div>
  </div>
</div>


  <!--Large screens UI-->

<main class="hidden h-screen lg:block ">
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
      <ul class="history-container max-h-[80%] overflow-y-auto w-full">
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
      class="clear-icon hidden fixed z-10 top-[5px] left-[20px] h-[30px] cursor-pointer hover:bg-hover_color2 rounded-lg md:h-10 lg:h-[23px] lg:left-[170px] lg:block lg:top-[9px]"
    />

    <div
      :class="['content', { expanded: !sidebarVisible }]"
      class="content-container absolute hidden lg:grid grid-cols-1 left-0 w-full h-full lg:top-0 lg:left-[250px] lg:pb-4 lg:pt-5 gap-2 lg:content-custom xl:h-[100vh] xl:pb-4 box-border"
    >

      <div
        class="inner-content w-11/12 overflow-y-scroll m-auto min-h-[91%] lg:h-[100%] lg:w-[600px] pb-10 lg:rounded-xl xl:w-[800px] xl:h-[100%]"
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
            class="prompt-response text-tinWhite text-pretty text-base leading-8 md:text-xl md:leading-8 lg:text-base lg:leading-8"
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
      </div>
      <div
    class="input-section w-11/12 m-auto rounded-[30px] border border-hover_color2 relative bg-hover_color lg:items-end lg:max-h-[200px] flex lg:w-[650px] lg:h-auto lg:rounded-[40px] xl:w-[850px] lg:bottom-0"
  >
    <textarea
      ref="inputField"
      class="text-tinWhite rounded-[30px] w-[85%] p-[15px] text-[18px] placeholder:font-semibold md:p-[20px] md:rounded-[40px] md:text-xl md:w-[90%] bg-hover_color lg:p-[15px] lg:max-h-[200px] lg:text-[18px] lg:placeholder:font-semibold lg:placeholder:text-base lg:h-full lg:rounded-[40px] overflow-y-auto"
      v-model="prompt"
      placeholder="Ask anything.."
      @keydown.enter.prevent="generateResponse"
       @input="adjustTextareaHeight"
      rows="1"
      
    ></textarea>
    <button
      class="enter-btn self-end absolute right-[10px] top-[7px] h-[45px] w-[45px] border border-hover_color2 rounded-full text-base text-tinWhite bg-hover_color2 font-bold md:h-[60px] md:w-[60px] md:top-[8px] md:right-[14px] md:text-xl md:text-center lg:right-[14px] lg:bottom-[7px] lg:h-[45px] lg:w-[45px] lg:font-semibold lg:text-base"
      @click="generateResponse"
      :style="buttonStyle"
    >
      Ask
    </button>
  </div>
    </div>
  </main>

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

.toggle-btn,
.clear-icon {
  transition: left 0.3s ease;
}

.sidebar.close ~ .toggle-btn,
.sidebar.close ~ .clear-icon {
  left: 70px;
}

.inner-content::-webkit-scrollbar {
  display: none;
}

.content-container {
  grid-template-rows: 1fr auto;
}

.clear-icon {
  font-size: 16px;
  padding: 10px 20px;
}

.history-container::-webkit-scrollbar {
  background-color: transparent;
  width: 10px;
}

.history-container::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 10px;
  border: 3px solid rgba(0, 0, 0, 0);
}

.history-container::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 250px;
  padding: 10px 14px;
  border-right: 1px solid #18191a;
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
  top: 50%;
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
  max-width: 100%;
  margin: 0 auto;
  align-items: flex-end;
  box-sizing: border-box;
  transition: height 0.3s ease;
}

textarea {
  outline: none;
  resize: none;
  transition: height 0.3s ease;
  box-sizing: border-box;
}

textarea::-webkit-scrollbar {
  background-color: #555;
  width: 10px
}

textarea::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
  border: 3px solid rgba(0, 0, 0, 0);
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

</style>