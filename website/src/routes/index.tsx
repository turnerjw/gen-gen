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
        <div className="mb-3 font-display text-lg uppercase tracking-display text-background">
          01 — Feed your types to gen-gen
        </div>
        <pre className="border-2 border-syntax-border bg-syntax-surface p-4 text-[13px] leading-[1.8]">
          <code>
            <span className="text-syntax-keyword">import type</span>{" "}
            <span className="text-syntax-identifier">{"{"}</span>
            <span className="text-syntax-identifier">User</span>
            <span className="text-syntax-identifier">{"}"}</span>{" "}
            <span className="text-syntax-muted">from</span>{" "}
            <span className="text-syntax-punctuation">"./user"</span>
            <span className="text-syntax-muted">;</span>
          </code>
        </pre>
      </div>

      {/* STEP 2 — Generate data */}
      <div>
        <div className="mb-3 font-display text-lg uppercase tracking-display text-background">
          02 — Override what matters
        </div>
        <pre className="border-2 border-syntax-border bg-syntax-surface p-4 text-[13px] leading-[1.8]">
          <code>
            <span className="text-syntax-keyword">const</span>{" "}
            <span className="text-syntax-identifier">user</span>{" "}
            <span className="text-syntax-muted">=</span>{" "}
            <span className="text-syntax-identifier">makeUser</span>
            <span className="text-syntax-punctuation">({"{"}</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-punctuation">name:</span>{" "}
            <span className="text-primary">"</span>
            <input
              type="text"
              value={nameOverride}
              onChange={(e) => handleNameChange(e.target.value)}
              spellCheck={false}
              className="inline w-auto cursor-text rounded-sm bg-primary/10 px-0.5 text-center text-[13px] text-primary outline-none"
              maxLength={20}
              style={{width: `${Math.max(nameOverride.length, 1) + 1}ch`}}
              aria-label="Name override"
            />
            <span className="text-primary">"</span>
            {"  "}
            <span className="text-syntax-muted">{"// ← edit me"}</span>
            {"\n"}
            <span className="text-syntax-punctuation">{"})"}</span>
            <span className="text-syntax-muted">;</span>
          </code>
        </pre>
      </div>

      {/* STEP 3 — Output */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-lg uppercase tracking-display text-background">
            03 — The rest is randomized
          </span>
          <button
            onClick={regenerate}
            className="border-2 border-[#444] bg-transparent px-3 py-1 text-[10px] uppercase tracking-button text-syntax-keyword transition-colors hover:border-primary hover:text-primary"
          >
            Regenerate
          </button>
        </div>
        <pre className="border-2 border-syntax-border bg-syntax-surface p-4 text-[13px] leading-[1.8]">
          <code>
            <span className="text-syntax-comment">{"// user"}</span>
            {"\n"}
            <span className="text-syntax-punctuation">{"{"}</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-property">id:</span>{" "}
            <span className="text-syntax-value">{userData.id}</span>
            <span className="text-syntax-muted">,</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-comment">name:</span>{" "}
            <span className="text-primary">{userData.name}</span>
            <span className="text-syntax-muted">,</span>
            {"        "}
            <span className="text-syntax-muted">{"// ← your override"}</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-comment">email:</span>{" "}
            <span className="text-syntax-value">{userData.email}</span>
            <span className="text-syntax-muted">,</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-comment">age:</span>{" "}
            <span className="text-syntax-value">{userData.age}</span>
            <span className="text-syntax-muted">,</span>
            {"\n"}
            {"  "}
            <span className="text-syntax-comment">favouriteColour:</span>{" "}
            <span className="text-syntax-value">{userData.favouriteColour}</span>
            {"\n"}
            <span className="text-syntax-punctuation">{"}"}</span>
          </code>
        </pre>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="grid h-[calc(100vh-var(--header-height))] grid-cols-1 md:grid-cols-[1fr_18px_1fr]">
      {/* LEFT — Name, why, install (2-col × 3-row grid) */}
      <div className="grid grid-cols-[1fr_8fr] grid-rows-[1fr_auto_auto] gap-[3px] bg-foreground">
        {/* Row 1 — title */}
        <div className="rounded-br-lg bg-primary" />
        <div className="flex items-end rounded-bl-lg bg-primary p-10 md:p-12">
          <h1 className="font-display text-[clamp(64px,10vw,140px)] uppercase leading-[0.88] tracking-[-0.04em]">
            gen_gen
          </h1>
        </div>

        {/* Row 2 — description */}
        <div className="rounded-tr-lg rounded-br-lg bg-primary" />
        <div
          className="rounded-tl-lg rounded-bl-lg px-10 py-8 md:px-12"
          style={{background: "radial-gradient(ellipse at 10% 90%, hsla(15, 100%, 72%, 0.7) 0%, transparent 50%), radial-gradient(ellipse at 90% 10%, hsla(345, 100%, 78%, 0.5) 0%, transparent 45%), radial-gradient(ellipse at 55% 55%, hsla(0, 100%, 68%, 0.35) 0%, transparent 60%), hsl(345, 100%, 50%)"}}
        >
          <div className="max-w-[420px] text-base leading-[1.7]">
            <p className="font-normal text-foreground">Your TypeScript types already know what your data looks like.</p>
            <p className="mt-3 font-bold text-foreground">gen-gen turns them into factory functions — randomized by default, overridable on demand.</p>
          </div>
        </div>

        {/* Row 3 — install */}
        <div className="rounded-tr-lg bg-primary" />
        <div
          className="flex flex-col justify-center rounded-tl-lg px-10 py-8 md:px-12"
          style={{background: "radial-gradient(ellipse at 0% 0%, hsla(345, 100%, 55%, 0.5) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, hsla(345, 80%, 45%, 0.35) 0%, transparent 50%), hsl(0, 0%, 4%)"}}
        >
          <span className="mb-2 text-[11px] font-bold uppercase tracking-label text-syntax-comment">Install</span>
          <code className="text-lg text-syntax-identifier"><span className="text-primary">$</span> npm install @trnr/gen-gen --save-dev</code>
        </div>
      </div>

      {/* VERTICAL DIVIDER — ticker */}
      <div className="hidden overflow-hidden bg-foreground md:flex md:flex-col" aria-hidden="true">
        <div className="flex animate-[ticker_20s_linear_infinite] flex-col">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex flex-col">
              {["Type-safe", "Zero boilerplate", "Faker powered", "Fresh every run", "Surgical overrides", "Inferred, not written", "No stale fixtures"].map((text) => (
                <span key={text} className="py-4 text-[13px] font-bold uppercase tracking-ticker text-background [writing-mode:vertical-lr]">{text}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT — Guided demo */}
      <div className="flex flex-col border-t-brand border-foreground bg-syntax-surface text-syntax-identifier md:border-t-0">
        <GuidedDemo />
      </div>
    </div>
  );
}
