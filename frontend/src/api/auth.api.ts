import type { User } from "@/types/api";
import { http } from "./http";

export const authApi = {
	async login(email: string, password: string): Promise<{ token: string; user: User }> {
		const { data } = await http.post("/auth/login", { email, password });
		return data;
	},

	async me(): Promise<User> {
		const { data } = await http.get<User>("/auth/me");
		return data;
	},
};
