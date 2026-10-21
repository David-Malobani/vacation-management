export interface PageRequest {
	page: number;
	pageSize: number;
}

export interface Page<ItemType> {
	items: ItemType[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const toPage = <ItemType>(
	items: ItemType[],
	total: number,
	{ page, pageSize }: PageRequest
): Page<ItemType> => ({
	items,
	page,
	pageSize,
	total,
	totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

export const pageOffset = ({ page, pageSize }: PageRequest): number => (page - 1) * pageSize;
