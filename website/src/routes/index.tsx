import {createFileRoute} from "@tanstack/react-router";
import {useCallback, useState} from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

/* ── Random data generators (lightweight, no faker dependency) ── */

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function randomEmail(name: string) {
  const domains = ["test.io", "example.com", "mock.dev", "fake.net"];
  const slug = name.toLowerCase().replace(/\s+/g, ".") || "user";
  return `${slug}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function randomAge() {
  return 18 + Math.floor(Math.random() * 50);
}

function randomColour() {
  const colours = ["orange", "teal", "crimson", "slate", "indigo", "coral", "mint", "amber", "violet", "rust"];
  return colours[Math.floor(Math.random() * colours.length)];
}

function generateUserData(nameOverride: string) {
  return {
    id: `"${randomId()}"`,
    name: `"${nameOverride}"`,
    email: `"${randomEmail(nameOverride)}"`,
    age: randomAge(),
    favouriteColour: `"${randomColour()}"`,
  };
}

/* ── Guided demo component ── */

function GuidedDemo() {
  const [nameOverride, setNameOverride] = useState("John Gen-Gen");
  const [userData, setUserData] = useState(() => generateUserData("John Gen-Gen"));

  const regenerate = useCallback(() => {
    setUserData(generateUserData(nameOverride));
  }, [nameOverride]);

  function handleNameChange(value: string) {
    setNameOverride(value);
    setUserData((prev) => ({
      ...prev,
      name: `"${value}"`,
      email: `"${randomEmail(value)}"`,
    }));
  }

  return (
    <div className="flex h-full flex-col justify-center gap-6 p-8 md:gap-8 md:p-12">
      {/* STEP 1 — Import types */}
      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#555]">
          01 — Feed your types to gen-gen
        </div>
        <pre className="border-2 border-[#222] bg-[#111] p-4 text-[12px] leading-[1.8]">
          <code>
            <span className="text-[#666]">import type</span>{" "}
            <span className="text-[#e0e0e0]">{"{"}</span>
            <span className="text-[#ccc]">User</span>
            <span className="text-[#e0e0e0]">{"}"}</span>{" "}
            <span className="text-[#666]">from</span>{" "}
            <span className="text-[#888]">"./user"</span>
            <span className="text-[#555]">;</span>
          </code>
        </pre>
      </div>

      {/* STEP 2 — Generate data */}
      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#555]">
          02 — Override what matters
        </div>
        <pre className="border-2 border-[#222] bg-[#111] p-4 text-[12px] leading-[1.8]">
          <code>
            <span className="text-[#666]">const</span>{" "}
            <span className="text-[#ccc]">user</span>{" "}
            <span className="text-[#666]">=</span>{" "}
            <span className="text-[#e0e0e0]">makeUser</span>
            <span className="text-[#888]">({"{"}</span>
            {"\n"}
            {"  "}
            <span className="text-[#888]">name:</span>{" "}
            <span className="text-primary">"</span>
            <input
              type="text"
              value={nameOverride}
              onChange={(e) => handleNameChange(e.target.value)}
              spellCheck={false}
              className="inline w-auto border-b border-dashed border-primary bg-transparent text-center text-[12px] text-primary outline-none"
              style={{width: `${Math.max(nameOverride.length, 1)}ch`}}
              aria-label="Name override"
            />
            <span className="text-primary">"</span>
            {"\n"}
            <span className="text-[#888]">{"})"}</span>
            <span className="text-[#555]">;</span>
          </code>
        </pre>
      </div>

      {/* STEP 3 — Output */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#555]">
            03 — The rest is randomized
          </span>
          <button
            onClick={regenerate}
            className="border-2 border-[#333] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#888] transition-colors hover:border-primary hover:text-primary"
          >
            Regenerate
          </button>
        </div>
        <pre className="border-2 border-[#222] bg-[#111] p-4 text-[12px] leading-[1.8]">
          <code>
            <span className="text-[#555]">{"// user"}</span>
            {"\n"}
            <span className="text-[#888]">{"{"}</span>
            {"\n"}
            {"  "}
            <span className="text-[#666]">id:</span>{" "}
            <span className="text-[#888]">{userData.id}</span>
            <span className="text-[#555]">,</span>
            {"\n"}
            {"  "}
            <span className="text-[#666]">name:</span>{" "}
            <span className="text-primary">{userData.name}</span>
            <span className="text-[#555]">,</span>
            {"        "}
            <span className="text-[#444]">{"// ← your override"}</span>
            {"\n"}
            {"  "}
            <span className="text-[#666]">email:</span>{" "}
            <span className="text-[#888]">{userData.email}</span>
            <span className="text-[#555]">,</span>
            {"\n"}
            {"  "}
            <span className="text-[#666]">age:</span>{" "}
            <span className="text-[#888]">{userData.age}</span>
            <span className="text-[#555]">,</span>
            {"\n"}
            {"  "}
            <span className="text-[#666]">favouriteColour:</span>{" "}
            <span className="text-[#888]">{userData.favouriteColour}</span>
            {"\n"}
            <span className="text-[#888]">{"}"}</span>
          </code>
        </pre>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="grid h-[calc(100vh-52px)] grid-cols-1 md:grid-cols-[1fr_3px_1fr]">
      {/* LEFT — Name, why, install */}
      <div className="flex flex-col justify-between p-10 md:p-12">
        <div />

        <div>
          <h1 className="font-display text-[clamp(64px,10vw,140px)] uppercase leading-[0.88] tracking-[-0.04em]">
            gen<span className="text-primary">-</span>gen
          </h1>
          <p className="mt-6 max-w-[420px] text-[13px] leading-[1.8] text-muted-foreground">
            Test data by hand doesn't scale. Hard-coded fixtures leak.
            Shared globals hide bugs. gen-gen reads your TypeScript types
            and generates factory functions — override what matters,
            randomize the rest.
          </p>
        </div>

        <div className="flex items-center gap-3 border-[3px] border-foreground bg-secondary px-5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Install</span>
          <code className="text-[13px]"><span className="text-primary">$</span> npm install gen-gen --save-dev</code>
        </div>
      </div>

      {/* VERTICAL DIVIDER — ticker */}
      <div className="hidden overflow-hidden bg-primary md:flex" aria-hidden="true">
        <div className="flex animate-[ticker_20s_linear_infinite] flex-col whitespace-nowrap [writing-mode:vertical-lr]">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex flex-col">
              {["Types in", "Factories out", "Faker powered", "Override what matters", "Randomize the rest", "Zero config", "Type-safe"].map((text) => (
                <span key={text} className="px-0 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-background">{text}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT — Guided demo */}
      <div className="flex flex-col border-t-[3px] border-foreground bg-[#0a0a0a] text-[#e0e0e0] md:border-t-0">
        <GuidedDemo />
      </div>
    </div>
  );
}
