import React, { useState } from 'react';
import { QuotationItem } from '../types';
import { formatCurrency } from '../utils/thaiBahtText';
import { Coffee, Utensils, Package, Clock, Plus, Check, Calendar, Sparkles, X, Users, Tag } from 'lucide-react';

interface FoodCateringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: QuotationItem[]) => void;
  eventDate?: string;
  defaultGuestCount?: number;
  discountRate?: number;
}

export const FoodCateringModal: React.FC<FoodCateringModalProps> = ({
  isOpen,
  onClose,
  onAddItems,
  eventDate = '',
  defaultGuestCount = 30,
  discountRate = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'snack' | 'meal'>('snack');

  // --- 1. ค่าอาหารว่าง (Coffee Break / Snack Box) State ---
  // 1.1 รูปแบบ: แบบเบรค (จัดเสิร์ฟ) หรือ Snack Box (กล่อง)
  const [snackFormat, setSnackFormat] = useState<'break' | 'snack_box'>('break');
  // 1.2 จำนวนเบรค: 1, 2, 3
  const [breakCount, setBreakCount] = useState<number>(1);
  // 1.3 ช่วงเวลาเบรค: เช้า, บ่าย, เย็น, เช้า+บ่าย, เช้า+บ่าย+เย็น
  const [breakTiming, setBreakTiming] = useState<'morning' | 'afternoon' | 'evening' | 'morning_afternoon' | 'all'>('morning');
  const [snackQuantity, setSnackQuantity] = useState<number>(defaultGuestCount || 30);
  const [snackPricePerUnit, setSnackPricePerUnit] = useState<number>(snackFormat === 'break' ? 85 : 75);
  const [snackCustomTime, setSnackCustomTime] = useState<string>('10:00 - 10:30');
  const [snackDate, setSnackDate] = useState<string>(eventDate || '');
  const [snackNote, setSnackNote] = useState<string>('');

  // --- 2. อาหารกลาง / อาหารมื้อหลัก State ---
  // 2.1 รูปแบบอาหาร: กล่อง, บุฟเฟ่ต์, ค็อกเทล
  const [mealFormat, setMealFormat] = useState<'box' | 'buffet' | 'cocktail'>('buffet');
  // 2.2 ช่วงเวลา: เช้า, กลางวัน, เย็น
  const [mealTiming, setMealTiming] = useState<'morning' | 'lunch' | 'dinner'>('lunch');
  const [mealQuantity, setMealQuantity] = useState<number>(defaultGuestCount || 30);
  const [mealPricePerUnit, setMealPricePerUnit] = useState<number>(250);
  const [mealCustomTime, setMealCustomTime] = useState<string>('12:00 - 13:00');
  const [mealDate, setMealDate] = useState<string>(eventDate || '');
  const [mealNote, setMealNote] = useState<string>('');

  if (!isOpen) return null;

  // Auto-adjust default times & price presets based on selections
  const handleSnackFormatChange = (format: 'break' | 'snack_box') => {
    setSnackFormat(format);
    if (format === 'break') {
      setSnackPricePerUnit(breakCount === 2 ? 160 : breakCount === 3 ? 240 : 85);
    } else {
      setSnackPricePerUnit(breakCount === 2 ? 140 : breakCount === 3 ? 210 : 75);
    }
  };

  const handleBreakCountChange = (count: number) => {
    setBreakCount(count);
    if (count === 1) {
      if (breakTiming === 'morning_afternoon' || breakTiming === 'all') {
        setBreakTiming('morning');
        setSnackCustomTime('10:00 - 10:30');
      }
      setSnackPricePerUnit(snackFormat === 'break' ? 85 : 75);
    } else if (count === 2) {
      setBreakTiming('morning_afternoon');
      setSnackCustomTime('10:00 - 10:30, 14:30 - 15:00');
      setSnackPricePerUnit(snackFormat === 'break' ? 160 : 140);
    } else if (count === 3) {
      setBreakTiming('all');
      setSnackCustomTime('10:00 - 10:30, 14:30 - 15:00, 16:30 - 17:00');
      setSnackPricePerUnit(snackFormat === 'break' ? 240 : 210);
    }
  };

  const handleBreakTimingChange = (timing: 'morning' | 'afternoon' | 'evening' | 'morning_afternoon' | 'all') => {
    setBreakTiming(timing);
    if (timing === 'morning') {
      setSnackCustomTime('10:00 - 10:30');
      if (breakCount > 1) setBreakCount(1);
    } else if (timing === 'afternoon') {
      setSnackCustomTime('14:30 - 15:00');
      if (breakCount > 1) setBreakCount(1);
    } else if (timing === 'evening') {
      setSnackCustomTime('16:30 - 17:00');
      if (breakCount > 1) setBreakCount(1);
    } else if (timing === 'morning_afternoon') {
      setSnackCustomTime('10:00 - 10:30, 14:30 - 15:00');
      setBreakCount(2);
      setSnackPricePerUnit(snackFormat === 'break' ? 160 : 140);
    } else if (timing === 'all') {
      setSnackCustomTime('10:00 - 10:30, 14:30 - 15:00, 16:30 - 17:00');
      setBreakCount(3);
      setSnackPricePerUnit(snackFormat === 'break' ? 240 : 210);
    }
  };

  const handleMealFormatChange = (format: 'box' | 'buffet' | 'cocktail') => {
    setMealFormat(format);
    if (format === 'box') {
      setMealPricePerUnit(120);
    } else if (format === 'buffet') {
      setMealPricePerUnit(280);
    } else if (format === 'cocktail') {
      setMealPricePerUnit(350);
    }
  };

  const handleMealTimingChange = (timing: 'morning' | 'lunch' | 'dinner') => {
    setMealTiming(timing);
    if (timing === 'morning') {
      setMealCustomTime('07:30 - 08:30');
    } else if (timing === 'lunch') {
      setMealCustomTime('12:00 - 13:00');
    } else if (timing === 'dinner') {
      setMealCustomTime('18:00 - 19:30');
    }
  };

  // Build Description for Snack Item
  const getSnackDescription = (): string => {
    const typeLabel = snackFormat === 'break' ? 'ค่าอาหารว่าง (Coffee Break)' : 'ค่าอาหารว่าง (Snack Box)';
    
    let timingLabel = '';
    if (breakTiming === 'morning') timingLabel = 'เช้า';
    else if (breakTiming === 'afternoon') timingLabel = 'บ่าย';
    else if (breakTiming === 'evening') timingLabel = 'เย็น';
    else if (breakTiming === 'morning_afternoon') timingLabel = 'เช้า + บ่าย';
    else if (breakTiming === 'all') timingLabel = 'เช้า + บ่าย + เย็น';

    const countLabel = `${breakCount} เบรค`;
    let desc = `${typeLabel} ${countLabel} (${timingLabel})`;
    if (snackNote.trim()) {
      desc += ` • ${snackNote.trim()}`;
    }
    return desc;
  };

  // Build Description for Meal Item
  const getMealDescription = (): string => {
    let formatLabel = '';
    if (mealFormat === 'box') formatLabel = 'ค่าอาหารกล่อง (Meal Box)';
    else if (mealFormat === 'buffet') formatLabel = 'ค่าอาหารจัดเลี้ยง (บุฟเฟ่ต์ / Buffet)';
    else if (mealFormat === 'cocktail') formatLabel = 'ค่าอาหารจัดเลี้ยง (ค็อกเทล / Cocktail)';

    let timingLabel = '';
    if (mealTiming === 'morning') timingLabel = 'มื้อเช้า';
    else if (mealTiming === 'lunch') timingLabel = 'มื้อกลางวัน';
    else if (mealTiming === 'dinner') timingLabel = 'มื้อเย็น';

    let desc = `${formatLabel} ${timingLabel}`;
    if (mealNote.trim()) {
      desc += ` • ${mealNote.trim()}`;
    }
    return desc;
  };

  // Add Snack Item
  const handleAddSnackItem = () => {
    const qty = Math.max(1, Number(snackQuantity) || 1);
    const price = Math.max(0, Number(snackPricePerUnit) || 0);
    const disc = 0;
    const subtotal = qty * price;
    const finalAmount = Math.round(subtotal * 100) / 100;

    const unit = snackFormat === 'break' ? 'ท่าน' : 'กล่อง';

    const newItem: QuotationItem = {
      id: `food-snack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: getSnackDescription(),
      quantity: qty,
      unit,
      unitPrice: price,
      discountPercent: disc,
      amount: finalAmount,
      usageDate: snackDate || eventDate || '',
      eventDate: snackDate || eventDate || '',
      usageTime: '',
      eventTime: '',
    };

    onAddItems([newItem]);
    onClose();
  };

  // Add Meal Item
  const handleAddMealItem = () => {
    const qty = Math.max(1, Number(mealQuantity) || 1);
    const price = Math.max(0, Number(mealPricePerUnit) || 0);
    const disc = 0;
    const subtotal = qty * price;
    const finalAmount = Math.round(subtotal * 100) / 100;

    const unit = mealFormat === 'box' ? 'กล่อง' : 'ท่าน';

    const newItem: QuotationItem = {
      id: `food-meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: getMealDescription(),
      quantity: qty,
      unit,
      unitPrice: price,
      discountPercent: disc,
      amount: finalAmount,
      usageDate: mealDate || eventDate || '',
      eventDate: mealDate || eventDate || '',
      usageTime: '',
      eventTime: '',
    };

    onAddItems([newItem]);
    onClose();
  };

  // Add Both Snack + Meal
  const handleAddBoth = () => {
    // Snack
    const sQty = Math.max(1, Number(snackQuantity) || 1);
    const sPrice = Math.max(0, Number(snackPricePerUnit) || 0);
    const disc = 0;
    const sSubtotal = sQty * sPrice;
    const sFinal = Math.round(sSubtotal * 100) / 100;

    const snackItem: QuotationItem = {
      id: `food-snack-${Date.now()}-1`,
      description: getSnackDescription(),
      quantity: sQty,
      unit: snackFormat === 'break' ? 'ท่าน' : 'กล่อง',
      unitPrice: sPrice,
      discountPercent: disc,
      amount: sFinal,
      usageDate: snackDate || eventDate || '',
      eventDate: snackDate || eventDate || '',
      usageTime: '',
      eventTime: '',
    };

    // Meal
    const mQty = Math.max(1, Number(mealQuantity) || 1);
    const mPrice = Math.max(0, Number(mealPricePerUnit) || 0);
    const mSubtotal = mQty * mPrice;
    const mFinal = Math.round(mSubtotal * 100) / 100;

    const mealItem: QuotationItem = {
      id: `food-meal-${Date.now()}-2`,
      description: getMealDescription(),
      quantity: mQty,
      unit: mealFormat === 'box' ? 'กล่อง' : 'ท่าน',
      unitPrice: mPrice,
      discountPercent: disc,
      amount: mFinal,
      usageDate: mealDate || eventDate || '',
      eventDate: mealDate || eventDate || '',
      usageTime: '',
      eventTime: '',
    };

    onAddItems([snackItem, mealItem]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
              🍱
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">เพิ่มข้อมูลอาหารและเครื่องดื่ม (F&B / Catering)</h2>
              <p className="text-xs text-amber-100">เลือกอาหารว่าง เบรค อาหารกลางวัน บุฟเฟ่ต์ และจัดเลี้ยงครบวงจร</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('snack')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'snack'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>1. ค่าอาหารว่าง (Coffee Break / Snack Box)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meal')}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'meal'
                ? 'border-amber-600 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Utensils className="w-4 h-4 text-orange-600" />
            <span>2. อาหารกลาง / อาหารมื้อหลัก (Box / Buffet / Cocktail)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'snack' ? (
            /* ======================================================== */
            /* TAB 1: ค่าอาหารว่าง (Coffee Break / Snack Box)           */
            /* ======================================================== */
            <div className="space-y-4">
              
              {/* 1.1 รูปแบบอาหารว่าง */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px]">1.1</span>
                  <span>เลือกรูปแบบอาหารว่าง (Snack Format):</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSnackFormatChange('break')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      snackFormat === 'break'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${snackFormat === 'break' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900">แบบเบรค (Coffee Break)</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">จัดมุมเสิร์ฟ ชา กาแฟ โอวัลติน ขนมเบเกอรี่</div>
                      <div className="text-[11px] font-semibold text-amber-700 mt-1">เริ่มต้น ~85 บ./ท่าน/เบรค</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSnackFormatChange('snack_box')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      snackFormat === 'snack_box'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${snackFormat === 'snack_box' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-neutral-900">Snack Box (ชุดกล่อง)</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">ขนมเบเกอรี่ พร้อมน้ำผลไม้/น้ำดื่ม บรรจุกล่องเดี่ยว</div>
                      <div className="text-[11px] font-semibold text-amber-700 mt-1">เริ่มต้น ~75 บ./กล่อง</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1.2 จำนวนเบรค */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px]">1.2</span>
                  <span>เลือกจำนวนเบรค (Break Count):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 1, label: '1 เบรค (One Break)', desc: 'เช้า หรือ บ่าย' },
                    { count: 2, label: '2 เบรค (Two Breaks)', desc: 'เช้า + บ่าย' },
                    { count: 3, label: '3 เบรค (Three Breaks)', desc: 'เช้า + บ่าย + เย็น' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.count}
                      onClick={() => handleBreakCountChange(item.count)}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        breakCount === item.count
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-500 shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1.3 ช่วงเวลาเบรค */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px]">1.3</span>
                  <span>เลือกช่วงเวลาเบรค (Timing):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'เบรคเช้า (10:00 - 10:30)' },
                    { id: 'afternoon', label: 'เบรคบ่าย (14:30 - 15:00)' },
                    { id: 'evening', label: 'เบรคเย็น (16:30 - 17:00)' },
                    { id: 'morning_afternoon', label: 'เช้า + บ่าย (2 รอบ)' },
                    { id: 'all', label: 'เช้า + บ่าย + เย็น (3 รอบ)' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => handleBreakTimingChange(t.id as any)}
                      className={`p-2 rounded-lg border text-xs text-center transition-all cursor-pointer ${
                        breakTiming === t.id
                          ? 'border-amber-500 bg-amber-100/70 text-amber-950 font-bold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* จำนวนคน / ราคา / เวลาใช้งาน */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    <span>จำนวน ({snackFormat === 'break' ? 'ท่าน' : 'กล่อง'}):</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={snackQuantity}
                    onChange={(e) => setSnackQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white font-mono font-bold text-neutral-900 focus:ring-1 focus:ring-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-500" />
                    <span>ราคา/{snackFormat === 'break' ? 'ท่าน' : 'กล่อง'} (บาท):</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={snackPricePerUnit}
                    onChange={(e) => setSnackPricePerUnit(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white font-mono font-bold text-right text-amber-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>เวลาเสิร์ฟ:</span>
                  </label>
                  <input
                    type="text"
                    value={snackCustomTime}
                    onChange={(e) => setSnackCustomTime(e.target.value)}
                    placeholder="เช่น 10:00 - 10:30"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* วันที่และหมายเหตุ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>วันที่ใช้งาน (Usage Date):</span>
                  </label>
                  <input
                    type="text"
                    value={snackDate}
                    onChange={(e) => setSnackDate(e.target.value)}
                    placeholder="เช่น 2026-10-15 หรือ 1-3 ตุลาคม 2569"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี):</label>
                  <input
                    type="text"
                    value={snackNote}
                    onChange={(e) => setSnackNote(e.target.value)}
                    placeholder="เช่น ขนมเบเกอรี่ 2 ชิ้น, เมนูฮาลาล/มังสวิรัติ"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">ตัวอย่างรายการที่จะเพิ่ม:</span>
                  <span className="font-bold font-mono text-amber-900 text-sm">
                    รวม ฿{formatCurrency((snackQuantity * snackPricePerUnit) * (1 - (discountRate || 0)/100))}
                  </span>
                </div>
                <div className="text-neutral-800 font-semibold">{getSnackDescription()}</div>
                <div className="text-[11px] text-neutral-600 flex gap-3">
                  <span>จำนวน: {snackQuantity} {snackFormat === 'break' ? 'ท่าน' : 'กล่อง'}</span>
                  <span>ราคา: ฿{formatCurrency(snackPricePerUnit)}/{snackFormat === 'break' ? 'ท่าน' : 'กล่อง'}</span>
                  <span>เวลา: {snackCustomTime}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: อาหารกลาง / อาหารมื้อหลัก (Box / Buffet / Cocktail) */
            /* ======================================================== */
            <div className="space-y-4">
              
              {/* 2.1 รูปแบบอาหารมื้อหลัก */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-[11px]">2.1</span>
                  <span>เลือกรูปแบบอาหาร (Meal Format):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleMealFormatChange('box')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      mealFormat === 'box'
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${mealFormat === 'box' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs text-neutral-900">อาหารกล่อง (Meal Box)</div>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">ข้าวกล่อง/เบนโตะ สะดวก รวดเร็ว</div>
                    <div className="text-[11px] font-semibold text-orange-700 mt-1">เริ่มต้น ~120 บ./กล่อง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMealFormatChange('buffet')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      mealFormat === 'buffet'
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${mealFormat === 'buffet' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs text-neutral-900">บุฟเฟ่ต์ (Buffet)</div>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">จัดเลี้ยงบุฟเฟ่ต์ อาหาร 4-6 อย่าง + ของหวาน</div>
                    <div className="text-[11px] font-semibold text-orange-700 mt-1">เริ่มต้น ~280 บ./ท่าน</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMealFormatChange('cocktail')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      mealFormat === 'cocktail'
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${mealFormat === 'cocktail' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs text-neutral-900">ค็อกเทล (Cocktail)</div>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-1">อาหารค็อกเทลคำเล็ก Finger Food งานเลี้ยงสังสรรค์</div>
                    <div className="text-[11px] font-semibold text-orange-700 mt-1">เริ่มต้น ~350 บ./ท่าน</div>
                  </button>
                </div>
              </div>

              {/* 2.2 ช่วงเวลามื้ออาหาร */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-[11px]">2.2</span>
                  <span>เลือกช่วงเวลามื้ออาหาร (Meal Timing):</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'มื้อเช้า (Breakfast)', time: '07:30 - 08:30' },
                    { id: 'lunch', label: 'มื้อกลางวัน (Lunch)', time: '12:00 - 13:00' },
                    { id: 'dinner', label: 'มื้อเย็น (Dinner)', time: '18:00 - 19:30' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => handleMealTimingChange(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        mealTiming === t.id
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold ring-1 ring-orange-500 shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{t.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* จำนวนคน / ราคา / เวลาใช้งาน */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-neutral-500" />
                    <span>จำนวน ({mealFormat === 'box' ? 'กล่อง' : 'ท่าน'}):</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mealQuantity}
                    onChange={(e) => setMealQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white font-mono font-bold text-neutral-900 focus:ring-1 focus:ring-orange-500 text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-500" />
                    <span>ราคา/{mealFormat === 'box' ? 'กล่อง' : 'ท่าน'} (บาท):</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={mealPricePerUnit}
                    onChange={(e) => setMealPricePerUnit(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white font-mono font-bold text-right text-orange-900 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>เวลาเสิร์ฟ:</span>
                  </label>
                  <input
                    type="text"
                    value={mealCustomTime}
                    onChange={(e) => setMealCustomTime(e.target.value)}
                    placeholder="เช่น 12:00 - 13:00"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* วันที่และหมายเหตุ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>วันที่ใช้งาน (Usage Date):</span>
                  </label>
                  <input
                    type="text"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    placeholder="เช่น 2026-10-15 หรือ 1-3 ตุลาคม 2569"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">หมายเหตุเมนูอาหาร (ถ้ามี):</label>
                  <input
                    type="text"
                    value={mealNote}
                    onChange={(e) => setMealNote(e.target.value)}
                    placeholder="เช่น เซ็ตอาหารไทย 4 อย่าง, มีมังสวิรัติ 5 ท่าน"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-3 bg-orange-50/80 border border-orange-300 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-900">ตัวอย่างรายการที่จะเพิ่ม:</span>
                  <span className="font-bold font-mono text-orange-900 text-sm">
                    รวม ฿{formatCurrency((mealQuantity * mealPricePerUnit) * (1 - (discountRate || 0)/100))}
                  </span>
                </div>
                <div className="text-neutral-800 font-semibold">{getMealDescription()}</div>
                <div className="text-[11px] text-neutral-600 flex gap-3">
                  <span>จำนวน: {mealQuantity} {mealFormat === 'box' ? 'กล่อง' : 'ท่าน'}</span>
                  <span>ราคา: ฿{formatCurrency(mealPricePerUnit)}/{mealFormat === 'box' ? 'กล่อง' : 'ท่าน'}</span>
                  <span>เวลา: {mealCustomTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddBoth}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="เพิ่มทั้งรายการอาหารว่างและอาหารมื้อหลักพร้อมกันในคลิกเดียว"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>+ เพิ่มทั้ง 2 รายการ (อาหารว่าง + อาหารกลางวัน)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={activeTab === 'snack' ? handleAddSnackItem : handleAddMealItem}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeTab === 'snack' ? '+ เพิ่มรายการอาหารว่าง' : '+ เพิ่มรายการอาหารกลาง/มื้อหลัก'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
