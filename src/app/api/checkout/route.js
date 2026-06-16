import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 0. Tangkap data tambahan (orderType & orderNotes) dari frontend
    const { cart, userEmail, orderType, orderNotes } = await request.json();

    // 1. Tata ulang isi keranjang sesuai format kemauan Midtrans
    const item_details = cart.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    }));

    // 2. Hitung total harga keseluruhan
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // 3. Buat ID unik untuk nota pesanan resmi Dejoa Coffee
    const orderId = `DEJOA-${Date.now()}`; 

    // 4. Susun payload paket data untuk dikirim ke Midtrans
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      item_details: item_details,
      customer_details: {
        email: userEmail || "pembeli.anonim@dejoacoffee.com",
      },
      // SUNTIK OPSI PESANAN & CATATAN KE CUSTOM FIELD MIDTRANS
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

    // Kirim token pembayaran kembali ke frontend website kamu
    return NextResponse.json({ token: data.token });

  } catch (error) {
    console.error("Midtrans API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}