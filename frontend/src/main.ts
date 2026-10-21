import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { onUnauthorized } from "./api/http";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import "./style.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Expired or revoked token: drop the session and send the user back to the login page.
onUnauthorized(() => {
	useAuthStore().logout();
	const current = router.currentRoute.value;
	if (current.name !== "login") {
		void router.push({ name: "login", query: { redirect: current.fullPath, expired: "1" } });
	}
});

app.mount("#app");
