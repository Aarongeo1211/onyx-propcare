"use client";

import { useRef, useState } from "react";

function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const add = (msg: string) => setLines((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  return { lines, add };
}

function describeFiles(files: FileList) {
  return Array.from(files).map((f) => `${f.name} (${f.type}, ${f.size} bytes)`);
}

export default function TestUploadPage() {
  const logA = useLog();
  const logB = useLog();
  const logC = useLog();
  const refC = useRef<HTMLInputElement>(null);

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1>Upload diagnostic (React, this Next.js build)</h1>
      <p style={{ color: "#666" }}>No auth, no framer-motion, no app state. Three variants, test each.</p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16 }}>A — plain visible input, direct onChange</h2>
        <input
          type="file"
          onChange={(e) => {
            logA.add("onChange fired");
            if (e.target.files) logA.add(describeFiles(e.target.files).join(", "));
          }}
        />
        <pre style={{ background: "#111", color: "#dfe", padding: 12, borderRadius: 8, minHeight: 40 }}>
          {logA.lines.join("\n") || "waiting..."}
        </pre>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16 }}>B — label + sr-only input (production pattern)</h2>
        <label
          style={{
            display: "inline-flex",
            width: 140,
            height: 90,
            border: "2px dashed #888",
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          Click to upload
          <input
            type="file"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
            onChange={(e) => {
              logB.add("onChange fired");
              if (e.target.files) logB.add(describeFiles(e.target.files).join(", "));
            }}
          />
        </label>
        <pre style={{ background: "#111", color: "#dfe", padding: 12, borderRadius: 8, minHeight: 40, marginTop: 8 }}>
          {logB.lines.join("\n") || "waiting..."}
        </pre>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16 }}>C — button + ref.click() (old broken pattern, for comparison)</h2>
        <button type="button" onClick={() => refC.current?.click()}>
          Click to upload
        </button>
        <input
          ref={refC}
          type="file"
          className="hidden"
          style={{ display: "none" }}
          onChange={(e) => {
            logC.add("onChange fired");
            if (e.target.files) logC.add(describeFiles(e.target.files).join(", "));
          }}
        />
        <pre style={{ background: "#111", color: "#dfe", padding: 12, borderRadius: 8, minHeight: 40, marginTop: 8 }}>
          {logC.lines.join("\n") || "waiting..."}
        </pre>
      </section>
    </div>
  );
}
