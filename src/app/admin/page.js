"use client";
import { useState, useEffect } from "react";
import { db } from "../../config/firebase"; 
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function AdminDashboard() {
  // State untuk Form Input sesuai Schema Asli Firebase
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("blend");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [origin, setOrigin] = useState("");
  const [notes, setNotes] = useState(""); // Input teks dipisah koma
  
  // State untuk Matriks Rasa (Skala 1 - 5)
  const [acidity, setAcidity] = useState(3);
  const [body, setBody] = useState(3);
  const [strength, setStrength] = useState(3);
  const [sweetness, setSweetness] = useState(3);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!name || !price || !image || !description || !origin || !tagline) {
        throw new Error("Semua field utama wajib diisi, Bro!");
      }

      // Mengubah teks koma menjadi Array Notes bersih
      const notesArray = notes 
        ? notes.split(",").map(n => n.trim()).filter(Boolean) 
        : [];

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
        createdAt: new Date().toISOString(),
      });

      setMessage("✅ Mantap! Seduhan baru berhasil disuntik ke katalog Kopthree!");
      
      // Reset Form
      setName(""); setPrice(""); setImage(""); setDescription(""); setTagline(""); setOrigin(""); setNotes("");
      setAcidity(3); setBody(3); setStrength(3); setSweetness(3);
      
      fetchProducts();
    } catch (error) {
      setMessage(`❌ Eror: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Yakin mau menghapus menu kopi premium ini dari katalog, Bro?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setMessage("🗑️ Produk berhasil dihapus dari sistem.");
        fetchProducts();
      } catch (error) {
        setMessage(`❌ Gagal menghapus: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-neutral-900 pb-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-wider text-amber-500 uppercase">KOPTHREE ADMIN</h1>
            <p className="text-xs text-neutral-400 mt-1">Ruang kendali rahasia owner untuk manajemen menu dan spesifikasi rasa kopi.</p>
          </div>
          <a href="/" className="text-xs border border-neutral-800 bg-neutral-900 px-4 py-2 rounded-sm hover:border-amber-500 hover:text-amber-400 transition-all uppercase tracking-widest font-bold">
            ← Kembali ke Toko
          </a>
        </div>

        {message && (
          <div className="p-4 bg-neutral-900 border border-neutral-800 text-sm font-medium tracking-wide text-neutral-200 rounded-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM INPUT COMPONENT */}
          <div className="bg-neutral-900 border border-neutral-800/60 p-6 rounded-sm h-fit space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-2">Tambah Menu Kopi</h2>
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
                  <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500">
                    <option value="blend">Blend</option>
                    <option value="single-origin">Single Origin</option>
                    <option value="cold-brew">Cold Brew</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Origin (Asal Biji)</label>
                  <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Sumatra & Gayo" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Tagline</label>
                <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Bold & Heavy Espresso Blend" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-[9px] text-amber-500 uppercase tracking-widest font-bold mb-1">Flavor Notes (Pisah Koma)</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dark Chocolate, Smoky Oak, Molasses" className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" />
              </div>

              {/* INDIKATOR METRIKS RASA (SLIDER) */}
              <div className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-sm space-y-2">
                <span className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold border-b border-neutral-900 pb-1">Profil Rasa (Skala 1-5)</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] text-neutral-500">Strength ({strength})</label>
                    <input type="range" min="1" max="5" value={strength} onChange={(e) => setStrength(e.target.value)} className="w-full accent-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-500">Body ({body})</label>
                    <input type="range" min="1" max="5" value={body} onChange={(e) => setBody(e.target.value)} className="w-full accent-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-500">Acidity ({acidity})</label>
                    <input type="range" min="1" max="5" value={acidity} onChange={(e) => setAcidity(e.target.value)} className="w-full accent-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-neutral-500">Sweetness ({sweetness})</label>
                    <input type="range" min="1" max="5" value={sweetness} onChange={(e) => setSweetness(e.target.value)} className="w-full accent-amber-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">URL Link Foto</label>
                <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Deskripsi Menu</label>
                <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Espresso roast dengan cita rasa..." className="w-full bg-neutral-950 border border-neutral-800 p-2 text-xs rounded-sm text-white focus:outline-none focus:border-amber-500 resize-none"></textarea>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-black text-xs tracking-widest py-3 rounded-sm uppercase transition-all">
                {loading ? "Menyuntik Data..." : "Suntik ke Katalog"}
              </button>
            </form>
          </div>

          {/* TABEL VIEW COMPONENT */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800/60 p-6 rounded-sm">
            <h2 className="text-lg font-black uppercase tracking-wider text-white mb-4 border-b border-neutral-800 pb-2">Daftar Menu Aktif ({products.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-2">Menu Kopi</th>
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Matriks (S/B/A/Sw)</th>
                    <th className="py-3 px-2">Harga</th>
                    <th className="py-3 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-950/40 transition-colors">
                      <td className="py-4 px-2 flex items-center space-x-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-sm border border-neutral-800" />
                        <div>
                          <span className="font-bold text-white uppercase block">{product.name}</span>
                          <span className="text-[9px] text-neutral-500 block max-w-xs truncate">{product.tagline}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 uppercase font-mono text-amber-500/80">{product.category}</td>
                      <td className="py-4 px-2 font-mono text-[10px] text-neutral-400">
                        {product.strength || 0}/{product.body || 0}/{product.acidity || 0}/{product.sweetness || 0}
                      </td>
                      <td className="py-4 px-2 font-mono">Rp {product.price?.toLocaleString("id-ID")}</td>
                      <td className="py-4 px-2 text-center">
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-[10px] font-bold bg-neutral-950 border border-neutral-800 text-red-400 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-sm uppercase transition-all">
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
      </div>
    </div>
  );
}