import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NavUser } from "./nav";

const linkClass =
  "rounded-sm text-sm font-bold uppercase tracking-[0.04em] text-[#0b0b0b] transition-colors hover:text-[#1a46ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00]";

export function NavLinks() {
  return (
    <ul className="flex items-center gap-4">
      <li>
        <Link href="/how-it-works" className={linkClass}>
          How it works
        </Link>
      </li>
      <li>
        <Link href="/pricing" className={linkClass}>
          Pricing
        </Link>
      </li>
      <li>
        <Link href="/faq" className={linkClass}>
          FAQ
        </Link>
      </li>
    </ul>
  );
}

export function NavActionLinks({
  user,
  onSignOut,
  signingOut,
}: {
  user?: NavUser | null;
  onSignOut?: () => void;
  signingOut?: boolean;
}) {
  if (user) {
    return (
      <ul className="flex items-center gap-3">
        <li>
          <Link href="/dashboard" className={linkClass}>
            Dashboard
          </Link>
        </li>
        <li>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            isLoading={signingOut}
          >
            Sign out
          </Button>
        </li>
      </ul>
    );
  }

  return (
    <ul className="flex items-center gap-3">
      <li>
        <Link href="/sign-in" className={linkClass}>
          Sign in
        </Link>
      </li>
      <li>
        <Button asChild>
          <Link href="/sign-up">Get started</Link>
        </Button>
      </li>
    </ul>
  );
}

export function MobileNavLinks() {
  return (
    <ul className="flex flex-col gap-1">
      <li>
        <MobileLink href="/how-it-works">How it works</MobileLink>
      </li>
      <li>
        <MobileLink href="/pricing">Pricing</MobileLink>
      </li>
      <li>
        <MobileLink href="/faq">FAQ</MobileLink>
      </li>
    </ul>
  );
}

export function MobileNavActions({
  user,
  onSignOut,
  signingOut,
}: {
  user?: NavUser | null;
  onSignOut?: () => void;
  signingOut?: boolean;
}) {
  if (user) {
    return (
      <div className="flex flex-col gap-2">
        <MobileLink href="/dashboard">Dashboard</MobileLink>
        <MobileLink href="/settings">Account settings</MobileLink>
        <Button
          variant="ghost"
          className="w-full justify-center"
          onClick={onSignOut}
          isLoading={signingOut}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <MobileLink href="/sign-in">Sign in</MobileLink>
      <Button asChild className="w-full justify-center">
        <Link href="/sign-up">Get started</Link>
      </Button>
    </div>
  );
}

function MobileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded py-2 text-left text-sm font-bold uppercase tracking-[0.04em] text-[#0b0b0b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6ff00]"
    >
      {children}
    </Link>
  );
}
