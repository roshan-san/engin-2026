import { AppPage, PageTitle } from "~/components/AppPage";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { StartupSettings } from "./StartupSettings";

/** The ⚙ page: name, logo and details. Founder only. */
export function SettingsPage() {
	const { isFounder } = useWorkspace();

	if (!isFounder) {
		return <GlobalNotFound />;
	}
	return (
		<AppPage bar={{ title: <PageTitle name="Startup settings" /> }}>
			<StartupSettings />
		</AppPage>
	);
}
