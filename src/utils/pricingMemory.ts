import { Quotation, QuotationItem } from '../types';

export interface RememberedItem {
  id: string;
  description: string;
  unitPrice: number;
  unit: string;
  discountPercent?: number;
  usageCount: number;
  lastUsed: string;
  customerName?: string;
  category?: 'room' | 'food' | 'equipment' | 'service' | 'other';
}

export interface CustomerPricingPreference {
  customerName: string;
  contactPerson?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  taxId?: string;
  preferredDiscountRate?: number;
  paymentTermType?: string;
  frequentItems: RememberedItem[];
  lastUpdated: string;
}

const GLOBAL_PRICING_MEMORY_KEY = 'kx_pricing_memory_v1';
const CUSTOMER_PREFERENCES_KEY = 'kx_customer_preferences_v1';

// 1. Get all remembered items
export function getRememberedItems(): RememberedItem[] {
  try {
    const raw = localStorage.getItem(GLOBAL_PRICING_MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 2. Save an item to global memory
export function saveItemToPricingMemory(item: QuotationItem, customerName?: string): void {
  if (!item.description || !item.description.trim()) return;
  const desc = item.description.trim();
  const price = Number(item.unitPrice) || 0;
  const unit = (item.unit || '').trim() || 'รายการ';
  const discount = Number(item.discountPercent) || 0;

  const items = getRememberedItems();
  const existingIndex = items.findIndex((i) => i.description.toLowerCase() === desc.toLowerCase());

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      unitPrice: price,
      unit,
      discountPercent: discount,
      usageCount: (items[existingIndex].usageCount || 1) + 1,
      lastUsed: new Date().toISOString(),
      customerName: customerName || items[existingIndex].customerName,
    };
  } else {
    items.unshift({
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: desc,
      unitPrice: price,
      unit,
      discountPercent: discount,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
      customerName,
    });
  }

  // Keep top 200 items sorted by last used / usage count
  const sorted = items.slice(0, 200);
  try {
    localStorage.setItem(GLOBAL_PRICING_MEMORY_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.warn('Failed to save pricing memory:', err);
  }
}

// 3. Get customer preferences map
export function getCustomerPreferencesMap(): Record<string, CustomerPricingPreference> {
  try {
    const raw = localStorage.getItem(CUSTOMER_PREFERENCES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// 4. Get specific customer preferences
export function getCustomerPreference(customerName: string): CustomerPricingPreference | null {
  if (!customerName || !customerName.trim()) return null;
  const cleanName = customerName.trim().toLowerCase();
  const map = getCustomerPreferencesMap();
  
  // Exact match first
  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase() === cleanName) {
      return val;
    }
  }

  // Partial match
  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase().includes(cleanName) || cleanName.includes(key.toLowerCase())) {
      return val;
    }
  }

  return null;
}

// 5. Save customer preferences and frequent items
export function saveCustomerQuotationMemory(quotation: Quotation): void {
  if (!quotation.customer?.name || !quotation.customer.name.trim()) return;
  const customerName = quotation.customer.name.trim();
  const map = getCustomerPreferencesMap();
  const existing = map[customerName] || {
    customerName,
    frequentItems: [],
    lastUpdated: new Date().toISOString(),
  };

  // Update customer profile details
  if (quotation.customer.contactPerson) existing.contactPerson = quotation.customer.contactPerson;
  if (quotation.customer.phone) existing.phone = quotation.customer.phone;
  if (quotation.customer.mobile) existing.mobile = quotation.customer.mobile;
  if (quotation.customer.email) existing.email = quotation.customer.email;
  if (quotation.customer.address) existing.address = quotation.customer.address;
  if (quotation.customer.taxId) existing.taxId = quotation.customer.taxId;
  if (quotation.customer.discountRate !== undefined) existing.preferredDiscountRate = quotation.customer.discountRate;
  if (quotation.paymentTermType) existing.paymentTermType = quotation.paymentTermType;
  existing.lastUpdated = new Date().toISOString();

  // Merge items into customer's frequent items
  const custItems = existing.frequentItems || [];
  for (const item of quotation.items) {
    if (!item.description || !item.description.trim()) continue;
    saveItemToPricingMemory(item, customerName);

    const desc = item.description.trim();
    const existingItemIdx = custItems.findIndex((ci) => ci.description.toLowerCase() === desc.toLowerCase());
    if (existingItemIdx >= 0) {
      custItems[existingItemIdx] = {
        ...custItems[existingItemIdx],
        unitPrice: Number(item.unitPrice) || 0,
        unit: item.unit || custItems[existingItemIdx].unit,
        discountPercent: Number(item.discountPercent) || 0,
        usageCount: (custItems[existingItemIdx].usageCount || 1) + 1,
        lastUsed: new Date().toISOString(),
      };
    } else {
      custItems.unshift({
        id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: desc,
        unitPrice: Number(item.unitPrice) || 0,
        unit: item.unit || 'รายการ',
        discountPercent: Number(item.discountPercent) || 0,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
        customerName,
      });
    }
  }

  existing.frequentItems = custItems.slice(0, 50);
  map[customerName] = existing;

  try {
    localStorage.setItem(CUSTOMER_PREFERENCES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save customer memory:', err);
  }
}

// 6. Suggest remembered price for a given description
export function findRememberedPriceForDescription(desc: string, customerName?: string): { price: number; unit?: string; discount?: number } | null {
  if (!desc || !desc.trim()) return null;
  const clean = desc.trim().toLowerCase();

  // Check customer specific memory first
  if (customerName) {
    const custPref = getCustomerPreference(customerName);
    if (custPref && custPref.frequentItems) {
      const match = custPref.frequentItems.find((i) => i.description.toLowerCase() === clean);
      if (match) {
        return {
          price: match.unitPrice,
          unit: match.unit,
          discount: match.discountPercent,
        };
      }
    }
  }

  // Check global memory
  const globalItems = getRememberedItems();
  const globalMatch = globalItems.find((i) => i.description.toLowerCase() === clean);
  if (globalMatch) {
    return {
      price: globalMatch.unitPrice,
      unit: globalMatch.unit,
      discount: globalMatch.discountPercent,
    };
  }

  return null;
}
