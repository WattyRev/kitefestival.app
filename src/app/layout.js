import { Inter } from 'next/font/google'
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import TopNav from '../components/global/TopNav';
import { AuthProvider } from '../components/global/Auth';

const inter = Inter({ subsets: ['latin'] })
 
export const metadata = {
  title: 'KiteFestival.app',
  description: '',
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SpeedInsights />
        <AuthProvider>
          <TopNav />
          <div>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}