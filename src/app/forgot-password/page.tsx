import { redirect } from 'next/navigation';

/**
 * There are no passwords any more, so there is nothing to recover. Anyone
 * who arrives from an old link or a bookmark gets the flow that works: the
 * sign-in page mails them a code.
 *
 * A reset page left standing would be a worse dead end than a redirect: it
 * would walk someone through choosing a password they could never use to
 * sign in.
 */
export default function ForgotPasswordPage() {
  redirect('/login');
}
