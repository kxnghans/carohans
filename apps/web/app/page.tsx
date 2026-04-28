import { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  title: 'Home',
  description: 'CaroHans Ventures ERMS. Manage inventory, track rentals, and analyze growth.',
};

export default function LandingPage() {
  return <LandingPageClient />;
}
