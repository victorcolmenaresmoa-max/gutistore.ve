/**
 * Avisos de pedidos nuevos por Telegram.
 *
 * Se activa solo si existen estas variables de entorno (en Vercel):
 *   TELEGRAM_BOT_TOKEN  → el token que entrega @BotFather.
 *   TELEGRAM_CHAT_ID    → a quién le llega el aviso. Admite varios separados por coma
 *                         (por ejemplo tu chat y el de otra persona, o un grupo).
 *
 * Si faltan, la tienda funciona igual y simplemente no envía avisos.
 * Un fallo de Telegram nunca impide que el pedido se guarde.
 */
import { formatUSD } from '@/lib/currency';
import type { CreatedOrder, OrderItem, OrderPayload } from '@/types';

const TELEGRAM_TIMEOUT_MS = 8000;
const MAX_MESSAGE_LENGTH = 4000; // Telegram admite 4096 caracteres.

function telegramConfig() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatIds = (process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return token && chatIds.length ? { token, chatIds } : null;
}

export function isTelegramConfigured() {
  return telegramConfig() !== null;
}

/** Escapa texto para el modo HTML de Telegram. */
function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return '';
}

/** Número para el enlace de WhatsApp: solo dígitos; los números locales (04xx) pasan a +58. */
function whatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `58${digits.slice(1)}`;
  return digits;
}

function itemLine(item: OrderItem) {
  const detail = [item.varianteNombre, item.color, item.talla, item.opcionNombre || item.opcion]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(' · ');
  const subtotal = item.subtotal ?? item.precio * item.cantidad;
  const price = subtotal > 0 ? ` — ${formatUSD(subtotal)}` : '';
  return `• ${item.cantidad} × ${esc(item.nombre)}${detail ? ` <i>(${esc(detail)})</i>` : ''}${price}`;
}

export function buildOrderMessage(order: OrderPayload, created: CreatedOrder) {
  const items = created.items && created.items.length ? created.items : order.items;
  const total = Number(created.total) || items.reduce((sum, i) => sum + (i.subtotal ?? i.precio * i.cantidad), 0);
  const shortId = created.id ? created.id.slice(0, 8).toUpperCase() : '';
  const wa = whatsappNumber(order.telefono);
  const url = siteUrl();

  // null = línea omitida; '' = línea en blanco para separar bloques.
  const lines: Array<string | null> = [
    `🛒 <b>Nuevo pedido${shortId ? ` #${esc(shortId)}` : ''}</b>`,
    '',
    `👤 <b>${esc(order.cliente)}</b>`,
    wa ? `📱 <a href="https://wa.me/${wa}">${esc(order.telefono)}</a> (toca para abrir WhatsApp)` : `📱 ${esc(order.telefono)}`,
    order.email ? `✉️ ${esc(order.email)}` : null,
    `📍 ${esc(order.ubicacion)}${order.direccion ? ` — ${esc(order.direccion)}` : ''}`,
    `🚚 ${esc(order.metodoEntrega)}`,
    `💳 ${esc(order.metodoPago)}`,
    order.vendedorCodigo ? `🏷️ Vendedor: ${esc(order.vendedorCodigo)}` : null,
    '',
    '<b>Productos</b>',
    ...items.map(itemLine),
    '',
    `💰 <b>Total: ${formatUSD(total)}</b>`,
    order.notas ? '' : null,
    order.notas ? `📝 <i>${esc(order.notas)}</i>` : null,
    created.saved === false ? '' : null,
    created.saved === false ? '⚠️ El pedido no quedó guardado en la base de datos. Revísalo.' : null,
    url ? '' : null,
    url ? `<a href="${url}/admin">Abrir panel de pedidos</a>` : null,
  ];

  let text = lines.filter((line): line is string => line !== null).join('\n');
  if (text.length > MAX_MESSAGE_LENGTH) text = `${text.slice(0, MAX_MESSAGE_LENGTH - 20)}\n…(mensaje recortado)`;
  return text;
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Telegram respondió ${response.status} para el chat ${chatId}: ${detail.slice(0, 200)}`);
  }
}

/** Envía el aviso del pedido a todos los chats configurados. Nunca lanza errores. */
export async function notifyNewOrder(order: OrderPayload, created: CreatedOrder) {
  const config = telegramConfig();
  if (!config) return;
  const text = buildOrderMessage(order, created);
  const results = await Promise.allSettled(config.chatIds.map((id) => sendTelegramMessage(config.token, id, text)));
  for (const result of results) {
    if (result.status === 'rejected') console.error('Aviso de Telegram no enviado:', result.reason);
  }
}
