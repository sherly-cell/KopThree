import { NextResponse } from "next/server";
// 🟢 PERBAIKI BARIS INI: Tambah ../ jadi 3 kali biar beneran sampe ke folder src
import { db } from "../../../config/firebase"; 
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  // ... sisa kode di bawahnya biarin tetep sama ya, Bro ...
  try {
    const body = await request.json();
    
    // 1. Ambil data krusial yang dikirim oleh Midtrans
    const { order_id, transaction_status, status_code } = body;

    console.log(`Log Midtrans Masuk: Order ID ${order_id} statusnya ${transaction_status}`);

    // Referensi dokumen pesanan di Firestore berdasarkan order_id
    const orderRef = doc(db, "orders", order_id);

    // 2. Filter Status Pembayaran
    if (transaction_status === "settlement" || transaction_status === "capture") {
      // 🟢 Jika pembayaran sukses/berhasil diceklis sistem
      await updateDoc(orderRef, {
        status_pembayaran: "SUCCESS",
        updatedAt: new Date().toISOString(),
      });
      console.log(`🔥 Firestore Sukses Di-update: Order ${order_id} BERHASIL LUNAS!`);
      
    } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
      // 🔴 Jika pembayaran kedaluwarsa atau dibatalkan pelanggan
      await updateDoc(orderRef, {
        status_pembayaran: "FAILED",
        updatedAt: new Date().toISOString(),
      });
      console.log(`❌ Firestore Sukses Di-update: Order ${order_id} GAGAL/EXPIRED.`);
    }

    // 3. Kirim respon balik ke Midtrans bahwa laporan sudah lu terima dengan baik
    return NextResponse.json({ message: "Webhook Kopthree Berhasil Diproses" }, { status: 200 });

  } catch (error) {
    console.error("Eror di Webhook Midtrans:", error);
    return NextResponse.json({ error: "Terjadi gangguan server internal" }, { status: 500 });
  }
}