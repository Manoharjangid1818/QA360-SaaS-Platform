// Root page — redirects to the dashboard (works without auth in mock mode)
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
