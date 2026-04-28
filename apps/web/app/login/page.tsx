import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your CaroHans account to manage your rentals and profile.',
};

export default function LoginPage() {
  return <LoginClient />;
}
