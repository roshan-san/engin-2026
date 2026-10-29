export function initials(name: string | null, email: string | null) {
	const source = name ?? email ?? "?";
	return source
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}
