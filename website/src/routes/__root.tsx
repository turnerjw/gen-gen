import {Link, Outlet, createRootRoute} from "@tanstack/react-router";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";

const navLinkClass = "text-sm text-muted-foreground transition hover:text-foreground";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-grid">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            gen-gen
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 md:gap-6">
            <Link to="/docs" className={navLinkClass} activeProps={{className: "text-foreground"}}>
              Docs
            </Link>
            <Link to="/playground" className={navLinkClass} activeProps={{className: "text-foreground"}}>
              Playground
            </Link>
            <a className={navLinkClass} href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer">
              npm
            </a>
            <a className={navLinkClass} href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <Outlet />
      </main>
      <footer className="border-t bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p>Type-safe factory generation for test suites.</p>
          <p>Built with TypeScript, Faker, TanStack Router, and Tailwind.</p>
        </div>
      </footer>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
