import { Metadata } from 'next';
import SignupClient from './SignupClient';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your CaroHans account to start managing your event rentals.',
};

export default function SignupPage() {
  return <SignupClient />;
}
