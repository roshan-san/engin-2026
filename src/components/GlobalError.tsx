import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { EmptyState } from "~/components/EmptyState";
import { Button } from "~/components/ui/button";
import { errorMessage } from "~/lib/errors";

export function GlobalError({ error, reset }: Readonly<ErrorComponentProps>) {
	const router = useRouter();

	return (
		<div className="flex flex-1 items-center justify-center">
			<EmptyState
				title="Something went wrong"
				body={errorMessage(error)}
				action={
					<div className="flex items-center gap-2">
						<Button
							onClick={() => {
								reset();
								void router.invalidate();
							}}
						>
							Try again
						</Button>
						<Button asChild variant="ghost">
							<Link to="/">Home</Link>
						</Button>
					</div>
				}
			/>
		</div>
	);
}
