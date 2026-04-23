// app/api/notify/route.ts
// Sends alert notifications via Resend (email)
// Called by the client when an alert is triggered
// For production: move trigger logic server-side with a real cron job

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import type { Alert } from '@/lib/alerts'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alertes@pulse.finance'

function formatPrice(price: number): string {
  if (price < 1)    return `$${price.toFixed(4)}`
  if (price < 100)  return `$${price.toFixed(2)}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price)
}

function buildEmailHtml(alert: Alert, currentPrice: number): string {
  const isUp = alert.condition === 'above' || alert.condition === 'change_up'
  const accentColor = isUp ? '#10b981' : '#ef4444'
  const conditionText = {
    above:       `est passé au-dessus de ${formatPrice(alert.targetValue)}`,
    below:       `est passé en dessous de ${formatPrice(alert.targetValue)}`,
    change_up:   `a augmenté de +${alert.targetValue}%`,
    change_down: `a baissé de -${alert.targetValue}%`,
  }[alert.condition]

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alerte Pulse — ${alert.assetSymbol}</title>
</head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Courier New',monospace;color:#e8edf2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c10;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${accentColor};">
                ● SIGNAL
              </span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#0e1419;border:1px solid rgba(255,255,255,0.07);padding:40px;">

              <!-- Asset + condition -->
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#5a6a7a;">
                Alerte déclenchée
              </p>
              <h1 style="margin:0 0 24px;font-size:28px;font-weight:800;letter-spacing:-0.02em;font-family:system-ui,sans-serif;color:#e8edf2;line-height:1.2;">
                ${alert.assetSymbol}
                <span style="color:${accentColor};">${conditionText.split(' ').slice(0, 2).join(' ')}</span>
                ${conditionText.split(' ').slice(2).join(' ')}
              </h1>

              <!-- Price block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141c24;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#5a6a7a;">Prix actuel</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:${accentColor};font-family:system-ui,sans-serif;letter-spacing:-0.02em;">
                      ${formatPrice(currentPrice)}
                    </p>
                  </td>
                  <td style="padding:24px 28px;border-left:1px solid rgba(255,255,255,0.07);">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#5a6a7a;">Cible fixée</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#e8edf2;font-family:system-ui,sans-serif;">
                      ${alert.condition.startsWith('change') ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Asset details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a;">Actif</span>
                    <span style="float:right;font-size:13px;color:#e8edf2;">${alert.assetName} (${alert.assetSymbol})</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a;">Type</span>
                    <span style="float:right;font-size:13px;color:#e8edf2;">${alert.assetType === 'crypto' ? '⬡ Crypto' : '◈ Action'}</span>
                  </td>
                </tr>
                ${alert.note ? `<tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a;">Note</span>
                    <span style="float:right;font-size:13px;color:#e8edf2;">${alert.note}</span>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6a7a;">Heure</span>
                    <span style="float:right;font-size:13px;color:#e8edf2;">${new Date().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://signal.app'}/dashboard/alerts"
                 style="display:block;text-align:center;background:${accentColor};color:#080c10;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
                Voir mes alertes →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#5a6a7a;letter-spacing:0.05em;">
                Signal · Alertes marchés en temps réel<br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://signal.app'}/dashboard/alerts"
                   style="color:#5a6a7a;text-decoration:underline;">
                  Gérer mes alertes
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  let body: { alert: Alert; currentPrice: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { alert, currentPrice } = body
  if (!alert || currentPrice == null) {
    return NextResponse.json({ error: 'Missing alert or currentPrice' }, { status: 400 })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Signal Alertes <${FROM_EMAIL}>`,
      to: [alert.contactValue],
      subject: `🔔 ${alert.assetSymbol} — Alerte déclenchée · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentPrice)}`,
      html: buildEmailHtml(alert, currentPrice),
    })

    if (error) {
      console.error('[notify] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err: any) {
    console.error('[notify] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
