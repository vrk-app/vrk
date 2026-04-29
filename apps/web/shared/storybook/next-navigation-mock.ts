export function useRouter() {
  return {
    back: () => undefined,
    forward: () => undefined,
    prefetch: async () => undefined,
    push: () => undefined,
    refresh: () => undefined,
    replace: () => undefined,
  };
}

export function usePathname() {
  return "/storybook";
}

export function useSearchParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export function redirect() {
  return undefined;
}

export function notFound() {
  return undefined;
}
