import { redirect } from 'next/navigation';

/** See forgot-password: passwords are gone, so recovery goes to sign-in. */
export default function ResetPasswordPage() {
  redirect('/login');
}
