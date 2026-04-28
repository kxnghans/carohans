import { Metadata } from 'next';
import InventoryClient from './InventoryClient';

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Explore our event rental inventory and build your order.',
};

export default function PortalInventoryPage() {
  return <InventoryClient />;
}
