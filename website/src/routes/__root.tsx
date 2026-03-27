import {Link, Outlet, createRootRoute, useRouterState} from "@tanstack/react-router";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

const navLinkClass = "flex h-full items-center border-l-[3px] border-foreground px-5 text-xs uppercase tracking-[0.08em] text-foreground no-underline transition-colors hover:bg-foreground hover:text-background";

function RootLayout() {
  const routerState = useRouterState();
  const isHome = routerState.location.pathname === "/";

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-[52px] items-center justify-between border-b-[3px] border-foreground bg-background">
        <Link to="/" className="pl-8 font-display text-xl text-foreground no-underline">
          gen-gen
        </Link>
        <nav aria-label="Primary" className="flex h-full">
          <Link to="/docs" className={navLinkClass}>
            Docs
          </Link>
          <Link to="/playground" className={navLinkClass}>
            Playground
          </Link>
          <a className={navLinkClass} href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer">
            npm
          </a>
          <a className={navLinkClass} href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      {/* MAIN */}
      <main id="main-content" className={isHome ? "mt-[52px]" : "mx-auto mt-[52px] w-full max-w-6xl px-6 py-10 md:px-10 md:py-14"}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="flex items-center justify-between border-t-[3px] border-foreground px-10 py-4 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>gen-gen</span>
        <div className="flex gap-5">
          <a href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer" className="text-foreground no-underline hover:underline hover:[text-decoration-thickness:2px]">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer" className="text-foreground no-underline hover:underline hover:[text-decoration-thickness:2px]">
            npm
          </a>
        </div>
      </footer>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
