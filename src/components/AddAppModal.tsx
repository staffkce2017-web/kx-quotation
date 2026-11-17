import React, { useState } from 'react';
import {
  X,
  Plus,
  Layers,
  Globe,
  LayoutDashboard,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { WorkspaceApp, WorkspaceAppType } from '../types';
import { APP_ICONS } from './Sidebar';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApp: (newApp: WorkspaceApp) => void;
}

const AVAILABLE_ICONS = [
  'FileText',
  'Receipt',
  'Calendar',
  'Users',
  'LayoutDashboard',
  'Globe',
  'Briefcase',
  'ShoppingBag',
  'FolderKanban',
  'Cpu',
  'Database',
  'Layers',
  'Sparkles',
];

const COLOR_OPTIONS = [
  { label: 'สีเหลืองอำพัน', value: 'bg-amber-100 text-amber-900 border-amber-200' },
  { label: 'สีน้ำเงิน', value: 'bg-blue-100 text-blue-900 border-blue-200' },
  { label: 'สีเขียวมรกต', value: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  { label: 'สีม่วง', value: 'bg-purple-100 text-purple-900 border-purple-200' },
  { label: 'สีส้มพีช', value: 'bg-orange-100 text-orange-900 border-orange-200' },
  { label: 'สีเทากลาง', value: 'bg-neutral-100 text-neutral-800 border-neutral-200' },
];

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onSaveApp,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [iconName, setIconName] = useState('LayoutDashboard');
  const [type, setType] = useState<WorkspaceAppType>('native');
  const [url, setUrl] = useState('');
  const [badge, setBadge] = useState('ใหม่');
  const [color, setColor] = useState(COLOR_OPTIONS[1].value);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อแอพพลิเคชัน');
      return;
    }

    if ((type === 'iframe' || type === 'link') && url.trim() && !/^https?:\/\//i.test(url.trim())) {
      alert('กรุณากรอก URL ที่ขึ้นต้นด้วย http:// หรือ https://');
      return;
    }

    const newApp: WorkspaceApp = {
      id: `app_${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      iconName,
      type,
      url: url.trim() || undefined,
      badge: badge.trim() || undefined,
      color,
      description: description.trim() || undefined,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };

    onSaveApp(newApp);
    onClose();
  };

  const SelectedIcon = APP_ICONS[iconName] || Layers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">เพิ่มแอพพลิเคชันใหม่</h3>
              <p className="text-[11px] text-neutral-400">นำแอพหรือเครื่องมืออื่นๆ มารวมใน Workspace แถบด้านซ้าย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Live Preview Card */}
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-900 truncate">
                  {name.trim() || 'ตัวอย่างชื่อแอพ'}
                </span>
                {badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-neutral-200 text-neutral-800">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 truncate">
                {subtitle.trim() || 'คำอธิบายสั้นๆ ของแอพ'}
              </p>
            </div>
          </div>

          {/* App Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                ชื่อแอพพลิเคชัน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ใบแจ้งหนี้, จองห้อง..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                ป้ายกำกับ (Badge)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="เช่น ใหม่, Beta, พร้อมใช้"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              คำอธิบายย่อ (Subtitle)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="เช่น ระบบออกใบแจ้งหนี้อัตโนมัติ"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
            />
          </div>

          {/* App Type */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              ประเภทการทำงานของแอพ
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('native')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  type === 'native'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">Workspace Tool</p>
                <p className={`text-[10px] mt-0.5 ${type === 'native' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  เครื่องมือในระบบ
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('iframe')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  type === 'iframe'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                <Globe className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">Embedded App</p>
                <p className={`text-[10px] mt-0.5 ${type === 'iframe' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  ฝังหน้าเว็บ iFrame
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType('link')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  type === 'link'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                <ExternalLink className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">External Tool</p>
                <p className={`text-[10px] mt-0.5 ${type === 'link' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  ลิงก์เปิดแท็บใหม่
                </p>
              </button>
            </div>
          </div>

          {/* URL Input (for iframe or external link) */}
          {(type === 'iframe' || type === 'link') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                URL เว็บไซต์ / แอพพลิเคชัน <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/app"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                required={type === 'iframe' || type === 'link'}
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                {type === 'iframe'
                  ? 'จะเปิดแสดงผลเป็นหน้าจอทำงานอยู่ภายในแถบเมนูนี้โดยตรง'
                  : 'เมื่อคลิกจะเปิดไปยังหน้าต่างใหม่'}
              </p>
            </div>
          )}

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              เลือกไอคอนแอพ
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ICONS.map((icName) => {
                const IconComp = APP_ICONS[icName] || Layers;
                const isSelected = iconName === icName;
                return (
                  <button
                    key={icName}
                    type="button"
                    onClick={() => setIconName(icName)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-xs ring-2 ring-neutral-900 ring-offset-1'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={icName}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
              โทนสีไอคอน
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`p-1.5 rounded-lg border text-center text-[10px] font-medium cursor-pointer transition-all ${c.value} ${
                    color === c.value ? 'ring-2 ring-neutral-900 ring-offset-1' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {c.label.split(' ')[1] || c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              รายละเอียดเพิ่มเติม (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุหน้าที่การทำงาน หรือบันทึกการใช้งานของแอพนี้..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกและเพิ่มเข้าแถบซ้าย</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
