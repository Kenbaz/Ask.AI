import { createRouter, createWebHistory } from "vue-router";
import ChatCompletion from "./components/ChatCompletion.vue";
import GenerateImage from "./components/GenerateImage.vue";
import LandingPage from "./components/LandingPage.vue";
import NotFoundPage from "./components/NotFoundPage.vue";

const routes = [
    { path: '/', component: LandingPage },
    { path: '/chat-completion', component: ChatCompletion },
    { path: '/image-generation', component: GenerateImage },
    { path: '/:pathMatch(.*)*', name: 'NotFoundPage', component: NotFoundPage },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router;