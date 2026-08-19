/**
 * Format integer to Indonesian Rupiah currency format
 * Example: 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s+/g, " ");
}

/**
 * Parse string or formatted Rupiah back into integer
 */
export function parseRupiah(value: string): number {
  const clean = value.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Format date to Indonesian locale readable date time
 */
export function formatTanggal(dateString: string | Date | undefined | null): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format username kasir ke email auth internal
 */
export function formatStaffEmail(username: string): string {
  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
  return `${cleanUsername}@pegawai.tokojajanan.local`;
}
