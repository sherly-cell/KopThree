import { NextResponse } from "next/server";
import { db } from "../../../config/firebase"; // Import database cloud Kopthree
import { doc, setDoc } from "firebase/firestore"; // Import metode penulisan dokumen baru

export async function POST(request) {
  try {
    // 0. Tangkap kiriman parameter komplit dari frontend keranjang kamu
    const { 
      cart, 
      userEmail, 
      orderType, 
      orderNotes, 
      tableNumber, 
      pickupTime, 
      deliveryFee, 
      cartTotal 
    } = await request.json();

    // 1. Tata ulang isi keranjang sesuai format kemauan Midtrans
    const item_details = cart.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    }));

    // 🟢 SUNTIKAN ONGKIR: Jika user memilih delivery, daftarkan ongkir sebagai item produk di rincian Midtrans
    if (deliveryFee > 0) {
      item_details.push({
        id: "shipping-fee",
        price: deliveryFee,
        quantity: 1,
        name: "Ongkos Kirim (Delivery)",
      });
    }

    // 3. Buat ID unik untuk nota pesanan resmi Kopthree
    const orderId = `DEJOA-${Date.now()}`; 

    // 4. Susun payload paket data untuk dikirim ke Midtrans
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: cartTotal, // Total harga akhir yang sudah digabung ongkir dari frontend
      },
      item_details: item_details,
      customer_details: {
        email: userEmail || "pembeli.anonim@dejoacoffee.com",
      },
      custom_field1: `TIPE: ${orderType?.toUpperCase() || "DINE-IN"}`,
      custom_field2: `NOTES: ${orderNotes || "Tidak ada catatan"}`,
    };

    // 5. Ubah Server Key menjadi Base64 untuk otentikasi keamanan header
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const tokenBase64 = Buffer.from(`${serverKey}:`).toString("base64");

    // 6. Tembak data ke Server Midtrans Sandbox
    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${tokenBase64}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Gagal membuat transaksi ke Midtrans");
    }

    // 🟢 7. PENYIMPANAN NOTA REALTIME: Amblas data pesanan awal ke Firestore
    // Struktur ini disesuaikan 100% dengan kebutuhan tabel dashboard admin kamu
    await setDoc(doc(db, "orders", orderId), {
      id: orderId,
      userEmail: userEmail || "Guest / Walk-in",
      cart: cart,
      orderType: orderType || "dine-in",
      orderNotes: orderNotes || "-",
      tableNumber: orderType === "dine-in" ? tableNumber : null, // Ada isinya jika dine-in
      pickupTime: orderType === "takeaway" ? pickupTime : null,   // Ada isinya jika takeaway
      deliveryFee: deliveryFee || 0,
      cartTotal: cartTotal, 
      status_pembayaran: "PENDING", // Menunggu respon webhook dari pelunasan user
      status_pesanan: "PENDING",    // Status awal antrean seduh barista
      createdAt: new Date().toISOString(),
    });

    // Kirim token pembayaran kembali ke frontend website kamu
    return NextResponse.json({ token: data.token });

  } catch (error) {
    console.error("Midtrans API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}