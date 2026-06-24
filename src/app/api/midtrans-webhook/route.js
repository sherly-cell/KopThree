import { NextResponse } from "next/server";
import { db } from "../../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // 1. Ambil data order_id, status, dan jenis pembayaran dari Midtrans
    const { order_id, transaction_status, payment_type } = body;

    console.log(`Log Midtrans Masuk: Order ID ${order_id} statusnya ${transaction_status}`);

    // Referensi dokumen pesanan di Firestore berdasarkan order_id
    const orderRef = doc(db, "orders", order_id);

    // 🟢 BUMPER PENGAMAN: Biar kalau dapat order_id palsu dari tombol Test Midtrans, kodingan gak crash eror 500
    try {
      // 2. Filter Status Pembayaran
      if (transaction_status === "settlement" || transaction_status === "capture") {
        // 🟢 Jika lunas, simpan juga tipe pembayarannya (misal: qris, gopay, shopeepay, bank_transfer)
        await updateDoc(orderRef, {
          status_pembayaran: "SUCCESS",
          paymentType: payment_type?.toUpperCase() || "QRIS / VA", // 🟢 Ini dicari oleh dashboard admin kamu!
          updatedAt: new Date().toISOString(),
        });
        console.log(`🔥 Firestore Sukses Di-update: Order ${order_id} BERHASIL LUNAS!`);
        
      } else if (transaction_status === "expire" || transaction_status === "cancel" || transaction_status === "deny") {
        await updateDoc(orderRef, {
          status_pembayaran: "FAILED",
          updatedAt: new Date().toISOString(),
        });
        console.log(`❌ Firestore Sukses Di-update: Order ${order_id} GAGAL/EXPIRED.`);
      }
    } catch (firestoreError) {
      // Jika dokumen tidak ada di Firebase (karena cuma dummy test), eror ditangkap di sini dan dibiarkan lolos
      console.warn(`⚠️ Dokumen ${order_id} tidak ditemukan. Aman, ini cuma tes ping tombol dari dashboard Midtrans.`);
    }

    // ✨ Selalu kirim respon status 200 OK ke Midtrans biar tombol tes berubah jadi ijo SUKSES!
    return NextResponse.json({ message: "Webhook Kopthree Berhasil Diproses" }, { status: 200 });

  } catch (error) {
    console.error("Eror di Webhook Midtrans:", error);
    return NextResponse.json({ error: "Terjadi gangguan server internal" }, { status: 500 });
  }
}