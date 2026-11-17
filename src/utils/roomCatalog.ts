import { RoomCatalogItem } from '../types';

export const ROOMS_STORAGE_KEY = 'kx_rooms_catalog_2026_v2';

/**
 * KX EVENT SPACE CATALOG 2026
 * Valid until 31 December 2026
 * Note: Internet connection, drinking water, microphone are included
 */
export const DEFAULT_ROOM_CATALOG: RoomCatalogItem[] = [
  // ==========================================
  // FL.7
  // ==========================================
  {
    id: 'room-fl7-auditorium',
    name: 'AUDITORIUM',
    category: 'room',
    unit: 'วัน',
    unitPrice: 70000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 14700,
    halfDayPrice: 42000,
    fullDayPrice: 70000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 16000,
    halfDayWeekendPrice: 45000,
    fullDayWeekendPrice: 75000,
    floor: 'FL.7',
    sizeSqM: 264,
    hasNaturalLight: true,
    theatreCapacity: 220,
    classroomCapacity: 130,
    uShapeCapacity: 100,
    capacity: 'Theatre: 220, Classroom: 130, U-Shape: 100 ท่าน (264 ตร.ม.)',
    description: 'หอประชุมใหญ่ สเต็ปเธียเตอร์ แสงธรรมชาติ พร้อมไมโครโฟน น้ำดื่ม และอินเทอร์เน็ต',
    isCustom: false,
  },

  // ==========================================
  // FL.8
  // ==========================================
  {
    id: 'room-fl8-hall',
    name: 'HALL',
    category: 'room',
    unit: 'วัน',
    unitPrice: 60000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 12600,
    halfDayPrice: 36000,
    fullDayPrice: 60000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 14000,
    halfDayWeekendPrice: 39000,
    fullDayWeekendPrice: 65000,
    floor: 'FL.8',
    sizeSqM: 264,
    hasNaturalLight: true,
    theatreCapacity: 80,
    capacity: 'Theatre: 80 ท่าน (264 ตร.ม.)',
    description: 'โถงจัดกิจกรรม Hall ชั้น 8 แสงธรรมชาติ พื้นที่เปิดโล่งอเนกประสงค์',
    isCustom: false,
  },

  // ==========================================
  // FL.7+8
  // ==========================================
  {
    id: 'room-fl78-auditorium-hall',
    name: 'AUDITORIUM + HALL',
    category: 'room',
    unit: 'วัน',
    unitPrice: 120000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 26250,
    halfDayPrice: 75000,
    fullDayPrice: 120000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 28000,
    halfDayWeekendPrice: 81000,
    fullDayWeekendPrice: 135000,
    floor: 'FL.7+8',
    sizeSqM: 528,
    hasNaturalLight: true,
    theatreCapacity: 300,
    capacity: 'Theatre: 300 ท่าน (528 ตร.ม.)',
    description: 'พื้นที่จัดงานขนาดใหญ่ 2 ชั้น เชื่อมต่อ Auditorium และ Hall แสงธรรมชาติ',
    isCustom: false,
  },

  // ==========================================
  // FL.9
  // ==========================================
  {
    id: 'room-fl9-canteen-non-air',
    name: 'CANTEEN NON-AIR',
    category: 'room',
    unit: 'วัน',
    unitPrice: 40000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 0, // N/A in catalog
    halfDayPrice: 20000,
    fullDayPrice: 40000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 0, // N/A in catalog
    halfDayWeekendPrice: 20000,
    fullDayWeekendPrice: 40000,
    floor: 'FL.9',
    sizeSqM: 496,
    hasNaturalLight: true,
    theatreCapacity: 150,
    capacity: 'Theatre: 150 ท่าน (496 ตร.ม.)',
    description: 'พื้นที่โรงอาหารแบบเปิดโล่ง Non-Air แสงธรรมชาติ เหมาะจัดเลี้ยงหรือกิจกรรมทั่วไป',
    isCustom: false,
  },
  {
    id: 'room-fl9-canteen-air-cond',
    name: 'CANTEEN AIR COND',
    category: 'room',
    unit: 'วัน',
    unitPrice: 25000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 3000,
    halfDayPrice: 15000,
    fullDayPrice: 25000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3000,
    halfDayWeekendPrice: 15000,
    fullDayWeekendPrice: 25000,
    floor: 'FL.9',
    sizeSqM: 264,
    hasNaturalLight: true,
    theatreCapacity: 150,
    capacity: 'Theatre: 150 ท่าน (264 ตร.ม.)',
    description: 'พื้นที่โรงอาหารปรับอากาศ แสงธรรมชาติ เหมาะจัดเลี้ยงและสัมมนา',
    isCustom: false,
  },

  // ==========================================
  // FL.10
  // ==========================================
  {
    id: 'room-fl10-x01a',
    name: 'X01A',
    category: 'room',
    unit: 'วัน',
    unitPrice: 8000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1700,
    halfDayPrice: 4800,
    fullDayPrice: 8000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1800,
    halfDayWeekendPrice: 5000,
    fullDayWeekendPrice: 8500,
    floor: 'FL.10',
    sizeSqM: 65,
    hasNaturalLight: true,
    theatreCapacity: 40,
    classroomCapacity: 26,
    uShapeCapacity: 18,
    capacity: 'Theatre: 40, Classroom: 26, U-Shape: 18 ท่าน (65 ตร.ม.)',
    description: 'ห้องสัมมนา X01A แสงธรรมชาติ พร้อมจอและเครื่องเสียง',
    isCustom: false,
  },
  {
    id: 'room-fl10-x01b',
    name: 'X01B',
    category: 'room',
    unit: 'วัน',
    unitPrice: 8000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1700,
    halfDayPrice: 4800,
    fullDayPrice: 8000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1800,
    halfDayWeekendPrice: 5000,
    fullDayWeekendPrice: 8500,
    floor: 'FL.10',
    sizeSqM: 60,
    hasNaturalLight: true,
    theatreCapacity: 40,
    classroomCapacity: 26,
    uShapeCapacity: 18,
    capacity: 'Theatre: 40, Classroom: 26, U-Shape: 18 ท่าน (60 ตร.ม.)',
    description: 'ห้องสัมมนา X01B แสงธรรมชาติ พร้อมจอและเครื่องเสียง',
    isCustom: false,
  },
  {
    id: 'room-fl10-x01ab',
    name: 'X01AB',
    category: 'room',
    unit: 'วัน',
    unitPrice: 12500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 2600,
    halfDayPrice: 7500,
    fullDayPrice: 12500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3000,
    halfDayWeekendPrice: 8500,
    fullDayWeekendPrice: 14000,
    floor: 'FL.10',
    sizeSqM: 125,
    hasNaturalLight: true,
    theatreCapacity: 100,
    classroomCapacity: 60,
    uShapeCapacity: 40,
    capacity: 'Theatre: 100, Classroom: 60, U-Shape: 40 ท่าน (125 ตร.ม.)',
    description: 'ห้องสัมมนาแบบเชื่อมต่อ X01A + X01B แสงธรรมชาติ พื้นที่กว้างขวาง',
    isCustom: false,
  },
  {
    id: 'room-fl10-x02',
    name: 'X02',
    category: 'room',
    unit: 'วัน',
    unitPrice: 8000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1700,
    halfDayPrice: 4800,
    fullDayPrice: 8000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1800,
    halfDayWeekendPrice: 5000,
    fullDayWeekendPrice: 8500,
    floor: 'FL.10',
    sizeSqM: 65,
    hasNaturalLight: true,
    theatreCapacity: 45,
    classroomCapacity: 36,
    uShapeCapacity: 20,
    capacity: 'Theatre: 45, Classroom: 36, U-Shape: 20 ท่าน (65 ตร.ม.)',
    description: 'ห้องสัมมนา X02 แสงธรรมชาติ เหมาะสำหรับงานอบรมและประชุม',
    isCustom: false,
  },
  {
    id: 'room-fl10-x03',
    name: 'X03',
    category: 'room',
    unit: 'วัน',
    unitPrice: 8000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1700,
    halfDayPrice: 4800,
    fullDayPrice: 8000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1800,
    halfDayWeekendPrice: 5000,
    fullDayWeekendPrice: 8500,
    floor: 'FL.10',
    sizeSqM: 70,
    hasNaturalLight: true,
    theatreCapacity: 50,
    classroomCapacity: 38,
    uShapeCapacity: 22,
    capacity: 'Theatre: 50, Classroom: 38, U-Shape: 22 ท่าน (70 ตร.ม.)',
    description: 'ห้องสัมมนา X03 แสงธรรมชาติ เหมาะสำหรับการบรรยายและสัมมนา',
    isCustom: false,
  },
  {
    id: 'room-fl10-x04a',
    name: 'X04A',
    category: 'room',
    unit: 'วัน',
    unitPrice: 12500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 2600,
    halfDayPrice: 7500,
    fullDayPrice: 12500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3000,
    halfDayWeekendPrice: 8500,
    fullDayWeekendPrice: 14000,
    floor: 'FL.10',
    sizeSqM: 110,
    hasNaturalLight: false,
    theatreCapacity: 80,
    classroomCapacity: 50,
    uShapeCapacity: 36,
    capacity: 'Theatre: 80, Classroom: 50, U-Shape: 36 ท่าน (110 ตร.ม.)',
    description: 'ห้องสัมมนาขนาดใหญ่ X04A สำหรับการประชุมและการบรรยาย',
    isCustom: false,
  },
  {
    id: 'room-fl10-x04b',
    name: 'X04B',
    category: 'room',
    unit: 'วัน',
    unitPrice: 15000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 3100,
    halfDayPrice: 9000,
    fullDayPrice: 15000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3500,
    halfDayWeekendPrice: 9500,
    fullDayWeekendPrice: 15000,
    floor: 'FL.10',
    sizeSqM: 140,
    hasNaturalLight: false,
    theatreCapacity: 100,
    classroomCapacity: 60,
    uShapeCapacity: 44,
    capacity: 'Theatre: 100, Classroom: 60, U-Shape: 44 ท่าน (140 ตร.ม.)',
    description: 'ห้องสัมมนาขนาดใหญ่ X04B สำหรับสัมมนาผู้ฟังจำนวนมาก',
    isCustom: false,
  },
  {
    id: 'room-fl10-x04ab',
    name: 'X04AB',
    category: 'room',
    unit: 'วัน',
    unitPrice: 24000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 5000,
    halfDayPrice: 14400,
    fullDayPrice: 24000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 6000,
    halfDayWeekendPrice: 14400,
    fullDayWeekendPrice: 24000,
    floor: 'FL.10',
    sizeSqM: 250,
    hasNaturalLight: false,
    theatreCapacity: 200,
    classroomCapacity: 120,
    uShapeCapacity: 80,
    capacity: 'Theatre: 200, Classroom: 120, U-Shape: 80 ท่าน (250 ตร.ม.)',
    description: 'ห้องสัมมนาขนาดใหญ่พิเศษ เชื่อมต่อ X04A + X04B รองรับได้สูงสุด 200 ท่าน',
    isCustom: false,
  },

  // ==========================================
  // FL.11
  // ==========================================
  {
    id: 'room-fl11-x11-1',
    name: 'X11.1',
    category: 'room',
    unit: 'วัน',
    unitPrice: 7000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1500,
    halfDayPrice: 4200,
    fullDayPrice: 7000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1600,
    halfDayWeekendPrice: 4500,
    fullDayWeekendPrice: 7500,
    floor: 'FL.11',
    sizeSqM: 68,
    hasNaturalLight: true,
    theatreCapacity: 40,
    classroomCapacity: 30,
    uShapeCapacity: 24,
    capacity: 'Theatre: 40, Classroom: 30, U-Shape: 24 ท่าน (68 ตร.ม.)',
    description: 'ห้องสัมมนา X11.1 แสงธรรมชาติ พร้อมอุปกรณ์โสตทัศน์',
    isCustom: false,
  },
  {
    id: 'room-fl11-x11-2',
    name: 'X11.2',
    category: 'room',
    unit: 'วัน',
    unitPrice: 7000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1500,
    halfDayPrice: 4200,
    fullDayPrice: 7000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1600,
    halfDayWeekendPrice: 4500,
    fullDayWeekendPrice: 7500,
    floor: 'FL.11',
    sizeSqM: 69,
    hasNaturalLight: true,
    theatreCapacity: 40,
    classroomCapacity: 30,
    uShapeCapacity: 24,
    capacity: 'Theatre: 40, Classroom: 30, U-Shape: 24 ท่าน (69 ตร.ม.)',
    description: 'ห้องสัมมนา X11.2 แสงธรรมชาติ พร้อมอุปกรณ์โสตทัศน์',
    isCustom: false,
  },
  {
    id: 'room-fl11-x11-3',
    name: 'X11.3',
    category: 'room',
    unit: 'วัน',
    unitPrice: 7000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1500,
    halfDayPrice: 4200,
    fullDayPrice: 7000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1600,
    halfDayWeekendPrice: 4500,
    fullDayWeekendPrice: 7500,
    floor: 'FL.11',
    sizeSqM: 69,
    hasNaturalLight: true,
    theatreCapacity: 40,
    classroomCapacity: 30,
    uShapeCapacity: 24,
    capacity: 'Theatre: 40, Classroom: 30, U-Shape: 24 ท่าน (69 ตร.ม.)',
    description: 'ห้องสัมมนา X11.3 แสงธรรมชาติ พร้อมอุปกรณ์โสตทัศน์',
    isCustom: false,
  },
  {
    id: 'room-fl11-x11-7',
    name: 'X11.7',
    category: 'room',
    unit: 'วัน',
    unitPrice: 8900,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 1900,
    halfDayPrice: 5400,
    fullDayPrice: 8900,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 2000,
    halfDayWeekendPrice: 5700,
    fullDayWeekendPrice: 9500,
    floor: 'FL.11',
    sizeSqM: 92,
    hasNaturalLight: false,
    theatreCapacity: 60,
    classroomCapacity: 50,
    uShapeCapacity: 30,
    capacity: 'Theatre: 60, Classroom: 50, U-Shape: 30 ท่าน (92 ตร.ม.)',
    description: 'ห้องสัมมนา X11.7 สำหรับการประชุมกลุ่มและการบรรยาย',
    isCustom: false,
  },
  {
    id: 'room-fl11-hall',
    name: 'HALL',
    category: 'room',
    unit: 'วัน',
    unitPrice: 15000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 3200,
    halfDayPrice: 9000,
    fullDayPrice: 15000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 4200,
    halfDayWeekendPrice: 12000,
    fullDayWeekendPrice: 20000,
    floor: 'FL.11',
    sizeSqM: 60,
    hasNaturalLight: false,
    theatreCapacity: 50,
    capacity: 'Theatre: 50 ท่าน (60 ตร.ม.)',
    description: 'โถงจัดกิจกรรม Hall ชั้น 11 เหมาะสำหรับกิจกรรมเปิดตัวและจัดแสดงผลงาน',
    isCustom: false,
  },

  // ==========================================
  // FL.12
  // ==========================================
  {
    id: 'room-fl12-m12-1',
    name: 'M12.1',
    category: 'room',
    unit: 'วัน',
    unitPrice: 4000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 800,
    halfDayPrice: 2400,
    fullDayPrice: 4000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1000,
    halfDayWeekendPrice: 2700,
    fullDayWeekendPrice: 4500,
    floor: 'FL.12',
    sizeSqM: 40,
    hasNaturalLight: true,
    uShapeCapacity: 10,
    capacity: 'U-Shape: 10 ท่าน (40 ตร.ม.)',
    description: 'ห้องประชุมขนาดเล็ก M12.1 แสงธรรมชาติ สำหรับการประชุมกลุ่มย่อย',
    isCustom: false,
  },
  {
    id: 'room-fl12-m12-2',
    name: 'M12.2',
    category: 'room',
    unit: 'วัน',
    unitPrice: 2500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 500,
    halfDayPrice: 1500,
    fullDayPrice: 2500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 700,
    halfDayWeekendPrice: 1800,
    fullDayWeekendPrice: 3000,
    floor: 'FL.12',
    sizeSqM: 18,
    hasNaturalLight: true,
    uShapeCapacity: 4,
    capacity: 'U-Shape: 4 ท่าน (18 ตร.ม.)',
    description: 'ห้องประชุมย่อย M12.2 แสงธรรมชาติ เหมาะสำหรับนัดสัมภาษณ์และพูดคุยส่วนตัว',
    isCustom: false,
  },
  {
    id: 'room-fl12-m12-3',
    name: 'M12.3',
    category: 'room',
    unit: 'วัน',
    unitPrice: 2500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 500,
    halfDayPrice: 1500,
    fullDayPrice: 2500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 700,
    halfDayWeekendPrice: 1800,
    fullDayWeekendPrice: 3000,
    floor: 'FL.12',
    sizeSqM: 20,
    hasNaturalLight: true,
    uShapeCapacity: 6,
    capacity: 'U-Shape: 6 ท่าน (20 ตร.ม.)',
    description: 'ห้องประชุมย่อย M12.3 แสงธรรมชาติ สำหรับการประชุมทีมขนาดเล็ก',
    isCustom: false,
  },
  {
    id: 'room-fl12-kx-king',
    name: 'KX KING',
    category: 'room',
    unit: 'วัน',
    unitPrice: 4500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 950,
    halfDayPrice: 2700,
    fullDayPrice: 4500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1100,
    halfDayWeekendPrice: 3000,
    fullDayWeekendPrice: 5000,
    floor: 'FL.12',
    sizeSqM: 50,
    hasNaturalLight: false,
    uShapeCapacity: 15,
    capacity: 'U-Shape: 15 ท่าน (50 ตร.ม.)',
    description: 'ห้องประชุมพิเศษ KX King เหมาะสำหรับการประชุมผู้บริหารและทีมงาน',
    isCustom: false,
  },
  {
    id: 'room-fl12-kx-queen',
    name: 'KX QUEEN',
    category: 'room',
    unit: 'วัน',
    unitPrice: 4500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 950,
    halfDayPrice: 2700,
    fullDayPrice: 4500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 1100,
    halfDayWeekendPrice: 3000,
    fullDayWeekendPrice: 5000,
    floor: 'FL.12',
    sizeSqM: 50,
    hasNaturalLight: false,
    uShapeCapacity: 15,
    capacity: 'U-Shape: 15 ท่าน (50 ตร.ม.)',
    description: 'ห้องประชุมพิเศษ KX Queen เหมาะสำหรับการประชุมผู้บริหารและทีมงาน',
    isCustom: false,
  },

  // ==========================================
  // FL.13
  // ==========================================
  {
    id: 'room-fl13-workshop-area',
    name: 'WORKSHOP AREA (MEMBER ONLY)',
    category: 'room',
    unit: 'วัน',
    unitPrice: 12500,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 2600,
    halfDayPrice: 7500,
    fullDayPrice: 12500,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3200,
    halfDayWeekendPrice: 9000,
    fullDayWeekendPrice: 15000,
    floor: 'FL.13',
    sizeSqM: 140,
    hasNaturalLight: true,
    theatreCapacity: 50,
    capacity: 'Theatre: 50 ท่าน (140 ตร.ม.)',
    description: 'พื้นที่จัดเวิร์กช็อปและกิจกรรมสร้างสรรค์ (เฉพาะสมาชิก KX) แสงธรรมชาติ',
    isCustom: false,
  },

  // ==========================================
  // FL.17
  // ==========================================
  {
    id: 'room-fl17-x17-1',
    name: 'X17.1',
    category: 'room',
    unit: 'วัน',
    unitPrice: 15000,
    // Weekday (จันทร์ - ศุกร์)
    hourlyPrice: 3100,
    halfDayPrice: 9000,
    fullDayPrice: 15000,
    // Weekend (เสาร์ - อาทิตย์)
    hourlyWeekendPrice: 3500,
    halfDayWeekendPrice: 9500,
    fullDayWeekendPrice: 15000,
    floor: 'FL.17',
    sizeSqM: 130,
    hasNaturalLight: true,
    theatreCapacity: 80,
    classroomCapacity: 40,
    uShapeCapacity: 30,
    capacity: 'Theatre: 80, Classroom: 40, U-Shape: 30 ท่าน (130 ตร.ม.)',
    description: 'ห้องประชุมสัมมนาชั้น 17 วิวมุมสูง แสงธรรมชาติ พร้อมอุปกรณ์โสตทัศน์ระดับพรีเมียม',
    isCustom: false,
  },

  // ==========================================
  // อุปกรณ์และบริการเสริม (Equipment & Services)
  // ==========================================
  {
    id: 'eq-wireless-mic',
    name: 'ไมโครโฟนไร้สาย (Wireless Microphone)',
    category: 'equipment',
    unit: 'ชุด/วัน',
    unitPrice: 500,
    hourlyPrice: 100,
    halfDayPrice: 300,
    fullDayPrice: 500,
    hourlyWeekendPrice: 100,
    halfDayWeekendPrice: 300,
    fullDayWeekendPrice: 500,
    description: 'ไมโครโฟนไร้สาย UHF พร้อมตัวรับสัญญาณ',
    isCustom: false,
  },
  {
    id: 'eq-projector-laser',
    name: 'เครื่องฉายเลเซอร์โปรเจคเตอร์ 5,000 Lumens',
    category: 'equipment',
    unit: 'เครื่อง/วัน',
    unitPrice: 2500,
    hourlyPrice: 500,
    halfDayPrice: 1500,
    fullDayPrice: 2500,
    hourlyWeekendPrice: 500,
    halfDayWeekendPrice: 1500,
    fullDayWeekendPrice: 2500,
    description: 'โปรเจคเตอร์ความสว่างสูง พร้อมจอฉายมอเตอร์ไฟฟ้า',
    isCustom: false,
  },
  {
    id: 'eq-pa-system',
    name: 'ชุดเครื่องเสียงและลำโพงแบบพกพา (PA Portable System)',
    category: 'equipment',
    unit: 'ชุด/วัน',
    unitPrice: 2000,
    hourlyPrice: 400,
    halfDayPrice: 1200,
    fullDayPrice: 2000,
    hourlyWeekendPrice: 400,
    halfDayWeekendPrice: 1200,
    fullDayWeekendPrice: 2000,
    description: 'ลำโพงแอคทีฟพร้อมมิกเซอร์และไมค์สาย',
    isCustom: false,
  },
  {
    id: 'srv-overtime-venue',
    name: 'ค่าบริการจัดสถานที่ล่วงเวลา (เกิน 18.00 น.)',
    category: 'service',
    unit: 'ชั่วโมง',
    unitPrice: 1500,
    hourlyPrice: 1500,
    halfDayPrice: 4500,
    fullDayPrice: 9000,
    hourlyWeekendPrice: 1800,
    halfDayWeekendPrice: 5400,
    fullDayWeekendPrice: 10800,
    description: 'ค่าบริการเปิดระบบปรับอากาศและเจ้าหน้าที่ดูแลสถานที่นอกเวลาทำการ',
    isCustom: false,
  },

  // ==========================================
  // ค่านำเข้าอาหารและเครื่องดื่ม (Food & Beverage Corkage)
  // ==========================================
  {
    id: 'srv-corkage-box-25-29',
    name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 25 - 29 ท่าน',
    category: 'service',
    unit: 'วัน',
    unitPrice: 500,
    hourlyPrice: 500,
    halfDayPrice: 500,
    fullDayPrice: 500,
    hourlyWeekendPrice: 500,
    halfDayWeekendPrice: 500,
    fullDayWeekendPrice: 500,
    capacity: '25 - 29 ท่าน',
    description: 'ค่านำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) จำนวนผู้เข้าร่วมงานตั้งแต่ 25 - 29 ท่าน คิดค่านำเข้า 500 บาท/วัน',
    isCustom: false,
  },
  {
    id: 'srv-corkage-box-30-100',
    name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 30 - 100 ท่าน',
    category: 'service',
    unit: 'วัน',
    unitPrice: 1000,
    hourlyPrice: 1000,
    halfDayPrice: 1000,
    fullDayPrice: 1000,
    hourlyWeekendPrice: 1000,
    halfDayWeekendPrice: 1000,
    fullDayWeekendPrice: 1000,
    capacity: '30 - 100 ท่าน',
    description: 'ค่านำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) จำนวนผู้เข้าร่วมงานตั้งแต่ 30 - 100 ท่าน คิดค่านำเข้า 1,000 บาท/วัน',
    isCustom: false,
  },
  {
    id: 'srv-corkage-box-100-plus',
    name: 'นำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) 100 ท่านขึ้นไป',
    category: 'service',
    unit: 'วัน',
    unitPrice: 1500,
    hourlyPrice: 1500,
    halfDayPrice: 1500,
    fullDayPrice: 1500,
    hourlyWeekendPrice: 1500,
    halfDayWeekendPrice: 1500,
    fullDayWeekendPrice: 1500,
    capacity: 'ตั้งแต่ 100 ท่านขึ้นไป',
    description: 'ค่านำเข้าอาหารและเครื่องดื่ม (แบบกล่อง) จำนวนผู้เข้าร่วมงานตั้งแต่ 100 ท่านขึ้นไป คิดค่านำเข้า 1,500 บาท/วัน',
    isCustom: false,
  },
  {
    id: 'srv-corkage-buffet-2000',
    name: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 2,000 บาท/วัน',
    category: 'service',
    unit: 'วัน',
    unitPrice: 2000,
    hourlyPrice: 2000,
    halfDayPrice: 2000,
    fullDayPrice: 2000,
    hourlyWeekendPrice: 2000,
    halfDayWeekendPrice: 2000,
    fullDayWeekendPrice: 2000,
    description: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) ค่านำเข้า 2,000 บาท/วัน',
    isCustom: false,
  },
  {
    id: 'srv-corkage-buffet-3000',
    name: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) 3,000 บาท/วัน',
    category: 'service',
    unit: 'วัน',
    unitPrice: 3000,
    hourlyPrice: 3000,
    halfDayPrice: 3000,
    fullDayPrice: 3000,
    hourlyWeekendPrice: 3000,
    halfDayWeekendPrice: 3000,
    fullDayWeekendPrice: 3000,
    description: 'นำเข้าอาหารและเครื่องดื่ม (บุฟเฟ่ต์) ค่านำเข้า 3,000 บาท/วัน',
    isCustom: false,
  },
];

/**
 * Load room and equipment catalog from localStorage with fallback & auto-migration
 */
export function loadRoomCatalog(): RoomCatalogItem[] {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!raw) {
      // Check if user had custom rooms in older storage key
      const oldRaw = localStorage.getItem('kx_rooms_catalog_v1');
      let customRooms: RoomCatalogItem[] = [];
      if (oldRaw) {
        try {
          const oldParsed = JSON.parse(oldRaw);
          if (Array.isArray(oldParsed)) {
            customRooms = oldParsed.filter((it: RoomCatalogItem) => it.isCustom);
          }
        } catch (_) {}
      }
      const initialCatalog = [...DEFAULT_ROOM_CATALOG, ...customRooms];
      saveRoomCatalog(initialCatalog);
      return initialCatalog;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingIds = new Set(parsed.map((p: RoomCatalogItem) => p.id));
      const missingDefaults = DEFAULT_ROOM_CATALOG.filter((d) => !existingIds.has(d.id));
      if (missingDefaults.length > 0) {
        const merged = [...parsed, ...missingDefaults];
        saveRoomCatalog(merged);
        return merged;
      }
      return parsed;
    }
    return DEFAULT_ROOM_CATALOG;
  } catch (e) {
    console.error('Failed to load rooms catalog:', e);
    return DEFAULT_ROOM_CATALOG;
  }
}

/**
 * Save room catalog to localStorage and notify all components
 */
export function saveRoomCatalog(items: RoomCatalogItem[]): void {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('kx_rooms_updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save room catalog:', e);
  }
}

/**
 * Add a new room or equipment to catalog
 */
export function addRoomToCatalog(
  item: Omit<RoomCatalogItem, 'id' | 'isCustom' | 'createdAt'>
): RoomCatalogItem {
  const catalog = loadRoomCatalog();
  const newItem: RoomCatalogItem = {
    ...item,
    id: `custom-room-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...catalog];
  saveRoomCatalog(updated);
  return newItem;
}

/**
 * Update an existing room/equipment
 */
export function updateRoomInCatalog(
  id: string,
  updates: Partial<RoomCatalogItem>
): RoomCatalogItem[] {
  const catalog = loadRoomCatalog();
  const updated = catalog.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveRoomCatalog(updated);
  return updated;
}

/**
 * Delete a room from catalog
 */
export function deleteRoomFromCatalog(id: string): RoomCatalogItem[] {
  const catalog = loadRoomCatalog();
  const updated = catalog.filter((item) => item.id !== id);
  saveRoomCatalog(updated);
  return updated;
}

/**
 * Reset catalog back to factory defaults
 */
export function resetRoomCatalog(): RoomCatalogItem[] {
  saveRoomCatalog(DEFAULT_ROOM_CATALOG);
  return DEFAULT_ROOM_CATALOG;
}

export type DayType = 'WEEKDAY' | 'WEEKEND';

export interface DayTypeInfo {
  type: DayType;
  label: string; // 'วันธรรมดา (จันทร์ - ศุกร์)' or 'วันเสาร์ - อาทิตย์'
  shortLabel: string; // 'วันธรรมดา จันทร์-ศุกร์' or 'วันเสาร์-อาทิตย์'
  dayName: string; // 'วันจันทร์', 'วันอังคาร', etc.
  isWeekend: boolean;
}

/**
 * ตรวจสอบประเภทวัน: เช็กจากวันที่ใช้งานอัตโนมัติว่าเป็น วันธรรมดา (จันทร์-ศุกร์) หรือ วันเสาร์-อาทิตย์
 */
export function getDayType(dateStr?: string): DayTypeInfo {
  if (!dateStr) {
    return {
      type: 'WEEKDAY',
      label: 'วันธรรมดา จันทร์-ศุกร์ (Weekday)',
      shortLabel: 'วันธรรมดา จันทร์-ศุกร์',
      dayName: 'วันจันทร์-ศุกร์',
      isWeekend: false,
    };
  }

  // Parse YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const dayName = thaiDays[dayOfWeek] || '';
      return {
        type: isWeekend ? 'WEEKEND' : 'WEEKDAY',
        label: isWeekend ? 'วันเสาร์-อาทิตย์ (Weekend)' : 'วันธรรมดา จันทร์-ศุกร์ (Weekday)',
        shortLabel: isWeekend ? 'วันเสาร์-อาทิตย์' : 'วันธรรมดา จันทร์-ศุกร์',
        dayName,
        isWeekend,
      };
    }
  }

  return {
    type: 'WEEKDAY',
    label: 'วันธรรมดา จันทร์-ศุกร์ (Weekday)',
    shortLabel: 'วันธรรมดา จันทร์-ศุกร์',
    dayName: 'วันธรรมดา',
    isWeekend: false,
  };
}

export type UsageCategory = 'HALF_DAY' | 'FULL_DAY' | 'HOURLY' | 'HALF_DAY_PLUS_HOURLY' | 'FULL_DAY_PLUS_HOURLY';

export interface UsageCalculationResult {
  category: UsageCategory;
  categoryName: string; // 'ครึ่งวัน (Half Day)', 'เต็มวัน (Full Day)', 'รายชั่วโมง (Hourly)'
  badgeColor: string;
  unit: string;         // 'ครึ่งวัน', 'วัน', 'ชั่วโมง', 'ครั้ง'
  quantity: number;     // 1 for half day / full day; number of hours for hourly
  ratePerUnit: number;  // unit price for the calculation (ตามประเภทวันและประเภทชั่วโมง)
  totalRate: number;    // quantity * ratePerUnit
  dayInfo: DayTypeInfo;
  formattedDescription: string;
  ruleExplanation: string;
}

/**
 * Categorize usage duration automatically according to KX business rules:
 * - เศษของนาทีให้ปัดขึ้นเป็น 1 ชั่วโมงเสมอ (เช่น 2.01 ชม. -> 3 ชม.)
 * - 0.01 - 2.00 ชม.: คิดราคาแบบรายชั่วโมง (Hourly Rate) ตามจำนวนชั่วโมงที่ปัดเศษแล้ว
 * - 2.01 - 5.00 ชม.: คิดราคาแบบครึ่งวัน (Half Day Rate)
 * - 5.01 - 6.00 ชม.: คิดราคาแบบครึ่งวัน + รายชั่วโมง 1 ชม. (Half Day Rate + 1 Hour Hourly Rate)
 * - 6.01 - 10.00 ชม.: คิดราคาแบบเต็มวัน (Full Day Rate)
 * - เกิน 10.00 ชม.: คิดราคาแบบเต็มวัน + รายชั่วโมงส่วนเกิน
 */
export function calculateUsageCategory(hours: number): {
  category: UsageCategory;
  categoryName: string;
  unit: string;
  ruleExplanation: string;
} {
  const ceilHours = Math.max(1, Math.ceil(hours));
  
  if (ceilHours <= 2) {
    return {
      category: 'HOURLY',
      categoryName: `รายชั่วโมง (${ceilHours} ชม.)`,
      unit: 'ชั่วโมง',
      ruleExplanation: `${ceilHours} ชม.: คำนวณเป็นอัตรา "รายชั่วโมง" (0.01 - 2.00 ชม.)`,
    };
  } else if (ceilHours <= 5) {
    return {
      category: 'HALF_DAY',
      categoryName: `ครึ่งวัน (${ceilHours} ชม.)`,
      unit: 'ครึ่งวัน',
      ruleExplanation: `${ceilHours} ชม.: คำนวณเป็นอัตรา "ครึ่งวัน" (2.01 - 5.00 ชม.)`,
    };
  } else if (ceilHours === 6) {
    return {
      category: 'HALF_DAY_PLUS_HOURLY',
      categoryName: 'ครึ่งวัน + 1 ชม. (6 ชม.)',
      unit: 'ครั้ง',
      ruleExplanation: `6 ชม.: คำนวณเป็นอัตรา "ครึ่งวัน + รายชั่วโมง 1 ชม." (5.01 - 6.00 ชม.)`,
    };
  } else if (ceilHours <= 10) {
    return {
      category: 'FULL_DAY',
      categoryName: `เต็มวัน (${ceilHours} ชม.)`,
      unit: 'วัน',
      ruleExplanation: `${ceilHours} ชม.: คำนวณเป็นอัตรา "เต็มวัน" (6.01 - 10.00 ชม.)`,
    };
  } else {
    const extraH = ceilHours - 10;
    return {
      category: 'FULL_DAY_PLUS_HOURLY',
      categoryName: `เต็มวัน + ${extraH} ชม. (${ceilHours} ชม.)`,
      unit: 'วัน',
      ruleExplanation: `${ceilHours} ชม.: คำนวณเป็นอัตรา "เต็มวัน + ${extraH} ชม. รายชั่วโมง" (เกิน 10 ชม.)`,
    };
  }
}

/**
 * Calculate rate for a selected room based on duration and eventDate (Weekday vs Weekend)
 */
export function calculateRoomRate(
  room: RoomCatalogItem,
  hours: number,
  eventDate?: string,
  timeRangeStr?: string
): UsageCalculationResult {
  // If timeRangeStr is provided and hours might be default, re-parse actual hours with ceiling rule
  let effectiveHours = hours;
  if (timeRangeStr) {
    const parsedFromStr = parseTimeRangeStringToHours(timeRangeStr);
    if (parsedFromStr > 0) {
      effectiveHours = parsedFromStr;
    }
  }

  const ceilHours = Math.max(1, Math.ceil(effectiveHours));
  const cat = calculateUsageCategory(ceilHours);
  const dayInfo = getDayType(eventDate);
  const isWk = dayInfo.isWeekend;

  // Base prices for Weekday / Weekend
  const halfDayBase = isWk
    ? (room.halfDayWeekendPrice || room.halfDayPrice || Math.round((room.unitPrice || 7000) * 0.6))
    : (room.halfDayPrice || Math.round((room.unitPrice || 7000) * 0.6));

  const fullDayBase = isWk
    ? (room.fullDayWeekendPrice || room.fullDayPrice || room.unitPrice)
    : (room.fullDayPrice || room.unitPrice);

  const hourlyBase = isWk
    ? (room.hourlyWeekendPrice || room.hourlyPrice || Math.round(halfDayBase / 4))
    : (room.hourlyPrice || Math.round(halfDayBase / 4));

  let ratePerUnit = 0;
  let quantity = 1;
  let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';

  if (cat.category === 'HOURLY') {
    // 0.01 - 2.00 ชม.: คิดราคาแบบรายชั่วโมง (Hourly Rate) ตามจำนวนชั่วโมงที่ปัดเศษแล้ว
    ratePerUnit = hourlyBase;
    quantity = ceilHours;
    badgeColor = 'bg-purple-50 text-purple-900 border-purple-300';
  } else if (cat.category === 'HALF_DAY') {
    // 2.01 - 5.00 ชม.: คิดราคาแบบครึ่งวัน (Half Day Rate)
    ratePerUnit = halfDayBase;
    quantity = 1;
    badgeColor = isWk ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300';
  } else if (cat.category === 'HALF_DAY_PLUS_HOURLY') {
    // 5.01 - 6.00 ชม.: คิดราคาแบบครึ่งวัน + รายชั่วโมง 1 ชม.
    ratePerUnit = halfDayBase + hourlyBase;
    quantity = 1;
    badgeColor = 'bg-indigo-50 text-indigo-900 border-indigo-300';
  } else if (cat.category === 'FULL_DAY') {
    // 6.01 - 10.00 ชม.: คิดราคาแบบเต็มวัน (Full Day Rate)
    ratePerUnit = fullDayBase;
    quantity = 1;
    badgeColor = isWk ? 'bg-orange-50 text-orange-900 border-orange-300' : 'bg-blue-50 text-blue-900 border-blue-300';
  } else {
    // เกิน 10 ชม.: คิดราคาแบบเต็มวัน + รายชั่วโมงส่วนเกิน
    const extraH = ceilHours - 10;
    ratePerUnit = fullDayBase + (extraH * hourlyBase);
    quantity = 1;
    badgeColor = 'bg-rose-50 text-rose-900 border-rose-300';
  }

  const floorLabel = room.floor ? ` ${room.floor}` : '';
  const formattedDescription = `ค่าเช่าห้อง ${room.name}${floorLabel}`;

  return {
    category: cat.category,
    categoryName: cat.categoryName,
    badgeColor,
    unit: cat.unit,
    quantity,
    ratePerUnit,
    totalRate: quantity * ratePerUnit,
    dayInfo,
    formattedDescription,
    ruleExplanation: `${cat.ruleExplanation} (${dayInfo.label})`,
  };
}

/**
 * Parse time range string like "12:00 - 18:00" or "12.00-18.00" to number of hours (e.g. 6)
 */
export function parseTimeRangeStringToHours(timeStr: string): number {
  if (!timeStr) return 0;
  // Normalize dots into colons for hours:minutes format (e.g. 12.00 -> 12:00)
  const normalized = timeStr.replace(/(\d{1,2})\.(\d{2})/g, '$1:$2');
  const matches = normalized.match(/(\d{1,2}:\d{2})\s*[-–—to至]\s*(\d{1,2}:\d{2})/i);
  if (matches && matches[1] && matches[2]) {
    return parseHoursBetween(matches[1], matches[2]);
  }
  // If plain number of hours e.g. "2.01" or "6" or "6 ชม"
  const numMatch = timeStr.match(/^(\d+(\.\d+)?)/);
  if (numMatch) {
    const rawVal = Number(numMatch[1]) || 0;
    return Math.ceil(rawVal);
  }
  return 0;
}

/**
 * Parse hours from start and end time (e.g., '08:00', '12:00' -> 4)
 * เศษของนาทีให้ปัดขึ้นเป็น 1 ชั่วโมงเสมอ (เช่น 2.01 ชม. -> 3 ชม.)
 */
export function parseHoursBetween(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;

  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;
  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes <= 0) return 0;

  // ปัดเศษนาทีขึ้นเป็น 1 ชั่วโมงเต็มเสมอ
  return Math.ceil(diffMinutes / 60);
}

/**
 * Get distinct floors available in room catalog sorted in order
 */
export function getAvailableFloors(catalog: RoomCatalogItem[]): string[] {
  const floorSet = new Set<string>();
  // Official standard KX order from Catalog
  const standardFloors = [
    'FL.7',
    'FL.8',
    'FL.7+8',
    'FL.9',
    'FL.10',
    'FL.11',
    'FL.12',
    'FL.13',
    'FL.17',
  ];
  
  catalog.forEach((item) => {
    if (item.floor && item.floor.trim()) {
      floorSet.add(item.floor.trim());
    }
  });

  const result: string[] = [];
  standardFloors.forEach((f) => {
    if (floorSet.has(f)) {
      result.push(f);
      floorSet.delete(f);
    }
  });

  // Add any custom or remaining floors
  Array.from(floorSet).sort().forEach((f) => result.push(f));
  return result.length > 0 ? result : standardFloors;
}
