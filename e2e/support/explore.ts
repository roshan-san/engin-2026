// Signs a fresh person into a playwright-cli browser, for exploring the app
// while writing specs:
//   pnpm e2e:signin Fay [startup]
//   playwright-cli open http://localhost:3000
//   playwright-cli eval "<printed snippet>" && playwright-cli goto <url>
import { api } from "../../convex/_generated/api";
import { CONVEX_URL } from "./convex";
import { signUp } from "./people";

const person = await signUp(process.argv[2] ?? "Explorer");
if (process.argv[3] === "startup") {
	const { slug } = await person.api.mutation(api.teams.startups.create, {
		name: `Acme ${person.username}`,
	});
	console.error(`slug=${slug}`);
}
const namespace = CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "");
console.error(`username=${person.username} email=${person.email}`);
console.log(
	`() => { localStorage.setItem("__convexAuthJWT_${namespace}", "${person.tokens.token}"); localStorage.setItem("__convexAuthRefreshToken_${namespace}", "${person.tokens.refreshToken}"); }`,
);
