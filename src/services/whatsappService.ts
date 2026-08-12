/**
 * WhatsApp integration service for AUTOOS.
 * Formats WhatsApp links for customer quotes, service order updates, and notification actions.
 */

export function normalizeWhatsAppPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`
  }
  return clean
}

export function formatWhatsAppQuoteUrl(
  phone: string,
  customerName: string,
  portalTokenUrl: string,
  totalAmount: number
): string {
  const cleanPhone = normalizeWhatsAppPhone(phone)
  const formattedAmount = totalAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  const message = `Olá ${customerName}, seu orçamento no valor de ${formattedAmount} está pronto na AUTOOS. Acesse o link para visualizar e aprovar os serviços: ${portalTokenUrl}`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function formatWhatsAppStatusUrl(
  phone: string,
  customerName: string,
  osCode: number,
  statusLabel: string,
  portalTokenUrl: string
): string {
  const cleanPhone = normalizeWhatsAppPhone(phone)
  const message = `Olá ${customerName}, a Ordem de Serviço #${osCode} teve seu status atualizado para: ${statusLabel}. Acompanhe os detalhes pelo link: ${portalTokenUrl}`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppMessage(url: string): void {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
