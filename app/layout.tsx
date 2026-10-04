import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clearance Room',
  description: 'See what breaks before a rights change goes live.',
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
