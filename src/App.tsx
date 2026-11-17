import React, { useState, useEffect } from 'react';
import { Quotation, QuotationStatus, PaymentSlip, StatusAttachment, WorkspaceApp } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AddAppModal } from './components/AddAppModal';
import { AppWorkspaceView } from './components/AppWorkspaceView';
import { QuotationList } from './components/QuotationList';
import { QuotationEditor } from './components/QuotationEditor';
import { DataAnalyticsView } from './components/DataAnalyticsView';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { StatusTrackerModal } from './components/StatusTrackerModal';
import { PaymentSlipModal } from './components/PaymentSlipModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { SyncToCloudModal } from './components/SyncToCloudModal';
import { getNextQuotationNumber } from './utils/numberGenerator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { PrintView } from './components/PrintView';
import {
  subscribeToQuotations,
  saveQuotationToFirestore,
  deleteQuotationFromFirestore,
  updateQuotationStatusInFirestore,
  savePaymentSlipInFirestore,
  clearAllQuotationsFromFirestore,
  restoreDemoQuotationsToFirestore,
  autoSyncLocalStorageToFirestore,
} from './services/quotationFirestore';

const DEFAULT_WORKSPACE_APPS: WorkspaceApp[] = [
  {
    id: 'quotation',
    name: 'Quotation',
    subtitle: 'ใบเสนอราคาและเอกสารแนบ',
    iconName: 'FileText',
    color: 'bg-amber-100 text-amber-900 border-amber-200',
    isBuiltIn: true,
    type: 'native',
    badge: 'หลัก',
    description: 'ระบบจัดทำและบริหารจัดการใบเสนอราคาอาคารเคเอกซ์ (KX Quotation System)',
  },
  {
    id: 'invoice',
    name: 'Invoice & Billing',
    subtitle: 'ใบแจ้งหนี้ / ใบเสร็จรับเงิน',
    iconName: 'Receipt',
    color: 'bg-blue-100 text-blue-900 border-blue-200',
    isBuiltIn: true,
    type: 'native',
    badge: 'บิลลิ่ง',
    description: 'ระบบออกใบแจ้งหนี้ ใบวางบิล และใบเสร็จรับเงินอัตโนมัติจากใบเสนอราคาที่ยืนยันแล้ว',
  },
  {
    id: 'booking',
    name: 'Venue & Booking',
    subtitle: 'ระบบจองห้องสัมมนา KX',
    iconName: 'Calendar',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    isBuiltIn: true,
    type: 'native',
    badge: 'KX Venue',
    description: 'ระบบตรวจสอบปฏิทิน จองห้องสัมมนา และพื้นที่จัดงานอาคารเคเอกซ์',
  },
  {
    id: 'crm',
    name: 'Customer CRM',
    subtitle: 'ข้อมูลและประวัติลูกค้าองค์กร',
    iconName: 'Users',
    color: 'bg-purple-100 text-purple-900 border-purple-200',
    isBuiltIn: true,
    type: 'native',
    badge: 'สมุดรายชื่อ',
    description: 'ศูนย์รวมข้อมูลลูกค้าองค์กร ประวัติการใช้บริการ และอัตราส่วนลดพิเศษ',
  },
];

const APPS_STORAGE_KEY = 'kx_workspace_apps_v2';
const ACTIVE_APP_STORAGE_KEY = 'kx_workspace_active_app_v2';
const SIDEBAR_COLLAPSED_KEY = 'kx_workspace_sidebar_collapsed_v2';

function AppContent() {
  const { userProfile, loading } = useAuth();

  // Multi-App Workspace Navigation State
  const [apps, setApps] = useState<WorkspaceApp[]>(() => {
    try {
      const saved = localStorage.getItem(APPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasQuotation = parsed.some((a: WorkspaceApp) => a.id === 'quotation');
          if (!hasQuotation) {
            return [DEFAULT_WORKSPACE_APPS[0], ...parsed];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed loading workspace apps from storage:', e);
    }
    return DEFAULT_WORKSPACE_APPS;
  });

  const [activeAppId, setActiveAppId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_APP_STORAGE_KEY) || 'quotation';
    } catch (e) {
      return 'quotation';
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState<boolean>(false);

  // 100% Cloud Firestore state - driven purely by onSnapshot
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'list' | 'analytics' | 'create'>('list');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Modals
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [statusModalQuotation, setStatusModalQuotation] = useState<Quotation | null>(null);
  const [slipModalQuotation, setSlipModalQuotation] = useState<Quotation | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const [isGlobalSyncModalOpen, setIsGlobalSyncModalOpen] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Real-time Firestore onSnapshot Subscription
  // Listens directly to Cloud Firestore collection 'quotations'
  // Any create, update, or delete on any device triggers this listener
  // -------------------------------------------------------------
  useEffect(() => {
    // Automatically and silently sync any lingering local browser quotations to Firestore
    autoSyncLocalStorageToFirestore().catch(() => {});

    setIsSyncing(true);

    const unsubscribe = subscribeToQuotations(
      (realtimeQuotes) => {
        setQuotations(realtimeQuotes);
        setIsLoadingQuotations(false);
        setIsCloudConnected(true);
        setIsSyncing(false);

        // Keep active viewing modal in sync with real-time updates from other users
        if (viewingQuotation) {
          const fresh = realtimeQuotes.find((q) => q.id === viewingQuotation.id);
          if (fresh && fresh.updatedAt !== viewingQuotation.updatedAt) {
            setViewingQuotation(fresh);
          }
        }
        if (statusModalQuotation) {
          const fresh = realtimeQuotes.find((q) => q.id === statusModalQuotation.id);
          if (fresh && fresh.updatedAt !== statusModalQuotation.updatedAt) {
            setStatusModalQuotation(fresh);
          }
        }
      },
      (error) => {
        console.warn('Real-time onSnapshot sync notice:', error.message);
        setIsLoadingQuotations(false);
        setIsCloudConnected(false);
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [viewingQuotation?.id, statusModalQuotation?.id]);

  // -------------------------------------------------------------
  // Handlers: All mutate Cloud Firestore directly (100% cloud-first)
  // onSnapshot immediately broadcasts the change to all connected clients
  // -------------------------------------------------------------

  // Save / Update Quotation directly to Firestore
  const handleSaveQuotation = async (saved: Quotation) => {
    setIsSyncing(true);
    setQuotations((prev) => {
      const exists = prev.some((q) => q.id === saved.id);
      if (exists) {
        return prev.map((q) => (q.id === saved.id ? saved : q));
      }
      return [saved, ...prev];
    });

    try {
      await saveQuotationToFirestore(saved);
      setIsCloudConnected(true);
    } catch (error) {
      console.error('Failed to save quotation to Firestore:', error);
    } finally {
      setIsSyncing(false);
      setEditingQuotation(null);
      setCurrentTab('list');
    }
  };

  // Duplicate Quotation directly to Firestore
  const handleDuplicateQuotation = async (source: Quotation) => {
    setIsSyncing(true);
    const today = new Date().toISOString().split('T')[0];
    const newQuoteNumber = getNextQuotationNumber(quotations, today);

    const duplicated: Quotation = {
      ...source,
      id: `quote-${Date.now()}`,
      quoteNumber: newQuoteNumber,
      issueDate: today,
      jobTitle: `${source.jobTitle} (สำเนา)`,
      status: 'DRAFT',
      statusLogs: [
        {
          id: `log-${Date.now()}`,
          status: 'DRAFT',
          timestamp: new Date().toISOString(),
          note: `สร้างโดยทำสำเนาจากเลขที่ ${source.quoteNumber}`,
          updatedBy: userProfile?.displayName || 'พจนา (ฝ่ายขาย)',
        },
      ],
      paymentSlip: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveQuotationToFirestore(duplicated);
      setIsCloudConnected(true);
    } catch (error) {
      console.error('Failed to save duplicate quotation to Firestore:', error);
    } finally {
      setIsSyncing(false);
      setEditingQuotation(duplicated);
      setCurrentTab('create');
    }
  };

  // Delete Request
  const handleDeleteQuotationRequest = (id: string) => {
    const target = quotations.find((q) => q.id === id);
    if (target) {
      setDeletingQuotation(target);
    }
  };

  // Confirm Delete directly from Firestore
  const handleConfirmDeleteQuotation = async (id: string) => {
    setIsSyncing(true);
    try {
      await deleteQuotationFromFirestore(id);
      setIsCloudConnected(true);
    } catch (error) {
      console.error('Failed to delete quotation from Firestore:', error);
    } finally {
      setIsSyncing(false);
      if (viewingQuotation?.id === id) setViewingQuotation(null);
      setDeletingQuotation(null);
    }
  };

  // Clear all quotations directly from Firestore
  const handleClearAllQuotations = async () => {
    setIsSyncing(true);
    try {
      await clearAllQuotationsFromFirestore();
    } catch (error) {
      console.error('Failed to clear Firestore collection:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore demo quotations directly to Firestore
  const handleRestoreDemoQuotations = async () => {
    setIsSyncing(true);
    try {
      await restoreDemoQuotationsToFirestore();
    } catch (error) {
      console.error('Failed to restore demo quotations to Firestore:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Update Status directly in Firestore
  const handleUpdateStatus = async (
    newStatus: QuotationStatus,
    note: string,
    updatedBy: string,
    attachments?: StatusAttachment[]
  ) => {
    if (!statusModalQuotation) return;
    setIsSyncing(true);

    try {
      const updated = await updateQuotationStatusInFirestore(
        statusModalQuotation,
        newStatus,
        note,
        updatedBy || userProfile?.displayName || 'เจ้าหน้าที่ KX',
        attachments
      );
      setStatusModalQuotation(updated);
      if (viewingQuotation?.id === updated.id) {
        setViewingQuotation(updated);
      }
    } catch (error) {
      console.error('Failed to update quotation status in Firestore:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add attachment to specific history log directly in Firestore
  const handleAddAttachmentToLog = async (
    logId: string,
    attachment: StatusAttachment
  ) => {
    if (!statusModalQuotation) return;
    setIsSyncing(true);

    const updatedQuote: Quotation = {
      ...statusModalQuotation,
      statusLogs: statusModalQuotation.statusLogs.map((log) => {
        if (log.id !== logId) return log;
        return {
          ...log,
          attachments: [...(log.attachments || []), attachment],
        };
      }),
      updatedAt: new Date().toISOString(),
    };

    setStatusModalQuotation(updatedQuote);
    if (viewingQuotation?.id === updatedQuote.id) {
      setViewingQuotation(updatedQuote);
    }

    try {
      await saveQuotationToFirestore(updatedQuote);
    } catch (error) {
      console.error('Failed to save log attachment in Firestore:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save payment slip directly in Firestore
  const handleSaveSlip = async (slip: PaymentSlip) => {
    if (!slipModalQuotation) return;
    setIsSyncing(true);

    try {
      const updated = await savePaymentSlipInFirestore(
        slipModalQuotation,
        slip,
        userProfile?.displayName || 'ฝ่ายบัญชีและการเงิน'
      );
      setSlipModalQuotation(null);
      if (statusModalQuotation?.id === updated.id) {
        setStatusModalQuotation(updated);
      }
      if (viewingQuotation?.id === updated.id) {
        setViewingQuotation(updated);
      }
    } catch (error) {
      console.error('Failed to save payment slip in Firestore:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Multi-App Management Handlers
  const handleSaveApp = (newApp: WorkspaceApp) => {
    setApps((prev) => {
      const updated = [...prev, newApp];
      try {
        localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveAppId(newApp.id);
    try {
      localStorage.setItem(ACTIVE_APP_STORAGE_KEY, newApp.id);
    } catch (e) {}
  };

  const handleDeleteCustomApp = (appId: string) => {
    setApps((prev) => {
      const updated = prev.filter((a) => a.id !== appId);
      try {
        localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (activeAppId === appId) {
      setActiveAppId('quotation');
      try {
        localStorage.setItem(ACTIVE_APP_STORAGE_KEY, 'quotation');
      } catch (e) {}
    }
  };

  const handleSelectApp = (id: string) => {
    const targetApp = apps.find((a) => a.id === id);
    if (targetApp && targetApp.type === 'link' && targetApp.url) {
      window.open(targetApp.url, '_blank');
      return;
    }
    setActiveAppId(id);
    try {
      localStorage.setItem(ACTIVE_APP_STORAGE_KEY, id);
    } catch (e) {}
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch (e) {}
      return next;
    });
  };

  // Dedicated Print Mode: Check if URL query has ?print=QUOTE_ID
  // Placed BEFORE userProfile check so print window loads instantly without auth delay
  const urlParams = new URLSearchParams(window.location.search);
  const printId = urlParams.get('print');
  const printPage = (urlParams.get('page') as 'quotation' | 'annex' | 'both') || 'both';

  if (printId) {
    let printQuotation = quotations.find((q) => q.id === printId);

    // If not found in realtime state, check localStorage / sessionStorage
    if (!printQuotation) {
      try {
        const cached = localStorage.getItem('print_quotation_data') || sessionStorage.getItem('print_quotation_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.id === printId || printId === 'current')) {
            printQuotation = parsed;
          }
        }
      } catch (e) {
        console.warn('Failed reading cached quotation for print:', e);
      }
    }

    if (printQuotation) {
      return (
        <PrintView
          quotation={printQuotation}
          page={printPage}
          onClose={() => {
            if (window.opener) {
              window.close();
            } else {
              window.history.replaceState({}, '', window.location.pathname);
              window.location.reload();
            }
          }}
        />
      );
    }

    // Only show loading if we are still fetching and haven't found the quote yet
    if (isLoadingQuotations) {
      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-neutral-400 font-medium tracking-wide">
              กำลังโหลดเอกสารสำหรับการพิมพ์...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-200 text-center max-w-md w-full space-y-4">
          <p className="text-sm font-semibold text-neutral-800">ไม่พบเอกสารใบเสนอราคาที่ต้องการพิมพ์</p>
          <button
            onClick={() => {
              window.history.replaceState({}, '', window.location.pathname);
              window.location.reload();
            }}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Loading Screen for Auth
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-400 font-medium tracking-wide">
            กำลังตรวจสอบสิทธิ์การใช้งาน Knowledge Xchange...
          </p>
        </div>
      </div>
    );
  }

  // Authentication Guard: Must be logged in to access the system
  if (!userProfile) {
    return <LoginScreen />;
  }

  const currentActiveApp = apps.find((a) => a.id === activeAppId) || apps[0] || DEFAULT_WORKSPACE_APPS[0];

  return (
    <div className="min-h-screen bg-neutral-100 flex font-sans text-neutral-900 select-text">
      {/* Left Sidebar Menu */}
      <Sidebar
        apps={apps}
        activeAppId={activeAppId}
        onSelectApp={handleSelectApp}
        onAddApp={() => setIsAddAppModalOpen(true)}
        onDeleteCustomApp={handleDeleteCustomApp}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        quotationCount={quotations.length}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {activeAppId === 'quotation' ? (
          <>
            {/* Top Navbar with Real-time Cloud Connection Indicator */}
            <Navbar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                if (tab === 'create') {
                  setEditingQuotation(null);
                }
                setCurrentTab(tab);
              }}
              quotationCount={quotations.length}
              isCloudConnected={isCloudConnected}
              isSyncing={isSyncing}
              onOpenSyncModal={() => setIsGlobalSyncModalOpen(true)}
              onToggleSidebar={() => setIsMobileSidebarOpen(true)}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              {currentTab === 'list' && (
                <QuotationList
                  quotations={quotations}
                  isLoading={isLoadingQuotations}
                  onSelectQuotation={(q) => setViewingQuotation(q)}
                  onEditQuotation={(q) => {
                    setEditingQuotation(q);
                    setCurrentTab('create');
                  }}
                  onDuplicateQuotation={handleDuplicateQuotation}
                  onDeleteQuotation={handleDeleteQuotationRequest}
                  onOpenStatusModal={(q) => setStatusModalQuotation(q)}
                  onOpenSlipModal={(q) => setSlipModalQuotation(q)}
                  onCreateNew={() => {
                    setEditingQuotation(null);
                    setCurrentTab('create');
                  }}
                  onRestoreDemo={handleRestoreDemoQuotations}
                  onClearAll={handleClearAllQuotations}
                />
              )}

              {currentTab === 'analytics' && (
                <DataAnalyticsView
                  quotations={quotations}
                  onSelectQuotation={(q) => setViewingQuotation(q)}
                />
              )}

              {currentTab === 'create' && (
                <QuotationEditor
                  quotations={quotations}
                  initialQuotation={editingQuotation}
                  onSave={handleSaveQuotation}
                  onCancel={() => {
                    setEditingQuotation(null);
                    setCurrentTab('list');
                  }}
                />
              )}
            </main>
          </>
        ) : (
          <AppWorkspaceView
            app={currentActiveApp}
            onBackToQuotation={() => handleSelectApp('quotation')}
            quotations={quotations}
            onSelectQuotation={(q) => {
              setViewingQuotation(q);
              handleSelectApp('quotation');
            }}
          />
        )}
      </div>

      {/* Add App Modal */}
      <AddAppModal
        isOpen={isAddAppModalOpen}
        onClose={() => setIsAddAppModalOpen(false)}
        onSaveApp={handleSaveApp}
      />

      {/* Document Viewer Modal (A4 Print / Save PDF / View) */}
      {viewingQuotation && (
        <DocumentViewerModal
          quotation={viewingQuotation}
          isOpen={!!viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          onEdit={(q) => {
            setEditingQuotation(q);
            setCurrentTab('create');
          }}
          onUpdateQuotation={handleSaveQuotation}
          onOpenStatusModal={(q) => setStatusModalQuotation(q)}
          onOpenSlipModal={(q) => setSlipModalQuotation(q)}
        />
      )}

      {/* Status Tracker Modal */}
      {statusModalQuotation && (
        <StatusTrackerModal
          quotation={statusModalQuotation}
          isOpen={!!statusModalQuotation}
          onClose={() => setStatusModalQuotation(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddAttachmentToLog={handleAddAttachmentToLog}
          onOpenSlipModal={() => {
            setSlipModalQuotation(statusModalQuotation);
          }}
        />
      )}

      {/* Payment Slip Modal */}
      {slipModalQuotation && (
        <PaymentSlipModal
          quotation={slipModalQuotation}
          isOpen={!!slipModalQuotation}
          onClose={() => setSlipModalQuotation(null)}
          onSaveSlip={handleSaveSlip}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuotation && (
        <DeleteConfirmationModal
          quotation={deletingQuotation}
          isOpen={!!deletingQuotation}
          onClose={() => setDeletingQuotation(null)}
          onConfirmDelete={handleConfirmDeleteQuotation}
        />
      )}

      {/* Global Sync / Export LocalStorage to Cloud Firestore Modal */}
      <SyncToCloudModal
        isOpen={isGlobalSyncModalOpen}
        onClose={() => setIsGlobalSyncModalOpen(false)}
        existingCloudQuoteIds={quotations.map((q) => q.id)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
