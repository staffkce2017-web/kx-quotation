import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Quotation, QuotationStatus, PaymentSlip, StatusAttachment } from '../types';
import { INITIAL_QUOTATIONS } from '../data/initialData';

export const QUOTATIONS_COLLECTION = 'quotations';

/**
 * Strips undefined values to ensure Firestore compatibility.
 * Firestore throws errors if any property is undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Real-time listener for Quotations collection directly from Firebase Cloud Firestore.
 * Listens for live updates (Add / Modify / Delete) using onSnapshot.
 * 100% cloud-driven without reading or writing to LocalStorage.
 */
export function subscribeToQuotations(
  onUpdate: (quotations: Quotation[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, QUOTATIONS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      // Convert snapshot documents to Quotation array
      const items: Quotation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Quotation;
        if (data && data.id) {
          items.push(data);
        }
      });

      // Sort by creation or issue date (latest first)
      items.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.issueDate).getTime() || 0;
        const timeB = new Date(b.createdAt || b.issueDate).getTime() || 0;
        return timeB - timeA;
      });

      // Dispatch real-time items directly to state
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore onSnapshot error:', error);
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

/**
 * Compresses an image data URL to ensure it stays well under Firestore's 1MB document limit.
 */
function compressImageDataUrl(dataUrl?: string, maxWidth = 180, quality = 0.45): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    // If already small (< 40KB), keep as is
    if (dataUrl.length < 40 * 1024) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', quality);

        // If still too large (> 100KB), compress further
        if (compressed.length > 100 * 1024) {
          canvas.width = Math.round(width * 0.7);
          canvas.height = Math.round(height * 0.7);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          compressed = canvas.toDataURL('image/jpeg', 0.3);
        }

        resolve(compressed);
      } catch (e) {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = dataUrl;
  });
}

/**
 * Save or update a quotation directly in Firebase Cloud Firestore.
 * Automatically compresses all image URLs (logos, slips, QR codes, signatures, attachments)
 * to prevent 1MB Firestore document limit errors.
 */
export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  const [
    logoUrl,
    annexLogoUrl,
    slipUrl,
    qrImageUrl,
    recSigUrl,
    prepSigUrl,
    apprSigUrl,
    authSigUrl,
  ] = await Promise.all([
    compressImageDataUrl(quotation.logoUrl, 220, 0.5),
    compressImageDataUrl(quotation.annexConfig?.logoUrl, 220, 0.5),
    compressImageDataUrl(quotation.paymentSlip?.imageUrl, 250, 0.5),
    compressImageDataUrl(quotation.bankInfo?.qrImageUrl, 180, 0.4),
    compressImageDataUrl(quotation.signatures?.receivedBy?.signatureUrl, 160, 0.4),
    compressImageDataUrl(quotation.signatures?.preparedBy?.signatureUrl, 160, 0.4),
    compressImageDataUrl(quotation.signatures?.approvedBy?.signatureUrl, 160, 0.4),
    compressImageDataUrl(quotation.signatures?.authorizedSignature?.signatureUrl, 160, 0.4),
  ]);

  let additionalSignatures = quotation.signatures?.additionalSignatures;
  if (additionalSignatures && additionalSignatures.length > 0) {
    additionalSignatures = await Promise.all(
      additionalSignatures.map(async (sig) => ({
        ...sig,
        signatureUrl: await compressImageDataUrl(sig.signatureUrl, 160, 0.4),
      }))
    );
  }

  let statusLogs = quotation.statusLogs;
  if (statusLogs && statusLogs.length > 0) {
    statusLogs = await Promise.all(
      statusLogs.map(async (log) => {
        if (!log.attachments || log.attachments.length === 0) return log;
        const compressedAttachments = await Promise.all(
          log.attachments.map(async (att) => ({
            ...att,
            url: att.type === 'file' ? (await compressImageDataUrl(att.url, 200, 0.4)) || att.url : att.url,
          }))
        );
        return { ...log, attachments: compressedAttachments };
      })
    );
  }

  let updatedQuotation: Quotation = {
    ...quotation,
    logoUrl,
    annexConfig: quotation.annexConfig ? { ...quotation.annexConfig, logoUrl: annexLogoUrl } : undefined,
    paymentSlip: quotation.paymentSlip ? { ...quotation.paymentSlip, imageUrl: slipUrl } : undefined,
    bankInfo: quotation.bankInfo ? { ...quotation.bankInfo, qrImageUrl } : quotation.bankInfo,
    signatures: quotation.signatures ? {
      ...quotation.signatures,
      receivedBy: { ...quotation.signatures.receivedBy, signatureUrl: recSigUrl },
      preparedBy: { ...quotation.signatures.preparedBy, signatureUrl: prepSigUrl },
      approvedBy: { ...quotation.signatures.approvedBy, signatureUrl: apprSigUrl },
      authorizedSignature: { ...quotation.signatures.authorizedSignature, signatureUrl: authSigUrl },
      additionalSignatures,
    } : quotation.signatures,
    statusLogs,
    updatedAt: new Date().toISOString(),
  };

  let sanitized = sanitizeForFirestore(updatedQuotation);
  let serialized = JSON.stringify(sanitized);

  // Hard limit guard: Firestore 1MB limit. If still > 900KB, remove paymentSlip image and heavy signature urls
  if (serialized.length > 900 * 1024) {
    if (updatedQuotation.paymentSlip?.imageUrl) {
      updatedQuotation.paymentSlip.imageUrl = undefined;
    }
    if (updatedQuotation.signatures?.authorizedSignature?.signatureUrl) {
      updatedQuotation.signatures.authorizedSignature.signatureUrl = undefined;
    }
    if (updatedQuotation.logoUrl) {
      updatedQuotation.logoUrl = undefined;
    }
    sanitized = sanitizeForFirestore(updatedQuotation);
    serialized = JSON.stringify(sanitized);
  }

  const docRef = doc(db, QUOTATIONS_COLLECTION, quotation.id);
  await setDoc(docRef, JSON.parse(serialized), { merge: true });
}

/**
 * Delete a quotation directly from Firebase Cloud Firestore.
 * Automatically removes the document across all devices in real-time via onSnapshot.
 */
export async function deleteQuotationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, QUOTATIONS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Update quotation status and history logs directly in Firebase Cloud Firestore.
 */
export async function updateQuotationStatusInFirestore(
  quotation: Quotation,
  newStatus: QuotationStatus,
  note: string,
  updatedBy: string,
  attachments?: StatusAttachment[]
): Promise<Quotation> {
  const updatedQuote: Quotation = {
    ...quotation,
    status: newStatus,
    statusLogs: [
      ...quotation.statusLogs,
      {
        id: `log-${Date.now()}`,
        status: newStatus,
        timestamp: new Date().toISOString(),
        note: note || `เปลี่ยนสถานะเป็น ${newStatus}`,
        updatedBy: updatedBy || 'เจ้าหน้าที่ KX',
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  await saveQuotationToFirestore(updatedQuote);
  return updatedQuote;
}

/**
 * Save payment slip directly in Firebase Cloud Firestore and mark as PAID.
 */
export async function savePaymentSlipInFirestore(
  quotation: Quotation,
  slip: PaymentSlip,
  updatedBy: string
): Promise<Quotation> {
  const updatedQuote: Quotation = {
    ...quotation,
    paymentSlip: slip,
    status: 'PAID',
    statusLogs: [
      ...quotation.statusLogs,
      {
        id: `log-${Date.now()}`,
        status: 'PAID',
        timestamp: new Date().toISOString(),
        note: `แนบสลิปการโอนเงิน ${slip.bankName || ''} ยอด ฿${slip.amount.toLocaleString()} เลขที่อ้างอิง: ${slip.refNumber || '-'}`,
        updatedBy: updatedBy || 'ฝ่ายบัญชีและการเงิน',
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  await saveQuotationToFirestore(updatedQuote);
  return updatedQuote;
}

/**
 * Clears all quotation documents directly from Firebase Cloud Firestore.
 */
export async function clearAllQuotationsFromFirestore(): Promise<void> {
  const snapshot = await getDocs(collection(db, QUOTATIONS_COLLECTION));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}

/**
 * Restores initial demo quotations directly to Firebase Cloud Firestore.
 */
export async function restoreDemoQuotationsToFirestore(): Promise<void> {
  const batch = writeBatch(db);
  for (const q of INITIAL_QUOTATIONS) {
    const docRef = doc(db, QUOTATIONS_COLLECTION, q.id);
    batch.set(docRef, sanitizeForFirestore(q));
  }
  await batch.commit();
}

/**
 * Scans browser LocalStorage for any existing quotations saved previously.
 * Allows users to migrate their local browser quotations to Firebase Cloud Firestore.
 */
export function scanLocalStorageQuotations(): Quotation[] {
  const found: Quotation[] = [];
  const candidateKeys: string[] = [
    'kx_quotations_app_v1',
    'kx_quotations_data_v2',
    'kx_quotations_realtime_cache',
  ];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        !candidateKeys.includes(k) &&
        (k.toLowerCase().includes('quote') || k.toLowerCase().includes('kx_'))
      ) {
        candidateKeys.push(k);
      }
    }
  } catch (e) {}

  candidateKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (
              item &&
              item.id &&
              item.quoteNumber &&
              !found.some((f) => f.id === item.id)
            ) {
              found.push(item);
            }
          });
        }
      }
    } catch (e) {}
  });

  return found;
}

/**
 * Uploads a list of quotations to Firebase Cloud Firestore in batches.
 * Seamlessly merges/writes each quotation to Firestore.
 */
export async function batchUploadQuotationsToFirestore(items: Quotation[]): Promise<number> {
  if (!items || items.length === 0) return 0;

  // Firestore allows up to 500 writes per batch
  const batchSize = 400;
  let count = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const batch = writeBatch(db);
    for (const q of chunk) {
      const docRef = doc(db, QUOTATIONS_COLLECTION, q.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          ...q,
          updatedAt: q.updatedAt || new Date().toISOString(),
        }),
        { merge: true }
      );
    }
    await batch.commit();
    count += chunk.length;
  }

  return count;
}

/**
 * Automatically and silently syncs any remaining local quotations to Firestore in background.
 * Ensures hands-free 100% real-time cloud data without requiring users to click any button.
 */
export async function autoSyncLocalStorageToFirestore(): Promise<void> {
  try {
    const localItems = scanLocalStorageQuotations();
    if (localItems.length > 0) {
      await batchUploadQuotationsToFirestore(localItems);
      const candidateKeys = [
        'kx_quotations_app_v1',
        'kx_quotations_data_v2',
        'kx_quotations_realtime_cache',
      ];
      candidateKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('Silent auto-sync notice:', err);
  }
}

