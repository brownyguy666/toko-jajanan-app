export type UserRole = "owner" | "pegawai";
export type PaymentMethod = "tunai" | "qris" | "transfer";
export type ExpenseCategory = "bahan baku" | "gas" | "kemasan" | "sewa" | "lainnya";

export interface Profile {
  id: string; // references auth.users.id
  nama: string;
  email: string;
  role: UserRole;
  status_aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Produk {
  id: string;
  nama: string;
  kategori: string;
  harga_jual: number;
  harga_modal: number;
  stok: number;
  foto_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Transaksi {
  id: string;
  kasir_id: string;
  tanggal: string;
  total: number;
  metode_bayar: PaymentMethod;
  created_at?: string;
  kasir?: Profile;
  items?: TransaksiItem[];
}

export interface TransaksiItem {
  id: string;
  transaksi_id: string;
  produk_id: string;
  qty: number;
  harga_saat_jual: number;
  subtotal: number;
  created_at?: string;
  produk?: Produk;
}

export interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: ExpenseCategory;
  jumlah: number;
  keterangan: string | null;
  created_at?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      produk: {
        Row: Produk;
        Insert: Omit<Produk, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Produk, "id">>;
      };
      transaksi: {
        Row: Transaksi;
        Insert: Omit<Transaksi, "id" | "created_at" | "kasir" | "items"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Transaksi, "id">>;
      };
      transaksi_item: {
        Row: TransaksiItem;
        Insert: Omit<TransaksiItem, "id" | "created_at" | "produk"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TransaksiItem, "id">>;
      };
      pengeluaran: {
        Row: Pengeluaran;
        Insert: Omit<Pengeluaran, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Pengeluaran, "id">>;
      };
    };
  };
};
