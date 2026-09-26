import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export function GlobalError({ error }: Readonly<ErrorComponentProps>) {
	const message = toErrorMessage(error, "Something went wrong");

	useEffect(() => {
		toast.error("Something went wrong", { description: message });
	}, [message]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p className="text-xl font-bold">Something went wrong</p>
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}
