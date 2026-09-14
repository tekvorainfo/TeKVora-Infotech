import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RouterContextType {
  pathname: string;
  params: Record<string, string>;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  params: {},
  navigate: () => {},
});

// ─── BrowserRouter ────────────────────────────────────────────────────────────
export function BrowserRouter({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [params] = useState<Record<string, string>>({});

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    setPathname(to.split('?')[0]);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useLocation() {
  const { pathname } = useContext(RouterContext);
  return { pathname };
}

export function useParams<T extends Record<string, string>>(): T {
  return useContext(RouterContext).params as T;
}

// ─── Route matching ───────────────────────────────────────────────────────────
function matchRoute(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ─── Route / Routes ───────────────────────────────────────────────────────────
interface RouteConfig {
  path: string;
  element: ReactNode;
}

interface RoutesProps {
  children: ReactNode;
}

function collectRoutes(children: ReactNode): RouteConfig[] {
  const routes: RouteConfig[] = [];
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child && typeof child === 'object' && 'props' in child) {
      const c = child as React.ReactElement<{ path?: string; element?: ReactNode; children?: ReactNode }>;
      if (c.props.path !== undefined) {
        routes.push({ path: c.props.path, element: c.props.element ?? null });
      }
    }
  }
  return routes;
}

export function Routes({ children }: RoutesProps) {
  const { pathname, navigate } = useContext(RouterContext);
  const routes = collectRoutes(children);

  for (const route of routes) {
    const params = matchRoute(route.path, pathname);
    if (params !== null) {
      return (
        <RouterContext.Provider value={{ pathname, params, navigate }}>
          {route.element}
        </RouterContext.Provider>
      );
    }
  }
  return null;
}

export function Route(_props: { path: string; element?: ReactNode }) {
  return null;
}

// ─── Navigate (redirect) ─────────────────────────────────────────────────────
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const { navigate } = useContext(RouterContext);
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

// ─── Link ─────────────────────────────────────────────────────────────────────
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, onClick, className, ...rest }: LinkProps) {
  const { navigate } = useContext(RouterContext);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
