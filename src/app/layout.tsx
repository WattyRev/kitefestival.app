import { Inter } from 'next/font/google'
import "./globals.css";
import { css } from '../../styled-system/css';
import TopNav from '@/components/global/TopNav';
import { AuthProvider } from '@/components/global/Auth';

const inter = Inter({ subsets: ['latin'] })
 
export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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