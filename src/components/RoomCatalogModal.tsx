import React, { useState, useEffect } from 'react';
import { RoomCatalogItem } from '../types';
import {
  loadRoomCatalog,
  addRoomToCatalog,
  updateRoomInCatalog,
  deleteRoomFromCatalog,
  resetRoomCatalog,
  getAvailableFloors,
} from '../utils/roomCatalog';
import { formatCurrency } from '../utils/thaiBahtText';
import {
  Building2,
  Tv,
  Coffee,
  Plus,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  Check,
  X,
  Layers,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react';

interface RoomCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (room: RoomCatalogItem) => void;
}

export const RoomCatalogModal: React.FC<RoomCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const [catalog, setCatalog] = useState<RoomCatalogItem[]>(loadRoomCatalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'room' | 'equipment' | 'service'>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  
  // Add new form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'room' as 'room' | 'equipment' | 'service',
    unit: 'วัน',
    // Weekday rates
    unitPrice: 7500,
    fullDayPrice: 7500,
    halfDayPrice: 4500,
    hourlyPrice: 1200,
    // Weekend rates
    fullDayWeekendPrice: 9000,
    halfDayWeekendPrice: 5400,
    hourlyWeekendPrice: 1400,
    floor: 'FL.11',
    capacity: '30-40 ท่าน',
    description: '',
  });

  // Modal in-app confirm dialogs
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync when catalog changes
  useEffect(() => {
    const handleRoomsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<RoomCatalogItem[]>;
      if (customEvent.detail) {
        setCatalog(customEvent.detail);
      } else {
        setCatalog(loadRoomCatalog());
      }
    };
    window.addEventListener('kx_rooms_updated', handleRoomsUpdated);
    return () => window.removeEventListener('kx_rooms_updated', handleRoomsUpdated);
  }, []);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const floors = getAvailableFloors(catalog);

  const handleOpenAdd = () => {
    setEditingId(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      category: 'room',
      unit: 'วัน',
      unitPrice: 7500,
      fullDayPrice: 7500,
      halfDayPrice: 4500,
      hourlyPrice: 1200,
      fullDayWeekendPrice: 9000,
      halfDayWeekendPrice: 5400,
      hourlyWeekendPrice: 1400,
      floor: floorFilter !== 'all' ? floorFilter : (floors[0] || 'FL.11'),
      capacity: '30-40 ท่าน',
      description: '',
    });
    setIsAddingNew(true);
  };

  const handleOpenEdit = (item: RoomCatalogItem) => {
    setIsAddingNew(false);
    setErrorMessage(null);
    setEditingId(item.id);

    const fullWeekday = item.fullDayPrice ?? item.unitPrice ?? 7500;
    const halfWeekday = item.halfDayPrice ?? Math.round(fullWeekday * 0.6);
    const hourWeekday = item.hourlyPrice ?? Math.round(fullWeekday / 8);

    const fullWeekend = item.fullDayWeekendPrice ?? Math.round(fullWeekday * 1.2);
    const halfWeekend = item.halfDayWeekendPrice ?? Math.round(halfWeekday * 1.2);
    const hourWeekend = item.hourlyWeekendPrice ?? Math.round(hourWeekday * 1.2);

    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit || 'วัน',
      unitPrice: fullWeekday,
      fullDayPrice: fullWeekday,
      halfDayPrice: halfWeekday,
      hourlyPrice: hourWeekday,
      fullDayWeekendPrice: fullWeekend,
      halfDayWeekendPrice: halfWeekend,
      hourlyWeekendPrice: hourWeekend,
      floor: item.floor || '',
      capacity: item.capacity || '',
      description: item.description || '',
    });
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('กรุณาระบุชื่อห้องหรือรายการบริการ');
      return;
    }
    if (formData.unitPrice < 0) {
      setErrorMessage('ราคาต้องไม่ติดลบ');
      return;
    }

    const fullDay = Number(formData.fullDayPrice) || Number(formData.unitPrice);
    const halfDay = Number(formData.halfDayPrice) || Math.round(fullDay * 0.6);
    const hourly = Number(formData.hourlyPrice) || Math.round(fullDay / 8);

    const fullDayWeekend = Number(formData.fullDayWeekendPrice) || Math.round(fullDay * 1.2);
    const halfDayWeekend = Number(formData.halfDayWeekendPrice) || Math.round(halfDay * 1.2);
    const hourlyWeekend = Number(formData.hourlyWeekendPrice) || Math.round(hourly * 1.2);

    if (editingId) {
      const updated = updateRoomInCatalog(editingId, {
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit.trim() || 'วัน',
        unitPrice: fullDay,
        fullDayPrice: fullDay,
        halfDayPrice: halfDay,
        hourlyPrice: hourly,
        fullDayWeekendPrice: fullDayWeekend,
        halfDayWeekendPrice: halfDayWeekend,
        hourlyWeekendPrice: hourlyWeekend,
        floor: formData.floor?.trim(),
        capacity: formData.capacity?.trim(),
        description: formData.description?.trim(),
      });
      setCatalog(updated);
      setEditingId(null);
      showNotification('อัพเดทข้อมูลห้องและอัตราค่าเช่าเรียบร้อยแล้ว');
    } else {
      const newItem = addRoomToCatalog({
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit.trim() || 'วัน',
        unitPrice: fullDay,
        fullDayPrice: fullDay,
        halfDayPrice: halfDay,
        hourlyPrice: hourly,
        fullDayWeekendPrice: fullDayWeekend,
        halfDayWeekendPrice: halfDayWeekend,
        hourlyWeekendPrice: hourlyWeekend,
        floor: formData.floor?.trim(),
        capacity: formData.capacity?.trim(),
        description: formData.description?.trim(),
      });
      setCatalog(loadRoomCatalog());
      setIsAddingNew(false);
      showNotification(`เพิ่มห้อง "${newItem.name}" สำเร็จ`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const updated = deleteRoomFromCatalog(deleteConfirmTarget.id);
    setCatalog(updated);
    showNotification(`ลบรายการ "${deleteConfirmTarget.name}" เรียบร้อยแล้ว`);
    setDeleteConfirmTarget(null);
  };

  const handleConfirmResetDefaults = () => {
    const res = resetRoomCatalog();
    setCatalog(res);
    setShowResetConfirm(false);
    showNotification('รีเซ็ตฐานข้อมูลห้องเป็นค่าเริ่มต้นมาตรฐาน KX เรียบร้อยแล้ว');
  };

  // Filter catalog items
  const filteredItems = catalog.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (floorFilter !== 'all' && item.floor !== floorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchFloor = (item.floor || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchName && !matchFloor && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  ระบบจัดการห้อง ชั้น และอัตราค่าเช่า (Admin Catalog)
                </h2>
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  วันธรรมดา & เสาร์-อาทิตย์
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                กำหนดราคาเต็มวัน (8-10 ชม.), ครึ่งวัน (3-5 ชม.), และรายชั่วโมง สำหรับคำนวณอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มห้อง/บริการใหม่</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="รีเซ็ตค่าเริ่มต้นมาตรฐาน KX"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Check className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Controls / Filter Bar */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-200/70 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setFloorFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ทั้งหมด ({catalog.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('room')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'room'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                ห้องสัมมนา/ประชุม ({catalog.filter((c) => c.category === 'room').length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('equipment');
                  setFloorFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'equipment'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-emerald-600" />
                อุปกรณ์ ({catalog.filter((c) => c.category === 'equipment').length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('service');
                  setFloorFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  categoryFilter === 'service'
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                บริการ & ค่านำเข้าอาหาร ({catalog.filter((c) => c.category === 'service').length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อห้อง, ชั้น, หรือราคา..."
                className="w-full pl-9 pr-7 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-neutral-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Floor Sub-Filter (Visible when 'room' or 'all') */}
          {(categoryFilter === 'room' || categoryFilter === 'all') && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-neutral-500 font-semibold flex items-center gap-1 mr-1 text-[11px]">
                <Layers className="w-3 h-3 text-neutral-400" />
                กรองตามชั้น:
              </span>
              <button
                type="button"
                onClick={() => setFloorFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  floorFilter === 'all'
                    ? 'bg-neutral-800 text-white font-bold shadow-2xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                ทุกชั้น
              </button>
              {floors.map((fl) => {
                const count = catalog.filter((c) => c.category === 'room' && c.floor === fl).length;
                return (
                  <button
                    type="button"
                    key={fl}
                    onClick={() => setFloorFilter(fl)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                      floorFilter === fl
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>{fl}</span>
                    <span className="opacity-75 font-mono text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Form Drawer */}
        {(isAddingNew || editingId) && (
          <form
            onSubmit={handleSaveItem}
            className="p-5 bg-gradient-to-r from-amber-50/90 to-amber-100/40 border-b border-amber-200 text-xs space-y-3 animate-in slide-in-from-top duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>{editingId ? 'แก้ไขข้อมูลห้องและอัตราค่าเช่า (วันธรรมดา & เสาร์-อาทิตย์)' : 'เพิ่มห้องหรือบริการใหม่เข้าระบบ'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingId(null);
                  setErrorMessage(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2 bg-rose-100 border border-rose-300 rounded text-rose-800 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Category */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    let defaultUnit = 'วัน';
                    if (cat === 'equipment') defaultUnit = 'เครื่อง/วัน';
                    if (cat === 'service') defaultUnit = 'รายการ';
                    setFormData({ ...formData, category: cat, unit: defaultUnit });
                  }}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
                >
                  <option value="room">🏢 ห้องสัมมนา/ห้องประชุม</option>
                  <option value="equipment">📺 อุปกรณ์เสริม/เครื่องฉาย</option>
                  <option value="service">🍱 บริการเสริม/ค่านำเข้าอาหาร & เครื่องดื่ม</option>
                </select>
              </div>

              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">
                  ชื่อห้อง / รายการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ห้องสัมมนา X11.2 หรือ Auditorium"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
                />
              </div>

              {/* Floor */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ชั้น (Floor)
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="เช่น ชั้น 1, ชั้น 7, ชั้น 11"
                  list="floors-datalist"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none font-medium"
                />
                <datalist id="floors-datalist">
                  {floors.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Pricing Section: 1. วันธรรมดา (จันทร์-ศุกร์) */}
            <div className="p-3 bg-white/95 border border-emerald-300/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-emerald-950 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. อัตราค่าเช่า "วันธรรมดา จันทร์ - ศุกร์" (Weekday)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  จันทร์ - ศุกร์
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Full day Weekday */}
                <div>
                  <label className="block text-[11px] font-semibold text-blue-900 mb-0.5">
                    เต็มวัน (8-10 ชม.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.fullDayPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData,
                          fullDayPrice: val,
                          unitPrice: val,
                          halfDayPrice: formData.halfDayPrice || Math.round(val * 0.6),
                          hourlyPrice: formData.hourlyPrice || Math.round(val / 8),
                          fullDayWeekendPrice: formData.fullDayWeekendPrice || Math.round(val * 1.2),
                          halfDayWeekendPrice: formData.halfDayWeekendPrice || Math.round(val * 0.72),
                          hourlyWeekendPrice: formData.hourlyWeekendPrice || Math.round(val / 7),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-blue-50/40 border border-blue-200 rounded-lg font-mono text-right font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>

                {/* Half day Weekday */}
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 mb-0.5">
                    ครึ่งวัน (3-5 ชม.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.halfDayPrice}
                      onChange={(e) => setFormData({ ...formData, halfDayPrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-200 rounded-lg font-mono text-right font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>

                {/* Hourly Weekday */}
                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-0.5">
                    รายชั่วโมง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.hourlyPrice}
                      onChange={(e) => setFormData({ ...formData, hourlyPrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-purple-50/40 border border-purple-200 rounded-lg font-mono text-right font-bold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>

                {/* Unit label */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                    หน่วยนับ
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="วัน, ห้อง, เครื่อง/วัน"
                    className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-center font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section: 2. วันเสาร์ - อาทิตย์ (Weekend) */}
            <div className="p-3 bg-white/95 border border-orange-300/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-orange-950 font-bold">
                <span className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  <span>2. อัตราค่าเช่า "วันเสาร์ - อาทิตย์" (Weekend)</span>
                </span>
                <span className="text-[10px] text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  เสาร์ - อาทิตย์
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Full day Weekend */}
                <div>
                  <label className="block text-[11px] font-semibold text-orange-950 mb-0.5">
                    เต็มวัน เสาร์-อาทิตย์ (8-10 ชม.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.fullDayWeekendPrice}
                      onChange={(e) => setFormData({ ...formData, fullDayWeekendPrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-orange-50/40 border border-orange-200 rounded-lg font-mono text-right font-bold text-orange-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>

                {/* Half day Weekend */}
                <div>
                  <label className="block text-[11px] font-semibold text-orange-950 mb-0.5">
                    ครึ่งวัน เสาร์-อาทิตย์ (3-5 ชม.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.halfDayWeekendPrice}
                      onChange={(e) => setFormData({ ...formData, halfDayWeekendPrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-orange-50/40 border border-orange-200 rounded-lg font-mono text-right font-bold text-orange-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>

                {/* Hourly Weekend */}
                <div>
                  <label className="block text-[11px] font-semibold text-orange-950 mb-0.5">
                    รายชั่วโมง เสาร์-อาทิตย์ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.hourlyWeekendPrice}
                      onChange={(e) => setFormData({ ...formData, hourlyWeekendPrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-orange-50/40 border border-orange-200 rounded-lg font-mono text-right font-bold text-orange-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[10px] text-neutral-400 absolute left-2 top-2">฿</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ความจุ (Capacity)
                </label>
                <input
                  type="text"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="เช่น 30-40 ท่าน, 100-150 ท่าน"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="เช่น พร้อมโปรเจคเตอร์ เครื่องเสียง และไวท์บอร์ด"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingId(null);
                  setErrorMessage(null);
                }}
                className="px-3.5 py-1.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกข้อมูลห้องและอัตราค่าเช่า</span>
              </button>
            </div>
          </form>
        )}

        {/* In-app Delete Confirmation Box */}
        {deleteConfirmTarget && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2 text-rose-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                คุณแน่ใจหรือไม่ว่าต้องการลบ <strong className="font-bold">"{deleteConfirmTarget.name}"</strong> ออกจากระบบ?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-md font-semibold hover:bg-neutral-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบ</span>
              </button>
            </div>
          </div>
        )}

        {/* In-app Reset Defaults Confirmation Box */}
        {showResetConfirm && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                ต้องการรีเซ็ตข้อมูลห้องและอัตราค่าเช่ากลับเป็นค่าเริ่มต้นมาตรฐานของอาคาร KX (ชั้น 1, 7, 9, 10, 11, 14) หรือไม่?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-md font-semibold hover:bg-neutral-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDefaults}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ยืนยันการรีเซ็ต</span>
              </button>
            </div>
          </div>
        )}

        {/* Catalog Items List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm text-neutral-600">ไม่พบรายการห้องหรือบริการที่ค้นหา</p>
              <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มห้อง/บริการใหม่"</p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100/90 text-neutral-700 font-semibold border-b border-neutral-200">
                    <th className="p-3">ชั้น / หมวด</th>
                    <th className="p-3">ชื่อห้อง / รายการ</th>
                    <th className="p-3 text-right">วันธรรมดา (จ.-ศ.)</th>
                    <th className="p-3 text-right">วันเสาร์ - อาทิตย์</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredItems.map((item) => {
                    const fullWeekday = item.fullDayPrice || item.unitPrice || 0;
                    const halfWeekday = item.halfDayPrice || Math.round(fullWeekday * 0.6);
                    const hourWeekday = item.hourlyPrice || Math.round(fullWeekday / 8);

                    const fullWeekend = item.fullDayWeekendPrice || Math.round(fullWeekday * 1.2);
                    const halfWeekend = item.halfDayWeekendPrice || Math.round(halfWeekday * 1.2);
                    const hourWeekend = item.hourlyWeekendPrice || Math.round(hourWeekday * 1.2);

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition-colors group">
                        <td className="p-3 whitespace-nowrap">
                          {item.floor ? (
                            <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                              {item.floor}
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">-</span>
                          )}
                          <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">
                            {item.category === 'room' ? 'ห้องสัมมนา' : item.category === 'equipment' ? 'อุปกรณ์' : 'บริการ'}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isCustom && (
                              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded font-normal">
                                กำหนดเอง
                              </span>
                            )}
                          </div>
                          {item.capacity && (
                            <span className="text-[11px] text-neutral-500 block">
                              ความจุ: {item.capacity}
                            </span>
                          )}
                          {item.description && (
                            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </td>

                        {/* Weekday Rates */}
                        <td className="p-3 text-right font-mono whitespace-nowrap">
                          <div className="font-bold text-emerald-900 text-xs">
                            เต็มวัน: ฿{formatCurrency(fullWeekday)}
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            ครึ่งวัน: ฿{formatCurrency(halfWeekday)}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            ราย ชม.: ฿{formatCurrency(hourWeekday)}
                          </div>
                        </td>

                        {/* Weekend Rates */}
                        <td className="p-3 text-right font-mono whitespace-nowrap">
                          <div className="font-bold text-orange-950 text-xs">
                            เต็มวัน: ฿{formatCurrency(fullWeekend)}
                          </div>
                          <div className="text-[11px] text-orange-800">
                            ครึ่งวัน: ฿{formatCurrency(halfWeekend)}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            ราย ชม.: ฿{formatCurrency(hourWeekend)}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {onSelectItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectItem(item);
                                  onClose();
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-semibold text-[11px] transition-colors"
                              >
                                เลือก
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-neutral-500 hover:text-amber-800 hover:bg-amber-100/50 rounded transition-colors"
                              title="แก้ไขห้องและราคา"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget({ id: item.id, name: item.name })}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="ลบห้องนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div>
            รวมทั้งสิ้น <strong>{catalog.length}</strong> รายการ (ห้องประชุม {catalog.filter((c) => c.category === 'room').length} ห้อง)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
