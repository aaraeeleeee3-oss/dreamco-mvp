import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendEmail({
  to,
  subject,
  html,
  from = "DREAM.CO <sales@dreamco.ai>",
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  try {
    const data = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}

export async function sendCampaignEmail({
  to,
  subject,
  html,
  campaignId,
  leadId,
}: {
  to: string
  subject: string
  html: string
  campaignId?: string
  leadId?: string
}) {
  // Track opens via a tracking pixel
  const trackingPixel = campaignId && leadId
    ? `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track?campaign=${campaignId}&lead=${leadId}" width="1" height="1" />`
    : ""

  return sendEmail({
    to,
    subject,
    html: html + trackingPixel,
  })
}