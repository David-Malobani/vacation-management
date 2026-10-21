/**
 * Calendar-date helpers. The API speaks YYYY-MM-DD strings with no timezone;
 * converting them to Date objects only happens here, always in local time,
 * so a date never shifts by one day.
 */

const pad = (n: number): string => String(n).padStart(2, "0");

export const toIsoDate = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseIsoDate = (iso: string): Date => {
	const [year, month, day] = iso.split("-").map(Number);
	return new Date(year, month - 1, day);
};

export const todayIso = (): string => toIsoDate(new Date());

export const addDays = (iso: string, days: number): string => {
	const date = parseIsoDate(iso);
	date.setDate(date.getDate() + days);
	return toIsoDate(date);
};

/** Number of calendar days covered by an inclusive range. */
export const daysInclusive = (startIso: string, endIso: string): number =>
	Math.round((parseIsoDate(endIso).getTime() - parseIsoDate(startIso).getTime()) / 86_400_000) + 1;

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatDate = (iso: string): string => dateFormat.format(parseIsoDate(iso));

export const formatDateTime = (isoDateTime: string): string => dateTimeFormat.format(new Date(isoDateTime));

/** "2026-10" for the month containing the given date. */
export const monthKey = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const monthStart = (key: string): Date => {
	const [year, month] = key.split("-").map(Number);
	return new Date(year, month - 1, 1);
};

export const shiftMonth = (key: string, delta: number): string => {
	const date = monthStart(key);
	date.setMonth(date.getMonth() + delta);
	return monthKey(date);
};

/** Every day of the month as YYYY-MM-DD. */
export const daysOfMonth = (key: string): string[] => {
	const first = monthStart(key);
	const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
	return Array.from({ length: count }, (_, i) => toIsoDate(new Date(first.getFullYear(), first.getMonth(), i + 1)));
};

export const isWeekend = (iso: string): boolean => [0, 6].includes(parseIsoDate(iso).getDay());

export const formatMonth = (key: string): string =>
	new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(monthStart(key));
