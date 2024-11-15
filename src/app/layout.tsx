import { Inter } from 'next/font/google'
import "./globals.css";
import { css } from '../../styled-system/css';
import { SpeedInsights } from "@vercel/speed-insights/next"
import TopNav from '@/components/global/TopNav';
import { AuthProvider } from '@/components/global/Auth';

const inter = Inter({ subsets: ['latin'] })
 
export const metadata = {
  title: 'KiteFestival.app',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SpeedInsights />
        <AuthProvider>
          <TopNav />
          <div className={css({ padding: '8px' })}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}