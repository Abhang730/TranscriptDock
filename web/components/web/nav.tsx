"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  NavLinks,
  NavActionLinks,
  MobileNavLinks,
  MobileNavActions,
} from "./nav-links";

export interface NavUser {
  email?: string | null;
  avatarUrl?: string | null;
}

export interface NavProps {
  user?: NavUser | null;
}

export function Nav({ user }: NavProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    setSigningOut(true);
    try {
      await supabase?.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b-2 border-[#0b0b0b] bg-[#f6f4ec]/95 transition-shadow duration-75",
        scrolled && "shadow-[4px_4px_0px_0px_#0b0b0b]",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Logo size="md" />

        <div className="hidden items-center gap-6 md:flex">
          <NavLinks />
          <NavActionLinks
            user={user}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded border-2 border-[#0b0b0b] bg-white text-[#0b0b0b] shadow-[3px_3px_0px_0px_#0b0b0b] md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <XMarkIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="mobile-menu"
          className="border-t-2 border-[#0b0b0b] bg-[#f6f4ec] px-5 pb-4 pt-3 shadow-[6px_6px_0px_0px_#0b0b0b] md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            <MobileNavLinks />
            <div className="mt-3 flex flex-col gap-2 border-t-2 border-[#0b0b0b] pt-3">
              <MobileNavActions
                user={user}
                onSignOut={handleSignOut}
                signingOut={signingOut}
              />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function XMarkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
