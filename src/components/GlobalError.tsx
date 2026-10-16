import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

export function GlobalError({ error }: Readonly<ErrorComponentProps>) {
	const message = errorMessage(error);

	useEffect(() => {
		toast.error("Something went wrong", { description: message });
	}, [message]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p className="text-lg font-semibold">Something went wrong</p>
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}
