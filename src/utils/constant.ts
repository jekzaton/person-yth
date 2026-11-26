// src/utils/constant.ts

export const APP_CONFIG = Object.freeze({
  name: "ระบบบริหารจัดการบุคลากรโรงพยาบาล",
  nameEn: "Personnel Management System",

  organization: "โรงพยาบาลยางตลาด",
  developer: "TonThanatnin",

  version: "1.0",
  releaseYear: 2026,

  copyright: "© 2026 โรงพยาบาลยางตลาด",

  credit: "Developed by TonThanatnin",

  security: {
    enabled: true,
    warningTitle: "ตรวจพบการเปลี่ยนแปลงข้อมูลระบบ",
    warningMessage:
      "ตรวจพบการเปลี่ยนแปลงข้อความเครดิตของระบบโดยไม่ผ่านกระบวนการที่กำหนด กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบ",
  },
} as const);

export const APP_CREDIT_SIGNATURE = [
  APP_CONFIG.organization,
  APP_CONFIG.developer,
  `Version ${APP_CONFIG.version}`,
].join(" | ");
