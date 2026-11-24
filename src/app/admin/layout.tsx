import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin-auth';

/**
 * The operator gate for every /admin page.
 *
 * The pages under here are client components that hold no data of their own
 * and load everything from /api/admin/*, which has always checked isAdmin and
 * answers 403 with an empty body. So nothing leaked. But the shells still
 * rendered 200 to anyone who asked, which advertises the surface and invites
 * someone to go looking for the route that forgot its check.
 *
 * notFound() rather than a redirect or a 403: an operator screen should not
 * confirm it exists to someone who is not one.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) notFound();
  return <>{children}</>;
}
