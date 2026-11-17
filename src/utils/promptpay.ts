/**
 * Utility for Thai PromptPay QR Code Generation (EMVCo Standard)
 * Supports:
 * - 10-digit Mobile Phone Number (e.g. 0812345678 -> 0066812345678)
 * - 13-digit National ID / Tax ID (e.g. 0994000160097)
 * - 15-digit e-Wallet ID
 * - Custom QR payloads
 */

/**
 * Calculates CRC16-CCITT (polynomial 0x1021, initial value 0xFFFF)
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates an EMVCo-compliant Thai PromptPay QR payload string
 * @param promptpayId Mobile number (10 digits) or Tax/Citizen ID (13 digits) or e-Wallet (15 digits)
 * @param amount Optional transaction amount (e.g., 7500.00)
 */
export function generatePromptPayPayload(promptpayId: string, amount?: number): string {
  const cleanedId = (promptpayId || '').replace(/[^0-9]/g, '');

  // If empty or non-numeric, fallback to default KX Tax ID
  const targetId = cleanedId || '0994000160097';

  let subTag = '';
  if (targetId.length === 10) {
    // Mobile phone number: convert 08x-xxx-xxxx to 00668xxxxxxxx (13 chars)
    const intlPhone = `0066${targetId.substring(1)}`;
    subTag = formatTag('01', intlPhone);
  } else if (targetId.length === 13) {
    // Tax ID / National ID (13 chars)
    subTag = formatTag('02', targetId);
  } else if (targetId.length === 15) {
    // e-Wallet ID (15 chars)
    subTag = formatTag('03', targetId);
  } else {
    // If other length, format as Tax ID or fallback
    subTag = formatTag('02', targetId.padEnd(13, '0').slice(0, 13));
  }

  // Tag 29: Merchant Account Info Template
  const aid = formatTag('00', 'A000000677010111');
  const tag29 = formatTag('29', `${aid}${subTag}`);

  // Base EMVCo tags
  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount && amount > 0 ? '12' : '11'); // 11: Static, 12: Dynamic
  payload += tag29;
  payload += formatTag('58', 'TH'); // Country Code
  payload += formatTag('53', '764'); // Currency Code THB (764)

  // Tag 54: Transaction Amount (if specified and > 0)
  if (amount !== undefined && amount > 0) {
    const amtStr = amount.toFixed(2);
    payload += formatTag('54', amtStr);
  }

  // Tag 63: CRC16 Checksum placeholder
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}
