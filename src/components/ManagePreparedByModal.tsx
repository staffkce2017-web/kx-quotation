import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  Upload,
  RotateCcw,
  Check,
  UserCheck,
  Sparkles,
  Users,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  SignerPreset,
  DEFAULT_PRESET_PREPARED_BY,
  createTextSvgSignature,
} from './QuotationEditor';
import {
  processSignatureFile,
} from '../utils/signatureProcessor';

interface ManagePreparedByModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: SignerPreset[];
  onSavePresets: (newPresets: SignerPreset[]) => void;
  currentSelectedName: string;
  onSelectPerson: (preset: SignerPreset) => void;
}

export const ManagePreparedByModal: React.FC<ManagePreparedByModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePresets,
  currentSelectedName,
  onSelectPerson,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSigUrl, setEditSigUrl] = useState('');

  // Delete confirmation state (prevents window.confirm iframe sandbox blocking)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // New person form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('เจ้าหน้าที่ฝ่ายขายและการตลาด');
  const [newSigUrl, setNewSigUrl] = useState('');
  const [newSigMode, setNewSigMode] = useState<'auto' | 'upload'>('auto');

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadIndexRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Start editing a signer
  const handleStartEdit = (index: number) => {
    setPendingDeleteIndex(null);
    setEditingIndex(index);
    setEditName(presets[index].name);
    setEditRole(presets[index].role || '');
    setEditSigUrl(presets[index].signatureUrl);
  };

  // Save edited signer
  const handleSaveEdit = (index: number) => {
    if (!editName.trim()) {
      showNotification('กรุณากรอกชื่อผู้จัดทำ', 'error');
      return;
    }

    const updated = [...presets];
    const oldName = updated[index].name;
    const finalSig = editSigUrl || createTextSvgSignature(editName);

    updated[index] = {
      name: editName.trim(),
      role: editRole.trim(),
      signatureUrl: finalSig,
    };

    onSavePresets(updated);
    setEditingIndex(null);

    // If currently selected person was edited, update active selection
    if (currentSelectedName === oldName) {
      onSelectPerson(updated[index]);
    }

    showNotification(`อัปเดตข้อมูลของ "${editName}" เรียบร้อยแล้ว`);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // Request to delete a signer (initiates inline confirmation)
  const handleRequestDelete = (index: number) => {
    if (presets.length <= 1) {
      showNotification('ต้องมีรายชื่อผู้จัดทำอย่างน้อย 1 รายชื่อในระบบ ไม่สามารถลบได้', 'error');
      return;
    }
    setEditingIndex(null);
    setPendingDeleteIndex(index);
  };

  // Cancel delete request
  const handleCancelDelete = () => {
    setPendingDeleteIndex(null);
  };

  // Confirm and perform deletion
  const handleConfirmDelete = (index: number) => {
    if (presets.length <= 1) {
      showNotification('ต้องมีรายชื่อผู้จัดทำอย่างน้อย 1 รายชื่อในระบบ ไม่สามารถลบได้', 'error');
      setPendingDeleteIndex(null);
      return;
    }

    const target = presets[index];
    const updated = presets.filter((_, i) => i !== index);
    onSavePresets(updated);

    // If deleted person was the active selection, switch to the first remaining person
    if (currentSelectedName === target.name) {
      onSelectPerson(updated[0]);
    }

    setPendingDeleteIndex(null);
    showNotification(`ลบ "${target.name}" ออกจากรายชื่อผู้จัดทำเรียบร้อยแล้ว`, 'success');
  };

  // Re-generate auto blue SVG signature for existing item
  const handleRegenerateSignature = (index: number, nameText: string) => {
    const newSvg = createTextSvgSignature(nameText);
    const updated = [...presets];
    updated[index] = {
      ...updated[index],
      signatureUrl: newSvg,
    };
    onSavePresets(updated);
    if (currentSelectedName === updated[index].name) {
      onSelectPerson(updated[index]);
    }
    showNotification(`สร้างลายเซ็นหมึกน้ำเงินอัตโนมัติสำหรับ "${nameText}" เรียบร้อยแล้ว`);
  };

  // Handle uploading signature image for an item
  const handleUploadClick = (index: number) => {
    targetUploadIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = targetUploadIndexRef.current;
    if (!file || index === null || index === undefined) return;

    try {
      showNotification('กำลังประมวลผลลายเซ็น (ตัดพื้นหลังและแปลงเป็นหมึกน้ำเงิน)...');
      const processed = await processSignatureFile(file);
      const updated = [...presets];
      updated[index] = {
        ...updated[index],
        signatureUrl: processed,
      };
      onSavePresets(updated);
      if (currentSelectedName === updated[index].name) {
        onSelectPerson(updated[index]);
      }
      showNotification(`อัปเดตลายเซ็นของ "${updated[index].name}" เรียบร้อยแล้ว`);
    } catch (err) {
      console.warn('Error processing signature file:', err);
      showNotification('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      targetUploadIndexRef.current = null;
    }
  };

  // Handle new signer signature upload
  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showNotification('กำลังประมวลผลลายเซ็น...');
      const processed = await processSignatureFile(file);
      setNewSigUrl(processed);
      setNewSigMode('upload');
      showNotification('อัปโหลดและประมวลผลลายเซ็นสำเร็จ');
    } catch (err) {
      showNotification('ไม่สามารถประมวลผลภาพได้', 'error');
    } finally {
      if (newFileInputRef.current) newFileInputRef.current.value = '';
    }
  };

  // Add new signer
  const handleAddNewSigner = () => {
    if (!newName.trim()) {
      showNotification('กรุณากรอกชื่อผู้จัดทำใหม่', 'error');
      return;
    }

    const sig =
      newSigMode === 'upload' && newSigUrl
        ? newSigUrl
        : createTextSvgSignature(newName.trim());

    const newSigner: SignerPreset = {
      name: newName.trim(),
      role: newRole.trim() || 'เจ้าหน้าที่ฝ่ายขายและการตลาด',
      signatureUrl: sig,
    };

    const updated = [...presets, newSigner];
    onSavePresets(updated);
    onSelectPerson(newSigner);

    setNewName('');
    setNewRole('เจ้าหน้าที่ฝ่ายขายและการตลาด');
    setNewSigUrl('');
    setIsAddingNew(false);
    showNotification(`เพิ่ม "${newSigner.name}" ลงในรายชื่อเรียบร้อยแล้ว`);
  };

  // Reset to default KX team with in-modal confirmation
  const handleResetToDefault = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    onSavePresets(DEFAULT_PRESET_PREPARED_BY);
    onSelectPerson(DEFAULT_PRESET_PREPARED_BY[0]);
    setShowResetConfirm(false);
    showNotification('รีเซ็ตรายชื่อกลับเป็นค่าเริ่มต้นมาตรฐานเรียบร้อยแล้ว');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                จัดการรายชื่อผู้จัดทำและลายเซ็น (Prepared By Signers)
              </h3>
              <p className="text-xs text-neutral-500">
                แก้ไขชื่อ, ตำแหน่ง, อัปโหลดลายเซ็นใหม่ หรือลบรายชื่อที่ไม่ต้องการออก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Toast */}
        {statusMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Hidden File Input for Signer Signature */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
        />

        {/* Hidden File Input for New Signer */}
        <input
          type="file"
          ref={newFileInputRef}
          onChange={handleNewFileUpload}
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Action Bar: Add new or reset */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-neutral-100">
            <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <span>รายชื่อทั้งหมด ({presets.length} คน)</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(!isAddingNew);
                  setShowResetConfirm(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  isAddingNew
                    ? 'bg-neutral-200 text-neutral-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAddingNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAddingNew ? 'ปิดฟอร์มเพิ่ม' : '➕ เพิ่มผู้จัดทำใหม่'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-lg text-xs font-medium border border-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="รีเซ็ตกลับเป็นรายชื่อเริ่มต้นของอาคาร KX"
              >
                <RotateCcw className="w-3 h-3 text-neutral-500" />
                <span>รีเซ็ตมาตรฐาน</span>
              </button>
            </div>
          </div>

          {/* Reset Confirmation Prompt Banner */}
          {showResetConfirm && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    ต้องการรีเซ็ตรายชื่อผู้จัดทำกลับเป็นค่ามาตรฐานหรือไม่?
                  </p>
                  <p className="text-[11px] text-amber-700">
                    ระบบจะกู้คืนรายชื่อเริ่มต้นทั้ง 8 ท่านของอาคาร KX (พจนา, นุ้ค, บุ๊ค, ติ๊ก, มด, วาสนา, ชลธิชา, ณัฐพงษ์)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg border border-neutral-300 shadow-2xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ยืนยันรีเซ็ต</span>
                </button>
              </div>
            </div>
          )}

          {/* Add New Signer Form (Collapsible) */}
          {isAddingNew && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>เพิ่มผู้จัดทำคนใหม่</span>
                </h4>
                <span className="text-[10px] text-blue-600 font-medium">ระบบจะสร้างลายเซ็นหมึกน้ำเงินอัตโนมัติ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    ชื่อ-นามสกุล หรือชื่อฝ่ายขาย <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น คุณน้ำ (ฝ่ายขาย)"
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    ตำแหน่งงาน
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="เช่น เจ้าหน้าที่ฝ่ายขายและการตลาด"
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Signature method for new signer */}
              <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-neutral-600">รูปลายเซ็น:</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-neutral-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewSigMode('auto')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        newSigMode === 'auto'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      ✍️ สร้างตามชื่ออัตโนมัติ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewSigMode('upload');
                        newFileInputRef.current?.click();
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        newSigMode === 'upload'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      📁 อัปโหลดภาพ
                    </button>
                  </div>

                  {newSigMode === 'upload' && newSigUrl && (
                    <div className="h-7 px-2 bg-white border border-neutral-200 rounded flex items-center shadow-2xs">
                      <img src={newSigUrl} alt="New Signature" className="h-5 max-w-[60px] object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1 text-xs text-neutral-600 hover:text-neutral-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewSigner}
                    disabled={!newName.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    บันทึกเพิ่มลงรายชื่อ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of Signers */}
          <div className="space-y-3">
            {presets.map((preset, index) => {
              const isSelected = currentSelectedName === preset.name;
              const isEditing = editingIndex === index;
              const isPendingDelete = pendingDeleteIndex === index;

              return (
                <div
                  key={`${preset.name}-${index}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPendingDelete
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                      : isSelected
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {isPendingDelete ? (
                    // Inline Delete Confirmation Bar
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-900">
                            ต้องการลบ "{preset.name}" ออกจากรายชื่อผู้จัดทำใช่หรือไม่?
                          </p>
                          <p className="text-[11px] text-rose-700">
                            หากลบ รายชื่อนี้จะไม่ปรากฏในรายการผู้จัดทำอีก
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={handleCancelDelete}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg border border-neutral-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(index)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ยืนยันลบ</span>
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    // Edit Mode Form
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>กำลังแก้ไข: {preset.name}</span>
                        </span>
                        <span className="text-[10px] text-neutral-500">กดบันทึกเพื่ออัปเดต</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10.5px] font-semibold text-neutral-600 mb-0.5">
                            ชื่อ-นามสกุล:
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-semibold text-neutral-600 mb-0.5">
                            ตำแหน่ง:
                          </label>
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center gap-2">
                          {editSigUrl && (
                            <div className="h-8 px-2 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-center">
                              <img src={editSigUrl} alt="Preview" className="h-6 max-w-[70px] object-contain" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newSvg = createTextSvgSignature(editName || preset.name);
                              setEditSigUrl(newSvg);
                              showNotification('สร้างลายเซ็นใหม่เรียบร้อย');
                            }}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>สร้างลายเซ็นอัตโนมัติตามชื่อใหม่</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs text-neutral-600 hover:text-neutral-800 cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(index)}
                            className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            <span>บันทึก</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode Card
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Name & Role info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {preset.name.charAt(0) || '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 text-xs truncate">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.2 rounded-full border border-blue-200 shrink-0">
                                ✓ กำลังเลือกใช้
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {preset.role || 'เจ้าหน้าที่ฝ่ายขายและการตลาด'}
                          </p>
                        </div>
                      </div>

                      {/* Signature Preview & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                        {/* Signature preview box */}
                        <div
                          className="h-9 px-2 bg-neutral-50 border border-neutral-200 rounded-md flex items-center justify-center shadow-2xs group relative cursor-pointer"
                          title="คลิกเพื่ออัปโหลดเปลี่ยนรูปภาพลายเซ็น"
                          onClick={() => handleUploadClick(index)}
                        >
                          {preset.signatureUrl ? (
                            <img
                              src={preset.signatureUrl}
                              alt={preset.name}
                              className="h-7 max-w-[80px] object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-neutral-400">ไม่มีลายเซ็น</span>
                          )}
                          <div className="absolute inset-0 bg-neutral-900/60 rounded-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-medium">
                            เปลี่ยนรูป
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {/* Upload image button */}
                          <button
                            type="button"
                            onClick={() => handleUploadClick(index)}
                            className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="อัปโหลดไฟล์รูปลายเซ็นใหม่ (ระบบจะตัดพื้นหลังและแปลงเป็นหมึกน้ำเงินอัตโนมัติ)"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>

                          {/* Re-generate auto blue SVG signature button */}
                          <button
                            type="button"
                            onClick={() => handleRegenerateSignature(index, preset.name)}
                            className="p-1.5 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="สร้างลายเซ็นเขียนหมึกน้ำเงินอัตโนมัติตามชื่อนี้"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Edit Name & Role */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(index)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขชื่อและตำแหน่ง"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete signer */}
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(index)}
                            disabled={presets.length <= 1}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                            title={presets.length <= 1 ? 'ต้องมีอย่างน้อย 1 รายชื่อ' : `ลบ "${preset.name}" ออก`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Select as active button */}
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPerson(preset);
                                showNotification(`เลือก "${preset.name}" เป็นผู้จัดทำเอกสารแล้ว`);
                              }}
                              className="ml-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-300 rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                            >
                              เลือกใช้
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            <span>💡 ข้อมูลจะถูกบันทึกจำไว้ในเครื่องนี้อัตโนมัติ</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            เสร็จสิ้น (เรียบร้อย)
          </button>
        </div>
      </div>
    </div>
  );
};
