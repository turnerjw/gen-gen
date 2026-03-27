import {Link, Outlet, createRootRoute, useRouterState} from "@tanstack/react-router";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

const navLinkClass = "px-4 text-xs uppercase tracking-[0.1em] text-[#aaa] no-underline transition-colors hover:text-primary";

function RootLayout() {
  const routerState = useRouterState();
  const isHome = routerState.location.pathname === "/";
  const isDocs = routerState.location.pathname.startsWith("/docs");
  const isPlayground = routerState.location.pathname.startsWith("/playground");
  const isFullBleed = isHome || isDocs || isPlayground;

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* NAV */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[var(--header-height)] items-center justify-between border-b-[1px] border-background bg-foreground">
        <Link to="/" className="pl-8 font-display text-2xl uppercase text-background no-underline">
          gen<span className="text-primary">-</span>gen
        </Link>
        <nav aria-label="Primary" className="flex h-full items-center pr-4">
          <Link to="/docs" className={navLinkClass}>Docs</Link>
          <Link to="/playground" className={navLinkClass}>Playground</Link>
          <a className={navLinkClass} href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer">npm</a>
          <a className={navLinkClass} href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      {/* MAIN */}
      <main id="main-content" className={isFullBleed ? "mt-[var(--header-height)]" : "mx-auto mt-[var(--header-height)] w-full max-w-6xl px-6 py-10 md:px-10 md:py-14"}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="flex items-end justify-between border-t-[1px] border-background bg-foreground px-10 py-8">
        <div>
          <div className="font-display text-3xl uppercase text-background">gen<span className="text-primary">-</span>gen</div>
          <p className="mt-2 text-xs uppercase tracking-label text-muted-foreground">Type-safe test factory generator</p>
        </div>
        <div className="flex gap-6">
          <a href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-nav text-muted-foreground no-underline transition-colors hover:text-primary">GitHub</a>
          <a href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-nav text-muted-foreground no-underline transition-colors hover:text-primary">npm</a>
        </div>
      </footer>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
