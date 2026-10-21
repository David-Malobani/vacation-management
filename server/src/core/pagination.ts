export interface PageRequest {
	page: number;
	pageSize: number;
}

export interface Page<T> {
	items: T[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const toPage = <T>(items: T[], total: number, { page, pageSize }: PageRequest): Page<T> => ({
	items,
	page,
	pageSize,
	total,
	totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

export const pageOffset = ({ page, pageSize }: PageRequest): number => (page - 1) * pageSize;
