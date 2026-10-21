import type { Role, User } from "@/types/api";
import { http } from "./http";

export const usersApi = {
	/** Validators only. */
	async list(role?: Role): Promise<User[]> {
		const { data } = await http.get<{ items: User[] }>("/users", { params: role ? { role } : {} });
		return data.items;
	},
};
