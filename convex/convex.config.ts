import presence from "@convex-dev/presence/convex.config.js";
import dodopayments from "@dodopayments/convex/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(presence);
app.use(dodopayments);

export default app;
