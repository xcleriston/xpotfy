import './globals.css'
import type { Metadata } from 'next'
import { Inter, League_Spartan, Fredoka_One } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const heading = League_Spartan({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700', '800', '900']
})
const display = Fredoka_One({ 
  subsets: ['latin'], 
  variable: '--font-display',
  weight: '400'
})

export const metadata: Metadata = {
  title: 'Prediz.tech - White Label de Mercado de Predições',
  description: 'Plataforma white label premium para mercados de predições. Lance sua própria marca com tecnologia de ponta e posicionamento sólido.',
  keywords: 'white label, mercado de predições, plataforma de apostas, tecnologia financeira, blockchain, crypto',
  authors: [{ name: 'Prediz.tech' }],
  openGraph: {
    title: 'Prediz.tech - White Label de Mercado de Predições',
    description: 'Plataforma white label premium para mercados de predições',
    type: 'website',
    url: 'https://prediz.tech',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prediz.tech',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prediz.tech - White Label de Mercado de Predições',
    description: 'Plataforma white label premium para mercados de predições',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${heading.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
