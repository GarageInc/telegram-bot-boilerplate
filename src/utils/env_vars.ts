const vars: Record<string, { required: boolean; present: boolean }> = {};

export const reqd = <T = string>(prop: string, mapper: (value: string) => T = value => value as T): T => {
	const value = process.env[prop];
	vars[prop] = { required: true, present: Boolean(value) };
	// if not present, checks() will throw an error, safe to return undefined for now
	if (!value) return undefined as any;
	return mapper(value);
};

type OptMapper<T> = (value: string | undefined) => T;

export const opt = <T = string | undefined>(prop: string, mapper: OptMapper<T> = x => x as T): T => {
	const value = process.env[prop];
	vars[prop] = { required: false, present: Boolean(value) };
	return mapper(value);
};

export const checks = () => {
	const missing = Object.entries(vars)
		.filter(([_, v]) => v.required && !v.present)
		.map(([k]) => k);

	if (missing.length > 0) {
		console.error(
			"\n[CRITICAL!] Missing required environment variables (%d):\n\n%s\n",
			missing.length,
			missing.map(each => each + "=").join("\n"),
		);
		process.exit(1);
	}
};

export const commaSeparated = (str?: string) => {
	if (typeof str !== "string" || str.trim().length === 0) return [];
	return str
		.split(",")
		.map(url => url.trim())
		.filter(url => url.length > 0);
};
