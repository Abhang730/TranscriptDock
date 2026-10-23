import { Nav } from "./nav";
import { getSessionUser } from "@/lib/supabase/server";

/**
 * Server-rendered header. Resolves the signed-in user so marketing pages show
 * the right navigation without client-side auth flicker.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <Nav
      user={
        user
          ? { email: user.email, avatarUrl: user.avatarUrl }
          : null
      }
    />
  );
}
