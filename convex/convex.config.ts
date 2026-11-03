import migrations from "@convex-dev/migrations/convex.config.js";
import resend from "@convex-dev/resend/convex.config.js";
import dodopayments from "@dodopayments/convex/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(dodopayments);
app.use(migrations);
app.use(resend);

export default app;
