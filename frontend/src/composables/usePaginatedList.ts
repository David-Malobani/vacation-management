import { ref, shallowRef } from "vue";
import { getErrorMessage } from "@/api/http";
import type { Page } from "@/types/api";

/**
 * Loading / error / page state for any paginated endpoint. Out-of-order
 * responses are ignored, so quickly changing a filter never shows stale data.
 */
export function usePaginatedList<ItemType>(fetchPage: (page: number) => Promise<Page<ItemType>>) {
	const items = shallowRef<ItemType[]>([]);
	const page = ref(1);
	const pageSize = ref(10);
	const total = ref(0);
	const totalPages = ref(1);
	const loading = ref(false);
	const error = ref<string | null>(null);

	let latestCall = 0;

	async function load(targetPage = page.value): Promise<void> {
		const call = ++latestCall;
		loading.value = true;
		error.value = null;
		try {
			const result = await fetchPage(targetPage);
			if (call !== latestCall) return;
			// A deletion can leave us past the last page: step back once.
			if (result.items.length === 0 && result.page > 1 && result.page > result.totalPages) {
				return load(result.totalPages);
			}
			items.value = result.items;
			page.value = result.page;
			pageSize.value = result.pageSize;
			total.value = result.total;
			totalPages.value = result.totalPages;
		} catch (err) {
			if (call === latestCall) error.value = getErrorMessage(err);
		} finally {
			if (call === latestCall) loading.value = false;
		}
	}

	return { items, page, pageSize, total, totalPages, loading, error, load };
}
