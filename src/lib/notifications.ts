import nodemailer from 'nodemailer'
import { companyProfile } from '@/lib/company'
import { displayVehicleRegistration, formatCurrency, formatDate } from '@/lib/utils'

type JobCardEmailPayload = {
  recipientEmail: string
  recipientName: string
  jobNumber: string
  serviceType: string | null
  complaint: string
  estimatedReturn: string | null
  quotedAmount: number
  mechanicName: string | null
  vehicleRegistration: string | null
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
  })
}

export async function sendJobCardCreatedEmail(payload: JobCardEmailPayload) {
  const transporter = getTransporter()
  if (!transporter) return false

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `Azim Motors <${companyProfile.email}>`,
    to: payload.recipientEmail,
    subject: `Your job card ${payload.jobNumber} is ready`,
    text: [
      `Hello ${payload.recipientName},`,
      '',
      `Your vehicle has been booked in at ${companyProfile.name}.`,
      `Job card: ${payload.jobNumber}`,
      `Vehicle registration: ${displayVehicleRegistration(payload.vehicleRegistration)}`,
      `Service type: ${payload.serviceType ?? 'General service / repair'}`,
      `Work requested: ${payload.complaint}`,
      `Estimated amount: ${formatCurrency(payload.quotedAmount)}`,
      `Expected return date: ${formatDate(payload.estimatedReturn)}`,
      `Mechanic in charge: ${payload.mechanicName ?? 'To be assigned'}`,
      '',
      `For updates, contact ${companyProfile.name} on ${companyProfile.phone}.`,
    ].join('\n'),
  })

  return true
}
