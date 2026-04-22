import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Signal — Alertes Marchés Intelligentes',
  description: 'Recevez des alertes personnalisées sur les marchés financiers en temps réel.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
