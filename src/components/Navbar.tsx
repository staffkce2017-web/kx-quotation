import React, { useState } from 'react';
import { FileText, BarChart3, Plus, LogOut, ChevronDown, Sparkles, Image as ImageIcon, CloudUpload, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KXLogo } from './KXLogo';
import { LogoSettingsModal } from './LogoSettingsModal';

interface NavbarProps {
  currentTab: 'list' | 'analytics' | 'create';
  onSelectTab: (tab: 'list' | 'analytics' | 'create') => void;
  quotationCount: number;
  isCloudConnected?: boolean;
  isSyncing?: boolean;
  onOpenSyncModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  quotationCount,
  isCloudConnected = true,
  isSyncing = false,
  onOpenSyncModal,
  onToggleSidebar,
}) => {
  const { userProfile, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] px-1.5 py-0.2 rounded font-bold">Admin</span>;
      case 'ACCOUNTING':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-bold">การเงิน</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] px-1.5 py-0.2 rounded font-bold">ฝ่ายขาย</span>;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 no-print shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Logo & Title with Change Logo Trigger */}
            <div className="flex items-center gap-2.5 min-w-0">
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1.5 -ml-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  title="เปิด/ปิดแถบเมนูด้านข้าง (Toggle Apps Sidebar)"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div
                onClick={() => setIsLogoModalOpen(true)}
                className="relative group cursor-pointer shrink-0 transition-transform active:scale-95 p-1 -m-1 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
                title="คลิกเพื่อเปลี่ยนหรือดูการตั้งค่ารูปโลโก้ (Change Logo)"
              >
                <KXLogo size="sm" />
                <span className="font-extrabold text-neutral-900 text-sm leading-tight tracking-tight">
                  Knowledge Xchange
                </span>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Quotation
                </span>
                {/* Real-time Cloud Firestore Indicator */}
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                    isCloudConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title={
                    isCloudConnected
                      ? 'ระบบเชื่อมต่อและซิงค์ข้อมูลกับ Firebase Cloud Firestore แบบ Real-time (onSnapshot) อัตโนมัติตลอดเวลา ไม่จำเป็นต้องกดปุ่มใดๆ'
                      : 'กำลังเชื่อมต่อฐานข้อมูลบนคลาวด์...'
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSyncing
                        ? 'bg-blue-500 animate-spin'
                        : isCloudConnected
                        ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-300/60'
                        : 'bg-amber-500'
                    }`}
                  ></span>
                  <span>{isSyncing ? 'กำลังบันทึกลงคลาวด์...' : isCloudConnected ? 'Real-time อัตโนมัติ' : 'Offline'}</span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => onSelectTab('list')}
                  className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'list'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">ใบเสนอราคา</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      currentTab === 'list' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {quotationCount}
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('analytics')}
                  className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === 'analytics'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">สรุป & ข้อมูล</span>
                </button>

                <button
                  onClick={() => onSelectTab('create')}
                  className="px-3 sm:px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">สร้างใบเสนอราคา</span>
                  <span className="md:hidden">สร้าง</span>
                </button>
              </nav>

              {/* User Profile & Logout */}
              {userProfile && (
                <div className="relative pl-2 sm:pl-3 border-l border-neutral-200">
                  <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer select-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-neutral-800 leading-tight flex items-center gap-1">
                        <span>{userProfile.displayName}</span>
                        {getRoleBadge(userProfile.role)}
                      </div>
                      <div className="text-[10px] text-neutral-500 leading-tight truncate max-w-[130px]">
                        {userProfile.email}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
                  </div>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl z-40 py-2 text-xs">
                        <div className="px-3 py-2 border-b border-neutral-100">
                          <div className="font-bold text-neutral-800">{userProfile.displayName}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{userProfile.email}</div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] text-neutral-400">สิทธิ์:</span>
                            {getRoleBadge(userProfile.role)}
                          </div>
                        </div>

                        {/* Change Logo Option in Menu */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setIsLogoModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-100 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                        >
                          <ImageIcon className="w-4 h-4 text-orange-600" />
                          <span>เปลี่ยน / อัปโหลดรูปโลโก้</span>
                        </button>

                        {/* Sync Data to Cloud Option in Menu */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenSyncModal?.();
                          }}
                          className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-100 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                        >
                          <CloudUpload className="w-4 h-4 text-orange-600" />
                          <span>Sync Data to Cloud (ส่งข้อมูลขึ้นคลาวด์)</span>
                        </button>

                        <div className="my-1 border-t border-neutral-100"></div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>ออกจากระบบ (Logout)</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logo Settings Modal */}
      <LogoSettingsModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </>
  );
};
