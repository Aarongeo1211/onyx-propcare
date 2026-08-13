import { runSavedSearchAlerts } from "./saved-search-alerts";

// Thin CLI entrypoint, kept separate from saved-search-alerts.ts on purpose:
// that file is also imported by the running server (src/index.ts) for the
// in-process scheduler, and a self-executing "if (require.main === module)"
// block in a file that gets bundled together with the server entrypoint can
// incorrectly evaluate true inside the bundle — which is exactly what
// crashed production (the process.exit(0) below fired inside the live
// server right after boot). Only this standalone file exits the process.
runSavedSearchAlerts()
  .then((result) => {
    console.log("Saved search alerts result:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Saved search alerts failed:", err);
    process.exit(1);
  });
