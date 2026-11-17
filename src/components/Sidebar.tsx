import React from 'react';
import {
  FileText,
  Receipt,
  Calendar,
  Users,
  LayoutDashboard,
  Globe,
  Briefcase,
  ShoppingBag,
  FolderKanban,
  Cpu,
  Database,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';
import { WorkspaceApp } from '../types';
import { KXLogo } from './KXLogo';

interface SidebarProps {
  apps: WorkspaceApp[];
  activeAppId: string;
  onSelectApp: (appId: string) => void;
  onAddApp: () => void;
  onDeleteCustomApp?: (appId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  quotationCount?: number;
}

export const APP_ICONS: Record<string, React.ElementType> = {
  FileText,
  Receipt,
  Calendar,
  Users,
  LayoutDashboard,
  Globe,
  Briefcase,
  ShoppingBag,
  FolderKanban,
  Cpu,
  Database,
  Layers,
  Sparkles,
};

export const Sidebar: React.FC<SidebarProps> = ({
  apps,
  activeAppId,
  onSelectApp,
  onAddApp,
  onDeleteCustomApp,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  quotationCount,
}) => {
  const renderAppIcon = (iconName: string, className = 'w-4 h-4') => {
    const IconComponent = APP_ICONS[iconName] || Layers;
    return <IconComponent className={className} />;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 select-none">
      {/* Top Header / Branding */}
      <div className={`flex items-center justify-between border-b border-neutral-200 h-16 transition-all ${
        isCollapsed ? 'px-3 justify-center' : 'px-4'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 flex items-center justify-center">
            <KXLogo size="sm" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-neutral-900 text-xs tracking-tight leading-tight truncate">
                Knowledge Xchange
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide truncate">
                Multi-App Workspace
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 ${
            isCollapsed ? 'hidden' : ''
          }`}
          title={isCollapsed ? 'ขยายเมนู (Expand)' : 'ย่อเมนู (Collapse)'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* App List Section */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-2 pt-2 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              แอพพลิเคชัน (Apps)
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              {apps.length} แอพ
            </span>
          </div>
        )}

        <div className="space-y-1">
          {apps.map((app) => {
            const isActive = app.id === activeAppId;
            const isQuotation = app.id === 'quotation';

            return (
              <div
                key={app.id}
                className="relative group"
              >
                <button
                  onClick={() => {
                    onSelectApp(app.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all cursor-pointer text-left ${
                    isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  title={isCollapsed ? `${app.name} - ${app.subtitle || ''}` : undefined}
                >
                  {/* App Icon with colored accent badge */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isQuotation
                        ? 'bg-amber-100 text-amber-900'
                        : app.color || 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {renderAppIcon(app.iconName, 'w-4 h-4')}
                  </div>

                  {/* App Details (when expanded) */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs truncate font-medium">
                          {app.name}
                        </span>
                        {isQuotation && quotationCount !== undefined && quotationCount > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold tabular-nums shrink-0 ${
                            isActive ? 'bg-amber-400 text-neutral-900' : 'bg-neutral-200 text-neutral-800'
                          }`}>
                            {quotationCount}
                          </span>
                        )}
                        {!isQuotation && app.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                          }`}>
                            {app.badge}
                          </span>
                        )}
                      </div>
                      {app.subtitle && (
                        <p className={`text-[10px] truncate ${
                          isActive ? 'text-neutral-300' : 'text-neutral-500'
                        }`}>
                          {app.subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* External link indicator */}
                  {!isCollapsed && app.type === 'link' && (
                    <ExternalLink className={`w-3 h-3 shrink-0 ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`} />
                  )}
                </button>

                {/* Delete button for custom user-created apps */}
                {!app.isBuiltIn && onDeleteCustomApp && !isCollapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`คุณต้องการลบแอพ "${app.name}" ออกจากเมนูหรือไม่?`)) {
                        onDeleteCustomApp(app.id);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-neutral-200/60 transition-opacity"
                    title="ลบแอพนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-neutral-900 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <p className="font-semibold">{app.name}</p>
                    {app.subtitle && <p className="text-[10px] text-neutral-300">{app.subtitle}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New App Trigger */}
        <div className="pt-2">
          <button
            onClick={onAddApp}
            className={`w-full flex items-center gap-2.5 rounded-xl border border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50 transition-all cursor-pointer ${
              isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2 text-xs font-semibold'
            }`}
            title="เพิ่มแอพใหม่ (Add App)"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-600">
              <Plus className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="truncate">เพิ่มแอพใหม่...</span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Footer / Collapse Toggle in Collapsed Mode */}
      <div className="p-2 border-t border-neutral-200">
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="ขยายเมนู (Expand Sidebar)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="px-2 py-1 text-[10px] text-neutral-400 flex items-center justify-between">
            <span>KX Portal v2.0</span>
            <button
              onClick={onToggleCollapse}
              className="text-neutral-500 hover:text-neutral-800 flex items-center gap-0.5 cursor-pointer font-medium"
            >
              <span>ย่อแถบ</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 z-30 ${
          isCollapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
