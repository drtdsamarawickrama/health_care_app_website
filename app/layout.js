import './globals.css';
import { AuthProvider } from '@/components/AuthContext';

export const metadata = {
  title: 'HealthCare Home | Healthcare at Your Doorstep',
  description:
    'Book trusted doctors, nurses, and home-care services from one modern healthcare platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
