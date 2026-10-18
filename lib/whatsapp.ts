/**
 * Mensajes de WhatsApp predeterminados.
 *
 * Cada botón que abre WhatsApp lleva un mensaje ya escrito según desde dónde
 * se toque:
 *   - Pie de página de la tienda → el cliente le escribe a GutiStore.
 *   - Panel de pedidos (admin)   → GutiStore le escribe al cliente, con un
 *                                  mensaje distinto según el estado del pedido.
 *   - Aviso de Telegram          → igual que un pedido "Pendiente".
 *
 * Para cambiar un texto, edita las frases de este archivo.
 */
import { formatUSD } from '@/lib/currency';
import type { OrderItem } from '@/types';

/** Número de WhatsApp de la tienda (formato internacional, solo dígitos). */
export const STORE_WHATSAPP = '584123602569';
export const STORE_INSTAGRAM = '@gutistore.me';

/** Deja solo dígitos; los números venezolanos que empiezan por 0 (04xx…) pasan a 58. */
export function whatsappNumber(phone: string) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `58${digits.slice(1)}`;
  return digits;
}

/** Enlace que abre un chat de WhatsApp con el mensaje ya escrito. */
export function whatsappLink(phone: string, message?: string) {
  const number = whatsappNumber(phone);
  if (!number) return '';
  return message ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/${number}`;
}

/** Mensaje del cliente a la tienda (botón del pie de página). */
export const STORE_CONTACT_MESSAGE =
  'Hola GutiStore 👋 Vi su página web y quiero más información sobre sus productos.';

export function storeWhatsappLink() {
  return whatsappLink(STORE_WHATSAPP, STORE_CONTACT_MESSAGE);
}

/** Lo mínimo de un pedido que hace falta para armar el mensaje. */
export interface WhatsappOrder {
  id: string;
  cliente: string;
  estado?: string;
  total: number;
  items?: OrderItem[];
  ubicacion?: string;
  metodoEntrega?: string;
  metodoPago?: string;
}

function shortId(id: string) {
  return String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
}

function firstName(name: string) {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function productLines(items: OrderItem[] | undefined) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return '• Producto por confirmar';
  return list
    .map(
      (item) =>
        `• ${item.cantidad} × ${item.nombre}${item.varianteNombre ? ` (${item.varianteNombre})` : ''} — ${formatUSD(
          item.subtotal ?? item.cantidad * item.precio
        )}`
    )
    .join('\n');
}

/** Mensaje de la tienda al cliente, distinto según el estado del pedido. */
export function orderWhatsappMessage(order: WhatsappOrder) {
  const hola = `Hola ${firstName(order.cliente)}, te escribimos de GutiStore.`;
  const pedido = `#${shortId(order.id)}`;
  const total = `${formatUSD(order.total)} USD`;
  const entrega = order.metodoEntrega || 'por confirmar';
  const pago = order.metodoPago || 'por confirmar';

  switch (order.estado) {
    case 'Contactado':
      return [
        hola,
        '',
        `Seguimos pendientes de tu pedido ${pedido} por ${total}.`,
        '¿Pudiste revisarlo? Apenas nos confirmes lo apartamos y coordinamos la entrega y el pago.',
      ].join('\n');

    case 'Confirmado':
      return [
        hola,
        '',
        `¡Tu pedido ${pedido} quedó confirmado! ✅`,
        productLines(order.items),
        '',
        `Total: ${total}`,
        `Pago: ${pago}`,
        `Entrega: ${entrega}`,
        '',
        'Cuando hagas el pago, envíanos el comprobante por aquí y empezamos a prepararlo.',
      ].join('\n');

    case 'En preparación':
      return [
        hola,
        '',
        `Recibimos tu pago y ya estamos preparando tu pedido ${pedido} 📦`,
        'Te avisamos por aquí apenas salga.',
      ].join('\n');

    case 'Enviado':
      return [
        hola,
        '',
        `¡Tu pedido ${pedido} ya va en camino! 🚚`,
        `Entrega: ${entrega}${order.ubicacion ? ` (${order.ubicacion})` : ''}.`,
        'Cualquier duda con la entrega, escríbenos por aquí.',
      ].join('\n');

    case 'Entregado':
      return [
        hola,
        '',
        `Tu pedido ${pedido} ya fue entregado. ¡Gracias por comprar con nosotros! 🙌`,
        `Esperamos que lo disfrutes. Síguenos en Instagram ${STORE_INSTAGRAM} para ver lo nuevo y las ofertas.`,
      ].join('\n');

    case 'Cancelado':
      return [
        hola,
        '',
        `Tu pedido ${pedido} fue cancelado.`,
        'Si fue un error o quieres hacer un pedido nuevo, escríbenos por aquí y te ayudamos.',
      ].join('\n');

    case 'Pendiente':
    default:
      return [
        hola,
        '',
        `Recibimos tu pedido ${pedido}:`,
        productLines(order.items),
        '',
        `Total estimado: ${total}`,
        `Ubicación: ${order.ubicacion || 'Por confirmar'}`,
        `Entrega: ${entrega}`,
        `Pago: ${pago}`,
        '',
        'Queremos confirmar disponibilidad y coordinar contigo los próximos pasos. ¿Podemos continuar por este medio?',
      ].join('\n');
  }
}
