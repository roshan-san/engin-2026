import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { errorMessage } from "~/shared/lib/errors";
import { Button } from "./button";
import { EmptyState } from "./EmptyState";

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
