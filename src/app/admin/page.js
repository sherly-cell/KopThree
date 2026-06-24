"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "../../config/firebase"; // Menghubungkan ke config cloud Firebase kamu
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore"; 
import { sendPasswordResetEmail } from "firebase/auth"; 

export default function AdminDashboard() {
  // --- STATE MENU UTAMA DASHBOARD ---
  const [activeTab, setActiveTab] = useState("orders"); 
  const [loading, setLoading] = useState(false); 
  const [message, setMessage] = useState(""); 

  // --- DATA FROM FIRESTORE ---
  const [products, setProducts] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [users, setUsers] = useState([]); 

  // --- STATE FORM INPUT PRODUK (BAWAAN LU + KUSTOMISASI SINKRON) ---
  const [name, setName] = useState(""); 
  const [price, setPrice] = useState(""); 
  const [category, setCategory] = useState("blend"); // Default diubah ke 'blend' agar selaras dengan filter depan
  const [image, setImage] = useState(""); 
  const [description, setDescription] = useState(""); 
  const [tagline, setTagline] = useState(""); 
  const [origin, setOrigin] = useState(""); 
  const [notes, setNotes] = useState(""); 
  const [stock, setStock] = useState(10); 
  
  // Fitur Sakelar Kustomisasi Rasa Produk
  const [allowLessCoffee, setAllowLessCoffee] = useState(true); 
  const [allowLessSweet, setAllowLessSweet] = useState(true); 
  
  // State Matriks Profil Rasa Bawaan Lu
  const [acidity, setAcidity] = useState(3); 
  const [body, setBody] = useState(3); 
  const [strength, setStrength] = useState(3); 
  const [sweetness, setSweetness] = useState(3); 

  // --- FUNGSI AMBIL ALL DATA DARI CLOUD ---
  const fetchAllDashboardData = async () => {
    try {
      // 1. Ambil Data Produk
      const productSnapshot = await getDocs(collection(db, "products")); 
      setProducts(productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 

      // 2. Ambil Data Pesanan
      const orderSnapshot = await getDocs(collection(db, "orders")); 
      const orderData = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
      setOrders(orderData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); 

      // 3. Ambil Data Log Login User
      const userSnapshot = await getDocs(collection(db, "users")); 
      setUsers(userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    } catch (error) {
      console.error("Gagal sinkronisasi data dashboard:", error);
    }
  };

  useEffect(() => {
    fetchAllDashboardData(); 
  }, []);

  // --- AKSES 1: SUNTIK PRODUK BARU DENGAN TOGGLE RASA ---
  const handleAddProduct = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setMessage(""); 

    try {
      if (!name || !price || !image || !description || !origin || !tagline) {
        throw new Error("Semua field utama wajib diisi, Bro!"); 
      }

      const notesArray = notes ? notes.split(",").map(n => n.trim()).filter(Boolean) : []; 

      // Mengirim paket data produk lengkap ke Firestore
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price), 
        category,             
        image, 
        description, 
        tagline, 
        origin, 
        notes: notesArray, 
        acidity: Number(acidity), 
        body: Number(body), 
        strength: Number(strength), 
        sweetness: Number(sweetness), 
        stock: Number(stock), 
        allowLessCoffee,      
        allowLessSweet,       
        createdAt: new Date().toISOString(), 
      });

      setMessage("✅ Mantap! Seduhan baru dengan konfigurasi rasa berhasil disuntik ke katalog Kopthree!"); 
      
      // Reset Form Pengisian
      setName(""); setPrice(""); setImage(""); setDescription(""); setTagline(""); setOrigin(""); setNotes(""); setStock(10); 
      setAllowLessCoffee(true); setAllowLessSweet(true); 
      setAcidity(3); setBody(3); setStrength(3); setSweetness(3); 
      
      fetchAllDashboardData(); 
    } catch (error) {
      setMessage(`❌ Eror: ${error.message}`); 
    } finally {
      setLoading(false); 
    }
  };

  // --- AKSES 2: PERBARUI JUMLAH STOK GUDANG VIA ONBLUR ---
  const handleUpdateStock = async (id, newStock) => {
    try {
      await updateDoc(doc(db, "products", id), { stock: Number(newStock) }); 
      setMessage("📋 Stok gudang berhasil diperbarui di server cloud."); 
      fetchAllDashboardData(); 
    } catch (error) {
      setMessage(`❌ Gagal update stok: ${error.message}`); 
    }
  };

  // --- AKSES 3: HAPUS PRODUK DARI KATALOG TOKO ---
  const handleDeleteProduct = async (id) => {
    if (confirm("Yakin mau menghapus menu kopi premium ini dari katalog, Bro?")) { 
      try {
        await deleteDoc(doc(db, "products", id)); 
        setMessage("🗑️ Produk berhasil dihapus dari sistem."); 
        fetchAllDashboardData(); 
      } catch (error) {
        setMessage(`❌ Gagal menghapus: ${error.message}`); 
      }
    }
  };

  // --- ☕ AKSES 4: VERIFIKASI MANUAL & POTONG STOK GUDANG OTOMATIS ---
  const handleUpdateOrderStatus = async (orderId, currentStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);

      if (currentStatus === "DIPROSES") {
        // TAHAP 2: Selesai Seduh
        await updateDoc(orderRef, { 
          status_pesanan: "SELESAI",
          updatedAt: new Date().toISOString()
        });
        setMessage(`🎉 Sukses! Kopi pada Order ID ${orderId} selesai diseduh.`);
      } else {
        // TAHAP 1: Mulai Seduh (Bypass Lunas + POTONG STOK)
        await updateDoc(orderRef, { 
          status_pembayaran: "SUCCESS",
          status_pesanan: "DIPROSES",
          updatedAt: new Date().toISOString()
        });

        // 📉 Radar Pemotong Stok Otomatis sesuai jumlah kuantitas pesanan
        const targetOrder = orders.find(o => o.id === orderId);
        if (targetOrder && targetOrder.cart) {
          for (const item of targetOrder.cart) {
            const productRef = doc(db, "products", item.id);
            await updateDoc(productRef, {
              stock: increment(-item.quantity) // Otomatis mengurangi stok di Firebase
            });
          }
        }
        setMessage(`☕ Sukses! Order ID ${orderId} diverifikasi lunas & stok gudang otomatis berkurang.`);
      }

      fetchAllDashboardData(); 
    } catch (error) {
      setMessage(`❌ Gagal mengubah alur antrean: ${error.message}`);
    }
  };

  // --- AKSES 5: PICU RESET PASSWORD AKUN PELANGGAN ---
  const handleAccountRecovery = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email); 
      alert(`🔐 Link recovery password otomatis dikirim ke email: ${email}`); 
    } catch (error) {
      alert(`❌ Gagal recovery akun: ${error.message}`); 
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-8 font-sans"> 
      <div className="max-w-7xl mx-auto space-y-8"> 
        
        {/* HEADER UTAMA DASHBOARD COMAND HQ */}
        <div className="border-b border-neutral-900 pb-5 flex flex-col md:flex-row justify-between items-center gap-4"> 
          <div>
            <h1 className="text-3xl font-black tracking-wider text-amber-500 uppercase">KOPTHREE COMMAND HQ</h1> 
            <p className="text-xs text-neutral-400 mt-1">Sistem kendali terpadu: Akun User, Alur Kasir Midtrans, dan Stok Gudang Kopi.</p> 
          </div>
          
          {/* TAB NAVIGASI SISTEM UTAMA */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-sm font-bold tracking-wider text-xs uppercase"> 
            <button onClick={() => setActiveTab("orders")} className={`px-4 py-2 rounded-sm transition-all ${activeTab === "orders" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}>
               PESANAN ({orders.length}) 
            </button>
            <button onClick={() => setActiveTab("products")} className={`px-4 py-2 rounded-sm transition-all ${activeTab === "products" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}>
               KATALOG & STOK ({products.length}) 
            </button>
            <button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded-sm transition-all ${activeTab === "users" ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:text-white"}`}>
               USER LOGIN ({users.length}) 
            </button>
          </div>
        </div>

        {/* NOTIFIKASI BANNER */}
        {message && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 text-xs font-mono text-amber-400 rounded-sm animate-pulse"> 
            {message}
          </div>
        )}

        {/* ================= AREA TABEL PESANAN REALTIME ================= */}
        {activeTab === "orders" && (
          <div className="space-y-4"> 
            <h2 className="text-base font-black uppercase text-white border-l-4 border-amber-500 pl-2">Alur Pembayaran & Antrean Seduh Realtime</h2> 
            <div className="overflow-x-auto border border-neutral-900 rounded-lg"> 
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-900 text-neutral-400 uppercase font-bold tracking-wider border-b border-neutral-800 text-[10px]"> 
                    <th className="p-4">Waktu & Order ID</th> 
                    <th className="p-4">Pelanggan</th> 
                    <th className="p-4">Produk + Qty</th> 
                    <th className="p-4">Metode & Meja/Ongkir/Jam</th>
                    <th className="p-4">Bayar Pakai App</th> 
                    <th className="p-4">Status Transaksi</th> 
                    <th className="p-4">Total Tagihan</th> 
                    <th className="p-4 text-center">Aksi Barista</th> 
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 bg-neutral-950"> 
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-900/20 transition-colors"> 
                      <td className="p-4 font-mono text-neutral-400"> 
                        <span className="block text-white font-sans font-medium">{order.createdAt ? new Date(order.createdAt).toLocaleString("id-ID") : "-"}</span> 
                        <span className="text-[10px] text-neutral-600 block mt-0.5">{order.id}</span> 
                      </td>
                      <td className="p-4 font-semibold text-neutral-300">{order.userEmail || "Guest / Walk-in"}</td> 
                      <td className="p-4"> 
                        {order.cart?.map((item, index) => (
                          <div key={index} className="text-amber-500 font-medium text-xs">
                            • {item.name} <span className="text-neutral-400 font-mono text-[10px]">({item.quantity}x)</span> 
                          </div>
                        ))}
                      </td>
                      <td className="p-4 space-y-1"> 
                        <span className={`inline-block px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase ${order.orderType === "delivery" ? "bg-blue-950 text-blue-400 border border-blue-900" : "bg-neutral-900 text-neutral-400"}`}>
                          {order.orderType} 
                        </span>
                        {order.orderType === "dine-in" && <span className="block text-[11px] text-amber-500 font-bold">Meja {order.tableNumber || "Bebas"}</span>} 
                        {order.orderType === "delivery" && <span className="block text-[11px] text-blue-400 font-medium">Ongkir +Rp 10.000</span>}
                        {order.orderType === "takeaway" && <span className="block text-[11px] text-purple-400 font-medium">Jam Ambil: {order.pickupTime || "Secepatnya"}</span>}
                        <p className="text-[10px] text-neutral-500 italic max-w-[150px] truncate">{order.orderNotes || "-"}</p> 
                      </td>
                      <td className="p-4 font-mono text-neutral-300 uppercase">{order.paymentType || "QRIS / VA Simulator"}</td> 
                      <td className="p-4"> 
                        <span className={`px-2 py-0.5 rounded-sm font-black text-[10px] uppercase tracking-wider ${
                          order.status_pembayaran === "SUCCESS" ? "bg-green-950 text-green-400 border border-green-900" : "bg-amber-950 text-amber-500 border border-amber-900"
                        }`}>
                          {order.status_pembayaran || "PENDING"} 
                        </span>
                      </td>
                      <td className="p-4 font-bold font-mono text-white text-sm"> 
                        Rp {(order.cartTotal || order.totalPrice || 0).toLocaleString("id-ID")} 
                      </td>
                      
                      <td className="p-4 text-center"> 
                        {order.status_pesanan === "SELESAI" ? (
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-sm uppercase tracking-wider block text-center">
                            🏁 Transaksi Beres
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, order.status_pesanan)} 
                            className={`w-full text-[10px] font-bold px-2.5 py-1.5 rounded-sm transition-all uppercase tracking-wide text-center border ${
                              order.status_pesanan === "DIPROSES" 
                                ? "bg-blue-950 border-blue-900 text-blue-400 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-500" 
                                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-500"
                            }`}
                          >
                            {order.status_pesanan === "DIPROSES" ? "✔️ Selesai Seduh" : "☕ Mulai Seduh"} 
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= AREA MANAGEMENT GUDANG PRODUK ================= */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> 
            {/* Form Input Tambah Menu Kopi Premium */}
            <div className="bg-neutral-900 border border-neutral-800/60 p-6 rounded-sm h-fit space-y-4"> 
              <h2 className="text-base font-black uppercase text-white border-b border-neutral-800 pb-2">Tambah Menu Kopi</h2> 
              <form onSubmit={handleAddProduct} className="space-y-4"> 
                <div className="grid grid-cols-2 gap-3"> 
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Nama Produk</label> 
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="BLACK OBSIDIAN" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Harga (Rp)</label> 
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="85000" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3"> 
                  <div>
                    <label className="block text-[9px] text-amber-500 uppercase tracking-widest font-bold mb-1">Kategori Tipe Kopi</label> 
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-amber-500 font-bold focus:outline-none focus:border-amber-500"> 
                      <option value="blend">Signature Blend</option> 
                      <option value="single-origin">Single Origin</option> 
                      <option value="cold-brew">Cold Brew</option> 
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Stok Awal</label> 
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                  </div>
                </div>

                {/* AKSES MODIFIKASI MENU */}
                <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-sm space-y-2"> 
                  <span className="block text-[9px] text-neutral-400 uppercase font-bold tracking-wider">Akses Modifikasi Menu</span> 
                  <div className="flex items-center justify-between text-xs pt-1"> 
                    <label className="flex items-center space-x-2 cursor-pointer"> 
                      <input type="checkbox" checked={allowLessCoffee} onChange={(e) => setAllowLessCoffee(e.target.checked)} className="accent-amber-500 h-3.5 w-3.5" /> 
                      <span className="text-[11px] text-neutral-300">Bisa Less Coffee</span> 
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer"> 
                      <input type="checkbox" checked={allowLessSweet} onChange={(e) => setAllowLessSweet(e.target.checked)} className="accent-amber-500 h-3.5 w-3.5" /> 
                      <span className="text-[11px] text-neutral-300">Bisa Less Sweet</span> 
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3"> 
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Origin (Asal Biji)</label> 
                    <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Sumatra & Gayo" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Tagline</label> 
                    <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Bold & Heavy Espresso" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Flavor Notes (Koma)</label> 
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dark Chocolate, Smoky Oak" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                </div>

                {/* INDIKATOR MATRIX RASA BAWAAN LU */}
                <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-sm space-y-2"> 
                  <span className="block text-[9px] text-neutral-500 uppercase font-bold tracking-wider">Indikator Karakter Kopi</span> 
                  <div className="grid grid-cols-2 gap-2 text-[10px]"> 
                    <div>Strength ({strength}) <input type="range" min="1" max="5" value={strength} onChange={(e) => setStrength(e.target.value)} className="w-full accent-amber-500" /></div> 
                    <div>Body ({body}) <input type="range" min="1" max="5" value={body} onChange={(e) => setBody(e.target.value)} className="w-full accent-amber-500" /></div> 
                    <div>Acidity ({acidity}) <input type="range" min="1" max="5" value={acidity} onChange={(e) => setAcidity(e.target.value)} className="w-full accent-amber-500" /></div> 
                    <div>Sweetness ({sweetness}) <input type="range" min="1" max="5" value={sweetness} onChange={(e) => setSweetness(e.target.value)} className="w-full accent-amber-500" /></div> 
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">URL Link Foto</label> 
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" /> 
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Deskripsi Menu</label> 
                  <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500 resize-none"></textarea> 
                </div>

                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-black text-xs tracking-widest py-3 rounded-sm uppercase transition-all"> 
                  {loading ? "Menyuntik Data..." : "Suntik ke Katalog"} 
                </button>
              </form>
            </div>

            {/* View Daftar Kopi & Kontrol Update Stok */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800/60 p-6 rounded-sm space-y-4"> 
              <h2 className="text-base font-black uppercase text-white border-b border-neutral-800 pb-2">Daftar Gudang Menu Aktif ({products.length})</h2> 
              <div className="overflow-x-auto"> 
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-2">Menu Kopi</th> 
                      <th className="py-3 px-2">Kategori</th> 
                      <th className="py-3 px-2">Akses Kustomisasi Rasa</th>
                      <th className="py-3 px-2">Gudang Stok</th> 
                      <th className="py-3 px-2">Harga</th> 
                      <th className="py-3 px-2 text-center">Aksi</th> 
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50"> 
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-950/40 transition-colors"> 
                        <td className="py-3 px-2 flex items-center space-x-2"> 
                          <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded-sm border border-neutral-800" /> 
                          <span className="font-bold text-white uppercase">{product.name}</span> 
                        </td>
                        <td className="py-3 px-2 uppercase font-mono text-amber-500 text-[11px] font-bold">{product.category || "blend"}</td> 
                        
                        <td className="py-3 px-2 text-[10px] space-y-0.5"> 
                          <div className={product.allowLessCoffee ? "text-green-400 font-medium" : "text-neutral-600 line-through"}> 
                            • Kopi: {product.allowLessCoffee ? "Normal / Less Coffee" : "Kunci/Murni"} 
                          </div>
                          <div className={product.allowLessSweet ? "text-green-400 font-medium" : "text-neutral-600 line-through"}> 
                            • Gula: {product.allowLessSweet ? "Normal / Less Sweet" : "Tanpa Gula Flat"} 
                          </div>
                        </td>

                        <td className="py-3 px-2"> 
                          <input 
                            type="number" 
                            defaultValue={product.stock || 0} 
                            onBlur={(e) => handleUpdateStock(product.id, e.target.value)} 
                            className="w-14 bg-neutral-950 border border-neutral-800 text-center font-bold text-white text-xs py-1 outline-none rounded-sm focus:border-amber-500"
                          />
                          <span className="block text-[9px] text-neutral-600 text-center mt-1 uppercase tracking-wider font-semibold">Auto-Save</span>
                        </td>
                        <td className="py-3 px-2 font-mono">Rp {product.price?.toLocaleString("id-ID")}</td> 
                        <td className="py-3 px-2 text-center"> 
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-[9px] font-bold border border-neutral-800 bg-neutral-950 text-red-400 hover:text-white hover:bg-red-600 px-2 py-1 rounded-sm uppercase transition-all"> 
                            Hapus 
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= AREA LOG DATABASE USER ================= */}
        {activeTab === "users" && (
          <div className="space-y-4"> 
            <h2 className="text-base font-black uppercase text-white border-l-4 border-amber-500 pl-2">Data Identitas Pendekar Kopi Terdaftar</h2> 
            <div className="overflow-x-auto border border-neutral-900 rounded-lg"> 
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-900 text-neutral-400 uppercase font-bold tracking-wider border-b border-neutral-800 text-[10px]"> 
                    <th className="p-4">Waktu Registrasi</th> 
                    <th className="p-4">Nama Lengkap</th> 
                    <th className="p-4">Alamat Email</th> 
                    <th className="p-4">No. Telp / WhatsApp</th> 
                    <th className="p-4">Otoritas Akses</th> 
                    <th className="p-4">Sistem Keamanan Akun</th> 
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 bg-neutral-950"> 
                  {users.map((user, idx) => (
                    <tr key={user.id || idx} className="hover:bg-neutral-900/20 transition-colors"> 
                      <td className="p-4 font-mono text-neutral-400">{user.joinedAt ? new Date(user.joinedAt).toLocaleString("id-ID") : "Terbawa / Manual"}</td> 
                      <td className="p-4 font-black text-white uppercase tracking-wide">{user.name || "Customer Kopthree"}</td> 
                      <td className="p-4 font-mono text-neutral-300">{user.email}</td> 
                      <td className="p-4 font-mono text-neutral-300">{user.phone || "-"}</td> 
                      <td className="p-4"> 
                        <span className="bg-green-950 text-green-400 border border-green-900 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase"> 
                          {user.role || "CUSTOMER"} 
                        </span>
                      </td>
                      <td className="p-4"> 
                        <button onClick={() => handleAccountRecovery(user.email)} className="bg-neutral-900 border border-neutral-800 hover:border-red-900 hover:text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-sm transition-all text-neutral-400 uppercase tracking-wider"> 
                          🔑 Recovery Akun (Reset PW) 
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}