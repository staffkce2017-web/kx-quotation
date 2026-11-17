import React, { useState, useEffect, useRef } from 'react';
import { RoomCatalogItem, QuotationItem } from '../types';
import {
  loadRoomCatalog,
  getAvailableFloors,
  calculateRoomRate,
  parseHoursBetween,
  parseTimeRangeStringToHours,
  getDayType,
  UsageCalculationResult,
} from '../utils/roomCatalog';
import { formatCurrency, formatThaiDate } from '../utils/thaiBahtText';
import {
  Building2,
  Clock,
  Layers,
  Sparkles,
  Settings,
  Calendar,
  CheckCircle2,
  Zap,
  Tag,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  CalendarDays,
  PlusCircle,
  Copy,
} from 'lucide-react';

interface DynamicRoomCalculatorProps {
  eventDate: string;
  onEventDateChange?: (date: string) => void;
  customerDiscountRate: number;
  onInstantUpdateRoomItem: (item: QuotationItem) => void;
  onAddRoomItem?: (item: QuotationItem) => void;
  onAddMultipleRoomItems?: (items: QuotationItem[]) => void;
  onOpenCatalogAdmin: () => void;
  defaultEventTime?: string;
  onUpdateTimeRange?: (timeStr: string) => void;
}

export const DynamicRoomCalculator: React.FC<DynamicRoomCalculatorProps> = ({
  eventDate,
  onEventDateChange,
  customerDiscountRate,
  onInstantUpdateRoomItem,
  onAddRoomItem,
  onAddMultipleRoomItems,
  onOpenCatalogAdmin,
  defaultEventTime = '08:00-12:00',
  onUpdateTimeRange,
}) => {
  const [catalog, setCatalog] = useState<RoomCatalogItem[]>(loadRoomCatalog);
  const [mode, setMode] = useState<'single' | 'multi'>('single');

  // Single Room mode state
  const [selectedFloor, setSelectedFloor] = useState<string>('FL.11');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomJobTitle, setRoomJobTitle] = useState<string>('');
  
  // Duration state (default 4 hours = half day)
  const [durationHours, setDurationHours] = useState<number>(4);
  const [timeMode, setTimeMode] = useState<'hours' | 'timerange'>('hours');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('12:00');

  // Real-time auto-sync enabled by default
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const lastSyncHash = useRef<string>('');

  // Multi-day & Multi-room mode state
  const [multiDates, setMultiDates] = useState<string[]>([
    eventDate || new Date().toISOString().split('T')[0]
  ]);
  const [multiDateTimes, setMultiDateTimes] = useState<Record<string, string>>({});
  const [multiDateHours, setMultiDateHours] = useState<Record<string, number>>({});
  const [multiSelectedRoomIds, setMultiSelectedRoomIds] = useState<string[]>([]);
  const [multiFloor, setMultiFloor] = useState<string>('FL.11');
  const [newDateInput, setNewDateInput] = useState<string>('');
  const [addedSuccessToast, setAddedSuccessToast] = useState<string | null>(null);

  // Sync catalog updates from localStorage event
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

  const floors = getAvailableFloors(catalog);
  const roomItems = catalog.filter((c) => c.category === 'room');

  // Ensure selectedFloor exists in available floors
  useEffect(() => {
    if (floors.length > 0 && !floors.includes(selectedFloor) && selectedFloor !== 'all') {
      setSelectedFloor(floors.includes('FL.11') ? 'FL.11' : floors[0]);
    }
    if (floors.length > 0 && !floors.includes(multiFloor) && multiFloor !== 'all') {
      setMultiFloor(floors.includes('FL.11') ? 'FL.11' : floors[0]);
    }
  }, [floors, selectedFloor, multiFloor]);

  // Keep multiDates in sync if eventDate changes initially and multiDates only has 1 default
  useEffect(() => {
    if (eventDate && multiDates.length === 1 && !multiDates.includes(eventDate)) {
      setMultiDates([eventDate]);
    }
  }, [eventDate]);

  // Filter rooms by selected floor
  const roomsForSelectedFloor = selectedFloor === 'all'
    ? roomItems
    : roomItems.filter((r) => r.floor === selectedFloor);

  const roomsForMultiFloor = multiFloor === 'all'
    ? roomItems
    : roomItems.filter((r) => r.floor === multiFloor);

  // Auto-select first room in floor if current selection not in floor
  useEffect(() => {
    if (roomsForSelectedFloor.length > 0) {
      const exists = roomsForSelectedFloor.some((r) => r.id === selectedRoomId);
      if (!exists) {
        setSelectedRoomId(roomsForSelectedFloor[0].id);
      }
    } else if (selectedRoomId) {
      setSelectedRoomId('');
    }
  }, [selectedFloor, catalog]);

  // Day type calculation for single mode
  const dayInfo = getDayType(eventDate);

  // Handle time range change
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    const parsed = parseHoursBetween(start, end);
    if (parsed > 0) {
      setDurationHours(parsed);
      if (onUpdateTimeRange) {
        onUpdateTimeRange(`${start}-${end}`);
      }
    }
  };

  const handleQuickHours = (hrs: number) => {
    setDurationHours(hrs);
    setTimeMode('hours');
    // Estimate end time based on start
    const [sH, sM] = startTime.split(':').map(Number);
    if (!isNaN(sH)) {
      const endH = Math.min(23, sH + Math.floor(hrs));
      const endM = sM || 0;
      const formattedEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      setEndTime(formattedEnd);
      if (onUpdateTimeRange) {
        onUpdateTimeRange(`${startTime}-${formattedEnd}`);
      }
    }
  };

  const selectedRoom = roomItems.find((r) => r.id === selectedRoomId) || roomsForSelectedFloor[0];

  // Calculate rate result according to Day Type + Duration Category + Room rates
  const timeStr = timeMode === 'timerange' ? `${startTime}-${endTime}` : undefined;
  const effectiveTimeStr = timeMode === 'timerange'
    ? `${startTime} - ${endTime}`
    : durationHours === 4
      ? (startTime === '13:00' ? '13:00 - 17:00' : '08:00 - 12:00')
      : durationHours === 8
        ? '08:00 - 17:00'
        : `${startTime} - ${endTime}`;

  const calculation: UsageCalculationResult | null = selectedRoom
    ? calculateRoomRate(selectedRoom, durationHours, eventDate, timeStr)
    : null;

  // Compute final amounts
  const unitPrice = calculation ? calculation.ratePerUnit : 0;
  const quantity = calculation ? calculation.quantity : 1;
  const grossAmount = unitPrice * quantity;
  const discountRate = customerDiscountRate || 0;
  const netAmount = Math.max(0, Math.round(grossAmount * (1 - discountRate / 100)));

  // Instant Real-time Auto-Sync into Quotation Table (Single Room Mode)
  useEffect(() => {
    if (mode !== 'single' || !autoSyncEnabled || !calculation || !selectedRoom) return;

    // Prevent infinite loop by checking hash
    const syncHash = `${selectedRoom.id}_${eventDate}_${durationHours}_${effectiveTimeStr}_${calculation.category}_${unitPrice}_${discountRate}`;
    if (lastSyncHash.current === syncHash) return;
    lastSyncHash.current = syncHash;

    const autoItem: QuotationItem = {
      id: 'auto-room-item-1',
      description: calculation.formattedDescription,
      quantity: calculation.quantity,
      unit: calculation.unit,
      unitPrice: calculation.ratePerUnit,
      discountPercent: discountRate,
      amount: netAmount,
      usageDate: eventDate,
      eventDate: eventDate,
      usageTime: effectiveTimeStr,
      eventTime: effectiveTimeStr,
      roomName: selectedRoom.name,
      jobTitle: roomJobTitle.trim() || undefined,
    };

    onInstantUpdateRoomItem(autoItem);
  }, [
    mode,
    autoSyncEnabled,
    selectedRoom?.id,
    eventDate,
    durationHours,
    effectiveTimeStr,
    unitPrice,
    discountRate,
    calculation?.formattedDescription,
    roomJobTitle,
  ]);

  // Handler to add the single room as a brand-new item
  const handleAddSingleRoomAsNewItem = () => {
    if (!calculation || !selectedRoom) return;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: calculation.formattedDescription,
      quantity: calculation.quantity,
      unit: calculation.unit,
      unitPrice: calculation.ratePerUnit,
      discountPercent: discountRate,
      amount: netAmount,
      usageDate: eventDate,
      eventDate: eventDate,
      usageTime: effectiveTimeStr,
      eventTime: effectiveTimeStr,
      roomName: selectedRoom.name,
      jobTitle: roomJobTitle.trim() || undefined,
    };

    if (onAddRoomItem) {
      onAddRoomItem(newItem);
    } else {
      onInstantUpdateRoomItem(newItem);
    }

    setAddedSuccessToast(`เพิ่มห้อง "${selectedRoom.name}" วันที่ ${eventDate} (เวลา ${effectiveTimeStr}) ลงในตารางแล้ว`);
    setTimeout(() => setAddedSuccessToast(null), 3500);
  };

  // Multi-date management
  const addNextDay = () => {
    const lastDate = multiDates[multiDates.length - 1] || eventDate || new Date().toISOString().split('T')[0];
    try {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      const nextDateStr = d.toISOString().split('T')[0];
      if (!multiDates.includes(nextDateStr)) {
        setMultiDates([...multiDates, nextDateStr]);
      }
    } catch (e) {
      setMultiDates([...multiDates, lastDate]);
    }
  };

  const addCustomDate = (dStr: string) => {
    if (!dStr) return;
    if (!multiDates.includes(dStr)) {
      setMultiDates([...multiDates, dStr].sort());
    }
    setNewDateInput('');
  };

  const removeDate = (dateToRemove: string) => {
    if (multiDates.length <= 1) return;
    setMultiDates(multiDates.filter((d) => d !== dateToRemove));
  };

  const addConsecutiveDays = (count: number) => {
    const startDate = multiDates[0] || eventDate || new Date().toISOString().split('T')[0];
    const newDates: string[] = [];
    const base = new Date(startDate);
    for (let i = 0; i < count; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      newDates.push(cur.toISOString().split('T')[0]);
    }
    setMultiDates(newDates);
  };

  // Multi-room toggle
  const toggleRoomSelection = (roomId: string) => {
    setMultiSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const selectAllRoomsInFloor = () => {
    const floorRoomIds = roomsForMultiFloor.map((r) => r.id);
    setMultiSelectedRoomIds((prev) => {
      const union = new Set([...prev, ...floorRoomIds]);
      return Array.from(union);
    });
  };

  const clearSelectedRooms = () => {
    setMultiSelectedRoomIds([]);
  };

  // Generate multi-room and multi-day preview items
  const generatedMultiItems: QuotationItem[] = [];
  let multiGrossTotal = 0;
  let multiNetTotal = 0;

  for (const date of multiDates) {
    const rawTime = multiDateTimes[date] || (durationHours === 4 ? '08:00 - 12:00' : durationHours === 8 ? '08:00 - 17:00' : effectiveTimeStr);
    const parsedH = parseTimeRangeStringToHours(rawTime);
    const dayHours = multiDateHours[date] || (parsedH > 0 ? parsedH : durationHours);
    const dayTime = rawTime;

    for (const rId of multiSelectedRoomIds) {
      const r = roomItems.find((item) => item.id === rId);
      if (!r) continue;
      const calc = calculateRoomRate(r, dayHours, date, dayTime);
      const itemGross = calc.totalRate;
      const itemNet = Math.max(0, Math.round(itemGross * (1 - discountRate / 100)));

      multiGrossTotal += itemGross;
      multiNetTotal += itemNet;

      generatedMultiItems.push({
        id: `item-${r.id}-${date}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: calc.formattedDescription,
        quantity: calc.quantity,
        unit: calc.unit,
        unitPrice: calc.ratePerUnit,
        discountPercent: discountRate,
        amount: itemNet,
        usageDate: date,
        eventDate: date,
        usageTime: dayTime,
        eventTime: dayTime,
        roomName: r.name,
        jobTitle: roomJobTitle.trim() || undefined,
      });
    }
  }

  // Handle batch add multi items
  const handleAddAllMultiItems = () => {
    if (generatedMultiItems.length === 0) return;
    if (onAddMultipleRoomItems) {
      onAddMultipleRoomItems(generatedMultiItems);
    } else if (onAddRoomItem) {
      generatedMultiItems.forEach((it) => onAddRoomItem(it));
    }
    setAddedSuccessToast(
      `เพิ่มห้องและวันที่ใช้งานทั้งหมด ${generatedMultiItems.length} รายการลงในตารางเรียบร้อยแล้ว`
    );
    setTimeout(() => setAddedSuccessToast(null), 4000);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Banner: Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight">
                ระบบคำนวณและเลือกห้องใช้งาน (Room & Event Date Calculator)
              </h4>
              <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Real-time
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              เลือก <strong>วันจัดงาน + ห้อง + ชั่วโมง</strong> รองรับทั้งการคำนวณห้องเดี่ยว และการเลือกใช้งาน <strong>หลายวันหลายห้อง</strong> พร้อมกัน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center p-1 bg-amber-100/70 rounded-xl border border-amber-300 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'single'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ห้องเดียว (Single)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('multi');
                if (multiSelectedRoomIds.length === 0 && selectedRoom) {
                  setMultiSelectedRoomIds([selectedRoom.id]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'multi'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>หลายวันหลายห้อง (Multi-Room & Days)</span>
              {multiSelectedRoomIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-amber-800 text-[10px] flex items-center justify-center font-bold">
                  {multiSelectedRoomIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Admin Catalog Button */}
          <button
            type="button"
            onClick={onOpenCatalogAdmin}
            className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="จัดการรายชื่อห้อง ชั้น และอัตราค่าเช่าวันธรรมดา / วันเสาร์-อาทิตย์"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">จัดการฐานข้อมูลห้อง</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {addedSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{addedSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAddedSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 1: SINGLE ROOM MODE                                     */}
      {/* ============================================================ */}
      {mode === 'single' && (
        <div className="space-y-4">
          {/* Inputs Bar: Event Date (Day Detection), Floor, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs">
            {/* 1. วันที่ใช้งาน (Event Date) with Day Type Detection */}
            <div className="lg:col-span-4 space-y-1">
              <label className="block text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>1. วันที่ใช้งาน (Event Date)</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => onEventDateChange && onEventDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg font-mono text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {/* Day Type Badge */}
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    dayInfo.isWeekend
                      ? 'bg-orange-100 text-orange-900 border-orange-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  <span>{dayInfo.isWeekend ? '🌴' : '🏢'}</span>
                  <span>{dayInfo.label}</span>
                  <span className="font-normal opacity-75">({dayInfo.dayName})</span>
                </span>
              </div>
            </div>

            {/* 2. ชั้น (Floor) Quick Switch */}
            <div className="lg:col-span-4 space-y-1">
              <label className="block text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>2. ชั้น (Floor)</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {floors.map((floor) => {
                  const count = roomItems.filter((r) => r.floor === floor).length;
                  return (
                    <button
                      type="button"
                      key={floor}
                      onClick={() => setSelectedFloor(floor)}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                        selectedFloor === floor
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {floor} <span className="text-[10px] font-normal opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. จำนวนชั่วโมงใช้งาน (Hours) */}
            <div className="lg:col-span-4 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. จำนวนชั่วโมง (Hours)</span>
                </label>
                <div className="flex items-center bg-neutral-100 p-0.5 rounded text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setTimeMode('hours')}
                    className={`px-1.5 py-0.5 rounded ${timeMode === 'hours' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                  >
                    ระบุ ชม.
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('timerange')}
                    className={`px-1.5 py-0.5 rounded ${timeMode === 'timerange' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500'}`}
                  >
                    เวลาเริ่ม-เลิก
                  </button>
                </div>
              </div>

              {timeMode === 'hours' ? (
                <div className="flex items-center gap-1.5">
                  {[4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleQuickHours(h)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        durationHours === h
                          ? h === 4
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {h} ชม. {h === 4 ? '(ครึ่งวัน)' : '(เต็มวัน)'}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 px-1.5 py-1 border border-neutral-300 rounded text-center font-bold text-xs"
                    />
                    <span className="text-xs text-neutral-600">ชม.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange(e.target.value, endTime)}
                    className="px-1.5 py-1 border border-neutral-300 rounded font-mono text-xs"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleTimeChange(startTime, e.target.value)}
                    className="px-1.5 py-1 border border-neutral-300 rounded font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* 3.1 ชื่องานสำหรับห้องนี้ (Job Title per Room) */}
            <div className="lg:col-span-12 pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5 shrink-0">
                <span className="text-base">🏷️</span>
                <span>ชื่องานสำหรับห้องนี้ (Job Title):</span>
              </label>
              <input
                type="text"
                value={roomJobTitle}
                onChange={(e) => setRoomJobTitle(e.target.value)}
                placeholder="ระบุชื่องานสำหรับห้องนี้ (เช่น สัมมนา AI for Business, อบรมบุคลากร...)"
                className="flex-1 min-w-[240px] px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 bg-amber-50/20 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {roomJobTitle && (
                <button
                  type="button"
                  onClick={() => setRoomJobTitle('')}
                  className="text-neutral-400 hover:text-neutral-700 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                  title="ล้างข้อความชื่องาน"
                >
                  ✕ ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Room Selection Cards for the selected Floor */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>4. เลือกห้อง (Room) ใน {selectedFloor}</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">
                อัตราค่าเช่าจะสลับระหว่าง <span className="font-semibold text-emerald-800">วันธรรมดา</span> และ <span className="font-semibold text-orange-800">วันเสาร์-อาทิตย์</span> อัตโนมัติ
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {roomsForSelectedFloor.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                const fullPrice = dayInfo.isWeekend
                  ? room.fullDayWeekendPrice || Math.round((room.fullDayPrice || room.unitPrice) * 1.2)
                  : room.fullDayPrice || room.unitPrice;
                const halfPrice = dayInfo.isWeekend
                  ? room.halfDayWeekendPrice || Math.round((room.halfDayPrice || Math.round(room.unitPrice * 0.6)) * 1.2)
                  : room.halfDayPrice || Math.round(room.unitPrice * 0.6);
                const hourPrice = dayInfo.isWeekend
                  ? room.hourlyWeekendPrice || Math.round((room.hourlyPrice || Math.round((room.fullDayPrice || room.unitPrice) / 8)) * 1.2)
                  : room.hourlyPrice || Math.round((room.fullDayPrice || room.unitPrice) / 8);

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-amber-300 hover:bg-neutral-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-neutral-900 line-clamp-1">
                          {room.name}
                        </span>
                        {room.sizeSqM && (
                          <span className="text-[10px] text-neutral-500 font-medium px-1 rounded bg-neutral-100">
                            {room.sizeSqM} ตร.ม.
                          </span>
                        )}
                        {room.hasNaturalLight !== undefined && (
                          <span
                            className={`text-[9px] font-medium px-1 py-0.2 rounded border ${
                              room.hasNaturalLight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                            }`}
                            title={room.hasNaturalLight ? 'มีแสงธรรมชาติ (Natural Light)' : 'ไม่มีแสงธรรมชาติ'}
                          >
                            {room.hasNaturalLight ? '☀️ แสงธรรมชาติ' : '💡 แสงประดิษฐ์'}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded shrink-0">
                          ✓ เลือกอยู่
                        </span>
                      )}
                    </div>

                    {room.capacity && (
                      <p className="text-[11px] text-neutral-500 mb-1.5 line-clamp-1">
                        ความจุ: {room.capacity}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        เต็มวัน: ฿{formatCurrency(fullPrice)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                        ครึ่งวัน: ฿{formatCurrency(halfPrice)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                        ราย ชม.: {hourPrice > 0 ? `฿${formatCurrency(hourPrice)}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Calculation Result Summary Card with Action Buttons */}
          {calculation && (
            <div className={`p-4 rounded-xl border ${calculation.badgeColor} space-y-3 shadow-2xs`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>สรุปผลการคำนวณ: {calculation.categoryName}</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current/30">
                    {dayInfo.label} ({eventDate})
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs opacity-75">อัตรา:</span>
                  <span className="font-black text-base">
                    ฿{formatCurrency(unitPrice)} <span className="text-xs font-normal font-sans">/{calculation.unit}</span>
                  </span>
                </div>
              </div>

              <div className="text-xs text-neutral-800 bg-white/80 p-3 rounded-lg border border-current/20 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-neutral-900 text-sm">
                    {calculation.formattedDescription}
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    {calculation.ruleExplanation} • วันที่ใช้งาน: <strong className="text-neutral-900">{eventDate}</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-neutral-500">ราคารวม ({calculation.quantity} {calculation.unit})</div>
                  <div className="text-base font-black font-mono text-neutral-900">
                    ฿{formatCurrency(grossAmount)}
                  </div>
                  {discountRate > 0 && (
                    <div className="text-[11px] font-bold text-amber-800">
                      ส่วนลด {discountRate}%: -฿{formatCurrency(grossAmount - netAmount)} (สุทธิ ฿{formatCurrency(netAmount)})
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Single Mode */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-current/20">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 border border-amber-300 rounded-lg text-xs font-semibold text-neutral-700 cursor-pointer shadow-2xs select-none hover:bg-white">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">ซิงค์อัปเดตห้องหลักอัตโนมัติ</span>
                  </label>
                  {autoSyncEnabled && (
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> เชื่อมต่อกับตารางแล้ว
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddSingleRoomAsNewItem}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="คลิกเพื่อเพิ่มห้องนี้เป็นรายการใหม่ในตารางใบเสนอราคา โดยไม่เขียนทับรายการเดิม"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>+ เพิ่มห้องนี้เป็นรายการใหม่ในตาราง</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 2: MULTI-ROOM & MULTI-DAY BATCH MODE                    */}
      {/* ============================================================ */}
      {mode === 'multi' && (
        <div className="space-y-4">
          <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-300 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗓️</span>
              <div>
                <strong className="block font-bold">โหมดเลือกใช้งานหลายวันและหลายห้องพร้อมกัน</strong>
                <span className="text-[11px] text-amber-800">
                  เลือกวันจัดงานหลายวัน และเลือกห้องประชุมที่ต้องการ ระบบจะคำนวณประเภทวัน (วันธรรมดา / เสาร์-อาทิตย์) และสร้างรายการเข้าตารางให้อัตโนมัติ
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-neutral-800">
                เลือกแล้ว: {multiDates.length} วัน × {multiSelectedRoomIds.length} ห้อง
              </span>
              <span className="block text-[11px] text-amber-800 font-semibold font-mono">
                = รวม {generatedMultiItems.length} รายการ
              </span>
            </div>
          </div>

          {/* ชื่องานสำหรับห้องและวันที่จัดงาน (Job Title per Room/Event) */}
          <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 shrink-0">
              <span className="text-base">🏷️</span>
              <span>ชื่องานสำหรับห้องที่เลือก (Job Title):</span>
            </label>
            <input
              type="text"
              value={roomJobTitle}
              onChange={(e) => setRoomJobTitle(e.target.value)}
              placeholder="ระบุชื่องานสำหรับห้องเหล่านี้ (เช่น สัมมนาผู้บริหาร, อบรมวิชาการ...)"
              className="flex-1 min-w-[240px] px-2.5 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 bg-amber-50/20 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {roomJobTitle && (
              <button
                type="button"
                onClick={() => setRoomJobTitle('')}
                className="text-neutral-400 hover:text-neutral-700 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                title="ล้างข้อความชื่องาน"
              >
                ✕ ล้าง
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column (5 cols): 1. เลือกวันที่ใช้งานหลายวัน (Multi Dates) */}
            <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>1. วันที่ใช้งาน ({multiDates.length} วัน)</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={addNextDay}
                    className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[10.5px] font-bold transition-colors cursor-pointer"
                    title="เพิ่มวันถัดไปทันที"
                  >
                    + วันถัดไป
                  </button>
                </div>
              </div>

              {/* Quick consecutive days buttons */}
              <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                <span>เลือกช่วงวันด่วน:</span>
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => addConsecutiveDays(cnt)}
                    className="px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium"
                  >
                    {cnt} วันติดกัน
                  </button>
                ))}
              </div>

              {/* Dates list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {multiDates.map((dateStr, idx) => {
                  const dType = getDayType(dateStr);
                  const currentTime = multiDateTimes[dateStr] || (durationHours === 4 ? '08:00 - 12:00' : durationHours === 8 ? '08:00 - 17:00' : '08:00 - 17:00');
                  const isPresetTime = ['08:00 - 12:00', '13:00 - 17:00', '08:00 - 17:00'].includes(currentTime);

                  return (
                    <div
                      key={dateStr}
                      className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/80 text-xs text-neutral-900 space-y-1.5 shadow-2xs hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-neutral-400 w-5 text-[11px]">#{idx + 1}</span>
                          <span className="font-mono font-bold text-neutral-900 text-xs">{dateStr}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              dType.isWeekend
                                ? 'bg-orange-100 text-orange-900 border-orange-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {dType.isWeekend ? '🌴 เสาร์-อาทิตย์' : '🏢 วันธรรมดา'} ({dType.dayName})
                          </span>
                        </div>

                        {multiDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDate(dateStr)}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                            title="ลบวันนี้ออก"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Time selector for this specific day */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white p-1.5 rounded-md border border-neutral-200/90">
                        <div className="flex items-center gap-1 text-[10.5px] font-bold text-neutral-700 shrink-0">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>เวลาใช้งาน:</span>
                        </div>

                        <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                          <select
                            value={isPresetTime ? currentTime : 'custom'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setMultiDateTimes((prev) => ({ ...prev, [dateStr]: '12:00 - 18:00' }));
                                setMultiDateHours((prev) => ({ ...prev, [dateStr]: 6 }));
                              } else {
                                setMultiDateTimes((prev) => ({ ...prev, [dateStr]: val }));
                                if (val === '08:00 - 12:00' || val === '13:00 - 17:00') {
                                  setMultiDateHours((prev) => ({ ...prev, [dateStr]: 4 }));
                                } else if (val === '08:00 - 17:00') {
                                  setMultiDateHours((prev) => ({ ...prev, [dateStr]: 8 }));
                                }
                              }
                            }}
                            className="flex-1 bg-neutral-50 border border-neutral-300 rounded px-1.5 py-0.5 text-[11px] font-medium text-neutral-900 cursor-pointer focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          >
                            <option value="08:00 - 12:00">🕒 ครึ่งวันเช้า (08:00 - 12:00 / 4 ชม.)</option>
                            <option value="13:00 - 17:00">🕒 ครึ่งวันบ่าย (13:00 - 17:00 / 4 ชม.)</option>
                            <option value="08:00 - 17:00">☀️ เต็มวัน (08:00 - 17:00 / 8 ชม.)</option>
                            <option value="custom">✏️ พิมพ์เวลาเอง (เช่น 12.00 - 18.00)</option>
                          </select>

                          {/* Custom Time Input if chosen */}
                          {!isPresetTime && (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={currentTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMultiDateTimes((prev) => ({ ...prev, [dateStr]: val }));
                                  const parsedH = parseTimeRangeStringToHours(val);
                                  if (parsedH > 0) {
                                    setMultiDateHours((prev) => ({ ...prev, [dateStr]: parsedH }));
                                  }
                                }}
                                placeholder="เช่น 12.00 - 18.00"
                                className="w-28 px-1.5 py-0.5 border border-amber-400 bg-amber-50/50 rounded text-[11px] font-mono font-bold text-neutral-900 focus:outline-none"
                              />
                              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1 py-0.5 rounded whitespace-nowrap">
                                {multiDateHours[dateStr] || parseTimeRangeStringToHours(currentTime) || 4} ชม.
                              </span>
                            </div>
                          )}

                          {/* Apply to all days button */}
                          {multiDates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newMap: Record<string, string> = {};
                                const newHrsMap: Record<string, number> = {};
                                const parsedH = parseTimeRangeStringToHours(currentTime);
                                const hrs = multiDateHours[dateStr] || (parsedH > 0 ? parsedH : (currentTime.includes('08:00 - 17:00') ? 8 : 4));
                                multiDates.forEach((d) => {
                                  newMap[d] = currentTime;
                                  newHrsMap[d] = hrs;
                                });
                                setMultiDateTimes(newMap);
                                setMultiDateHours(newHrsMap);
                              }}
                              className="px-1.5 py-0.5 text-[9.5px] bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-900 rounded border border-neutral-300 hover:border-amber-400 font-medium whitespace-nowrap transition-colors cursor-pointer"
                              title="นำเวลาของวันนี้ไปตั้งให้ทุกวันในรายการทันที"
                            >
                              ใช้กับทุกวัน
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add custom date */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100">
                <input
                  type="date"
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 border border-neutral-300 rounded text-xs font-mono"
                  placeholder="เลือกวันที่เพื่อเพิ่ม"
                />
                <button
                  type="button"
                  onClick={() => addCustomDate(newDateInput)}
                  disabled={!newDateInput}
                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded text-xs font-bold"
                >
                  + เพิ่มวันที่
                </button>
              </div>

              {/* Duration selector for all days */}
              <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>ระยะเวลาใช้งานต่อวัน</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleQuickHours(h)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                        durationHours === h
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {h} ชม. {h === 4 ? '(ครึ่งวัน)' : '(เต็มวัน)'}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value) || 1))}
                      className="w-12 px-1 py-1 border border-neutral-300 rounded text-center text-xs font-bold"
                    />
                    <span className="text-[11px] text-neutral-500">ชม.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): 2. เลือกห้องที่ต้องการใช้งาน (Multi Room Selection) */}
            <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>2. เลือกห้องประชุม (เลือกแล้ว {multiSelectedRoomIds.length} ห้อง)</span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllRoomsInFloor}
                    className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold"
                  >
                    ✓ เลือกทุกห้องใน {multiFloor}
                  </button>
                  {multiSelectedRoomIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelectedRooms}
                      className="px-2 py-0.5 rounded text-neutral-500 hover:text-rose-600 font-medium"
                    >
                      ล้างการเลือก
                    </button>
                  )}
                </div>
              </div>

              {/* Floor Switcher */}
              <div className="flex flex-wrap gap-1">
                {floors.map((floor) => {
                  const count = roomItems.filter((r) => r.floor === floor).length;
                  const selectedInFloor = roomItems.filter(
                    (r) => r.floor === floor && multiSelectedRoomIds.includes(r.id)
                  ).length;
                  return (
                    <button
                      type="button"
                      key={floor}
                      onClick={() => setMultiFloor(floor)}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                        multiFloor === floor
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      <span>{floor}</span>
                      {selectedInFloor > 0 ? (
                        <span className="w-4 h-4 rounded-full bg-white text-amber-800 text-[10px] flex items-center justify-center font-bold">
                          {selectedInFloor}
                        </span>
                      ) : (
                        <span className="text-[10px] font-normal opacity-70">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Room Checkbox Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {roomsForMultiFloor.map((room) => {
                  const isChecked = multiSelectedRoomIds.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => toggleRoomSelection(room.id)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-amber-50/90 border-amber-500 shadow-2xs'
                          : 'bg-white border-neutral-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0 text-amber-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 fill-amber-100" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-neutral-900 truncate">
                            {room.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-neutral-700 shrink-0">
                            ฿{formatCurrency(room.unitPrice)}
                          </span>
                        </div>
                        {room.capacity && (
                          <div className="text-[10.5px] text-neutral-500 truncate mt-0.5">
                            {room.capacity}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-neutral-400">
                          <span>{room.floor}</span>
                          {room.sizeSqM && <span>• {room.sizeSqM} ตร.ม.</span>}
                          {room.hasNaturalLight && <span className="text-emerald-700">• แสงธรรมชาติ</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 4: Summary of Items to be Created & Batch Add Button */}
          {generatedMultiItems.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-orange-100/20 border-2 border-amber-400 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>
                      พร้อมสร้าง {generatedMultiItems.length} รายการ (จาก {multiDates.length} วัน × {multiSelectedRoomIds.length} ห้อง)
                    </span>
                  </h5>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    แต่ละรายการจะมีข้อมูล <strong>ชื่อห้อง, วันที่ใช้งาน, และราคา (ตามวันธรรมดา/วันหยุด)</strong> กำกับไว้อย่างแม่นยำ
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10.5px] text-neutral-500">ราคาสุทธิรวมทั้งหมด:</div>
                  <div className="text-lg font-black font-mono text-neutral-900">
                    ฿{formatCurrency(multiNetTotal)} <span className="text-xs font-normal">บาท</span>
                  </div>
                  {discountRate > 0 && (
                    <div className="text-[11px] font-bold text-amber-800">
                      ใช้ส่วนลด {discountRate}% (ประหยัด ฿{formatCurrency(multiGrossTotal - multiNetTotal)})
                    </div>
                  )}
                </div>
              </div>

              {/* Preview items sample list */}
              <div className="bg-white/90 p-2.5 rounded-lg border border-amber-300 max-h-36 overflow-y-auto divide-y divide-neutral-100 text-xs">
                {generatedMultiItems.map((item, idx) => (
                  <div key={item.id} className="py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-neutral-400 text-[10px]">#{idx + 1}</span>
                      <span className="font-medium text-neutral-900 truncate">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-[10px] text-neutral-500">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="font-bold text-neutral-900">
                        ฿{formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Big Batch Add Button */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddAllMultiItems}
                  className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>+ เพิ่มทั้ง {generatedMultiItems.length} รายการลงในตารางใบเสนอราคา</span>
                </button>
              </div>
            </div>
          )}

          {generatedMultiItems.length === 0 && (
            <div className="p-6 bg-white border border-neutral-200 rounded-xl text-center text-xs text-neutral-500">
              <p className="font-semibold text-neutral-700">กรุณาเลือกอย่างน้อย 1 ห้อง และ 1 วันที่ใช้งาน เพื่อสร้างรายการ</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                ติ๊กเลือกห้องจากรายการด้านขวา และเพิ่มวันที่จัดงานจากรายการด้านซ้าย
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
