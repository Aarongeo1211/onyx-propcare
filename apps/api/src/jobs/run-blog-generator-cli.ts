import { runBlogGenerator } from "../services/blog-generator";

// Standalone CLI entrypoint only -- never imported by index.ts. A
// self-executing process.exit() inside a file that also gets imported into
// the server's esbuild bundle previously crashed production (see git log:
// "Fix production crash: process.exit() firing inside live server").
runBlogGenerator()
  .then((result) => {
    console.log("Blog generator result:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Blog generator failed:", err);
    process.exit(1);
  });
