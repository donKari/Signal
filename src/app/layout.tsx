import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Pulse — Alertes Marchés Intelligentes',
  description: 'Surveillez vos marchés 24/7. Alertes de prix en temps réel sur cryptos et actions.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
