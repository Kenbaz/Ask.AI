import { createRouter, createWebHistory } from "vue-router";
import ChatCompletion from "./components/ChatCompletion.vue";
import GenerateImage from "./components/GenerateImage.vue";
import LandingPage from "./components/LandingPage.vue";
import NotFoundPage from "./components/NotFoundPage.vue";

const routes = [
    { path: '/', component: LandingPage, name: 'Home page', meta: {title: 'Home', description: 'This is the home/landing page'} },
    { path: '/chat-completion', component: ChatCompletion, name: 'chat-completion', meta: {title: 'Chat-completion', description: 'Prompt AI model and get a response'} },
    { path: '/image-generation', component: GenerateImage, name: 'Image-generation', meta: {title: 'Image generation', description: 'Give image description and get a response'} },
    { path: '/:pathMatch(.*)*', name: 'NotFoundPage', component: NotFoundPage, meta: {title: '404 page', description: 'This is a 404 error page'} },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
  //update the document title
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  //update the meta description
  //check if the route being navigated 'to' has 'description' in its meta field, if it does, set its content attribute to meta.description.
  if (to.meta.description) {
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", to.meta.description);
    }
  }
  next();
});

export default router;