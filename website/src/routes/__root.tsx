import {Link, Outlet, createRootRoute} from "@tanstack/react-router";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link to="/" className="font-semibold tracking-tight">
            gen-gen
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/docs" className="text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <a
              className="text-muted-foreground hover:text-foreground"
              href="https://www.npmjs.com/package/gen-gen"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  ),
});
