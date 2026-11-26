export function normalizeCid(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 13);
}

export function formatCid(value: string | null | undefined): string {
  const cid = normalizeCid(value);

  if (!cid) return "";

  const groups = [
    cid.slice(0, 1),
    cid.slice(1, 5),
    cid.slice(5, 10),
    cid.slice(10, 12),
    cid.slice(12, 13),
  ];

  return groups.filter(Boolean).join("-");
}

export function isValidCidLength(value: string | null | undefined): boolean {
  const cid = normalizeCid(value);

  return /^\d{13}$/.test(cid);
}

export function isValidThaiCid(value: string | null | undefined): boolean {
  const cid = normalizeCid(value);

  if (!/^\d{13}$/.test(cid)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 12; index++) {
    sum += Number(cid[index]) * (13 - index);
  }

  const checkDigit = (11 - (sum % 11)) % 10;

  return checkDigit === Number(cid[12]);
}

export function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneInput(value: string | null | undefined): string {
  const phone = normalizePhone(value);

  if (phone.length <= 3) {
    return phone;
  }

  if (phone.length <= 6) {
    return `${phone.slice(0, 3)}-${phone.slice(3)}`;
  }

  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
}

export function formatPhone(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const phone = String(value).replace(/\D/g, "");

  if (!/^\d{10}$/.test(phone)) {
    return "-";
  }

  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";

  let date: Date;
  let timeZone = "Asia/Bangkok";

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      date = new Date(Date.UTC(year, month - 1, day));

      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
      ) {
        return "-";
      }

      timeZone = "UTC";
    } else {
      date = new Date(value);
    }
  } else {
    date = value;
  }

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function dateText(value: string | Date | null | undefined): string {
  if (!value) return "-";

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    const raw = value.trim();
    if (!raw) return "-";

    // กรณี MySQL DATETIME ไม่มี timezone:
    // ถือว่าเป็นเวลาท้องถิ่นประเทศไทย
    const mysqlDateTime =
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)$/;

    const match = raw.match(mysqlDateTime);

    date = match ? new Date(`${match[1]}T${match[2]}+07:00`) : new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function dateTextMysqlThai(
  value: string | Date | null | undefined,
): string {
  if (!value) return "-";

  const raw =
    value instanceof Date ? value.toISOString() : String(value).trim();

  if (!raw) return "-";

  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)/,
  );

  if (!match) return "-";

  // อ่านเวลาตามชั่วโมงที่เก็บใน MySQL
  // โดยไม่เพิ่ม UTC+7 ซ้ำ
  const date = new Date(`${match[1]}T${match[2]}+07:00`);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
