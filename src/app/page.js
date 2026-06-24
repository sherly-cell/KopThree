"use client";

"use client";

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { db, auth } from "../config/firebase"; // Sudah komplit dengan auth
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// ... di bawahnya baru variabel PRODUCTS kamu
const PRODUCTS = [
  {
    id: "p1",
    name: "BLACK OBSIDIAN",
    category: "blend",
    tagline: "Bold & Heavy Espresso Blend",
    description: "Espresso roast dengan cita rasa yang kuat, tebal, dan mantap. Karakter cokelat hitam pekat dipadukan dengan aroma kayu ek yang maskulin.",
    price: 85000,
    origin: "Sumatra Mandheling & Gayo",
    strength: 5,
    acidity: 1,
    body: 5,
    sweetness: 2,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop",
    notes: ["Dark Chocolate", "Smoky Oak", "Molasses"],
  }, 
  {
    id: "p2",
    name: "GOLDEN NECTAR",
    category: "single-origin",
    tagline: "Honey Processed Single Origin",
    description: "Kopi single-origin yang diproses secara madu (honey process) untuk menghasilkan rasa manis alami madu hutan yang kompleks dan bersih.",
    price: 95000,
    origin: "Flores Bajawa Arabica",
    strength: 3,
    acidity: 3,
    body: 3,
    sweetness: 5,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop",
    notes: ["Red Honey", "Bergamot", "Brown Sugar"],
  },
  {
    id: "p3",
    name: "MIDNIGHT COLD BREW",
    category: "cold-brew",
    tagline: "16-Hour Slow Drip Signature",
    description: "Diekstraksi secara perlahan selama 16 jam dalam suhu dingin. Menghasilkan rasa yang ultra-smooth, bersih tanpa rasa pahit yang tajam.",
    price: 65000,
    origin: "Java Preanger Arabica",
    strength: 4,
    acidity: 2,
    body: 4,
    sweetness: 3,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop",
    notes: ["Cacao Nibs", "Caramel", "Red Apple"],
  },
  {
    id: "p4",
    name: "BRONZE AGE",
    category: "blend",
    tagline: "French Roast Blend",
    description: "Roasting gelap maksimal yang menonjolkan minyak esensial biji kopi. Menghasilkan crema yang kaya dan rasa pahit manis yang mewah.",
    price: 90000,
    origin: "Toraja Kalosi & Java",
    strength: 5,
    acidity: 1,
    body: 5,
    sweetness: 1,
    image: "https://images.unsplash.com/photo-151097252790b-a48177348574?q=80&w=600&auto=format&fit=crop",
    notes: ["Burnt Caramel", "Spiced Clove", "Toasted Walnut"],
  },
  {
    id: "p5",
    name: "VULCANO GAYO",
    category: "single-origin",
    tagline: "Wet Hulled Traditional Gayo",
    description: "Kopi tradisional dengan proses giling basah khas Indonesia. Menampilkan karakter rasa rempah yang kaya, herba segar, dan bodi yang penuh.",
    price: 98000,
    origin: "Aceh Gayo Highlands",
    strength: 4,
    acidity: 2,
    body: 4,
    sweetness: 2,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
    notes: ["Black Tea", "Cardamom", "Cedar Wood"],
  },
  {
    id: "p6",
    name: "AMBER DUSK",
    category: "single-origin",
    tagline: "Natural Processed Light Roast",
    description: "Bagi penikmat cita rasa buah-buahan eksotis yang kaya. Kopi natural process berkarakter asam cerah laksana buah beri matang.",
    price: 110000,
    origin: "Bali Kintamani Arabica",
    strength: 2,
    acidity: 5,
    body: 2,
    sweetness: 4,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop",
    notes: ["Blueberry", "Orange Zest", "Jasmine"],
  },
];

export default function Home() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('Dejoa PWA Service Worker Aktif!', reg.scope))
          .catch((err) => console.error('PWA Registration Gagal:', err));
      });
    }
  }, []);

  const seedDatabase = async () => {
  try {
    for (const product of PRODUCTS) {
      await setDoc(doc(db, "products", product.id), product);
    }
    alert("Sore Bro! 6 Kopi Premium Berhasil Disuntik ke Firebase! Silakan cek tab Firebase Console kamu.");
  } catch (error) {
    console.error("Gagal menyuntik data:", error);
    alert("Waduh gagal, cek konsol atau file .env.local kamu.");
  }
};
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("about");
  // State untuk menampung data asli dari cloud Firebase
  const [products, setProducts] = useState([]);

  // --- STATE UNTUK AUTHENTICATION ---
  const [user, setUser] = useState(null); // Menyimpan data user yang sedang login
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Mengatur buka/tutup pop-up
  const [authMode, setAuthMode] = useState("login"); // "login" atau "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [phone, setPhone] = useState("");
  
  // --- STATE UNTUK SHOPPING CART ---
  const [cart, setCart] = useState([]); // Menyimpan daftar kopi yang dibeli
  const [isCartOpen, setIsCartOpen] = useState(false); // Mengatur buka/tutup modal keranjang
  
  // State untuk Opsi Transaksi & Catatan Tambahan
  const [orderType, setOrderType] = useState("dine-in"); // dine-in, takeaway, delivery
  const [orderNotes, setOrderNotes] = useState("");
  
  const [tableNumber, setTableNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  // 🟢 SELIPKAN 2 STATE BARU INI, BRO:
  const [orderHistory, setOrderHistory] = useState([]); // Menampung list riwayat pesanan
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Mengatur buka/tutup modal riwayat

  // 🟢 RADAR REALTIME: Pantau perubahan status pesanan langsung dari Firestore
  useEffect(() => {
    if (!user || !user.email) {
      setOrderHistory([]);
      return;
    }

    let unsubscribe;
    const listenToUserOrders = async () => {
      const { collection, query, where, onSnapshot } = await import("firebase/firestore");
      
      // Cari dokumen di koleksi "orders" yang emailnya cocok dengan user yang sedang login
      const q = query(collection(db, "orders"), where("userEmail", "==", user.email));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Urutkan dari pesanan yang paling baru dibuat
        setOrderHistory(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      });
    };

    listenToUserOrders();
    return () => unsubscribe && unsubscribe(); // Putus koneksi radar pas user logout
  }, [user]);

  // 🟢 2. GESER POSISI HITUNGAN INI KE ATAS (Biar terbaca oleh grandTotal di bawahnya)
  // Hitung jumlah total item di keranjang secara otomatis
  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // 🟢 GANTI RUMUS LAMA DENGAN INI:
  // Hitung total harga belanjaan secara otomatis termasuk add-ons berbayar
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const addOnsTotal = (item.selectedAddOns || []).reduce((sum, addon) => sum + addon.price, 0);
      return total + ((item.price + addOnsTotal) * item.quantity);
    }, 0);
  }, [cart]);

  // Hitung otomatis biaya ongkir (jika delivery, tambah Rp 10.000)
  const deliveryFee = orderType === "delivery" ? 10000 : 0;

  // Total biaya baru yang sudah digabung ongkir (Aman dari eror)
  const grandTotal = useMemo(() => {
    return cartTotal + deliveryFee;
  }, [cartTotal, deliveryFee]);

  // Fungsi memasukkan kopi ke keranjang
  const addToCart = (product) => {
    setCart((prevCart) => {
      const isExist = prevCart.find((item) => item.id === product.id);
      if (isExist) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // 🟢 SELIPKAN FUNGSI BARU INI, BRO:
  const toggleAddOn = (productId, addonName, addonPrice) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const currentAddons = item.selectedAddOns || [];
          const exists = currentAddons.find((a) => a.name === addonName);
          
          const updatedAddons = exists
            ? currentAddons.filter((a) => a.name !== addonName) // Hapus jika di-uncheck
            : [...currentAddons, { name: addonName, price: addonPrice }]; // Tambah jika di-check
            
          return { ...item, selectedAddOns: updatedAddons };
        }
        return item;
      })
    );
  };

  // 🟢 TAMBAHKAN FUNGSI INI BIAR TOMBOL + DAN - BISA JALAN, BRO:
  const updateQuantity = (id, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQuantity = item.quantity + amount;
            // Kalau diklik minus sampe di bawah 1, otomatis hapus item dari keranjang
            return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) // Menyaring & membersihkan item yang dihapus (null)
    );
  };
  // Fungsi mengirim pesanan ke Midtrans dan membuka pop-up pembayaran
  const handleCheckout = async () => {
    // 1. PROTEKSI LOGIN  
    if (!user) {
      alert("Eits! Lu wajib masuk ruko Kopthree dulu sebelum checkout pesanan, Bro.");
      setAuthMode("login");
      setIsAuthModalOpen(true);
      setIsCartOpen(false);
      return;
    }

    // 2. JALAN PROSES KASIR MIDTRANS
    try {
      const userEmail = user.email;

      // Ambil token dari API Route dengan melampirkan parameter komplit
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cart, 
          userEmail, 
          orderType, 
          orderNotes,
          // 🟢 SUNTIK DATA BARU INI KE BACKEND:
          tableNumber: orderType === "dine-in" ? tableNumber : null,
          pickupTime: orderType === "takeaway" ? pickupTime : null,
          deliveryFee: deliveryFee,
          cartTotal: grandTotal // Kita kirim nominal grandTotal yang sudah + ongkir
        }),
      });

      const data = await response.json();

      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: function (result) {
            alert("Pembayaran Sukses! Kopi pilihanmu segera diseduh oleh barista Kopthree!");
            setCart([]);
            setOrderNotes("");
            setTableNumber(""); // 🟢 Reset meja
            setPickupTime("");  // 🟢 Reset jam ambil
            setIsCartOpen(false);
          },
          onPending: function (result) {
            alert("Pesanan pending, Bro. Segera selesaikan pembayaranmu ya!");
          },
          onError: function (result) {
            alert("Waduh, transaksi gagal. Silakan coba lagi.");
          },
          onClose: function () {
            alert("Kamu menutup rincian kasir tanpa menyelesaikan pembayaran.");
          }
        });
      } else {
        alert("Gagal mendapatkan token pembayaran. Periksa file .env.local kamu.");
      }
    } catch (error) {
      console.error("Gagal Checkout:", error);
      alert("Kasir Kopthree sedang sibuk, terjadi gangguan sistem.");
    }
  };

  // Memantau status login user secara real-time
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  // Memuat Script Midtrans Snap secara otomatis
  useEffect(() => {
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    
    const scriptExists = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (!scriptExists) {
      const script = document.createElement("script");
      script.src = snapScriptUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fungsi untuk Register (Daftar Akun Baru + Kirim Data ke Firestore)
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      // 1. Daftarkan akun utama ke sistem Firebase Authentication
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = credential.user;

      // 2. SUNTIK PROFIL: Buat dokumen baru di koleksi "users" menggunakan UID user sebagai ID dokumennya
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid,
        name: registerName || "Pendekar Kopi", // Mengambil data dari state registerName
        email: email,                          // Mengambil data dari state email
        phone: phone || "-",                  // Mengambil data dari state phone
        joinedAt: new Date().toISOString(),    // Mencatat tanggal & waktu registrasi secara realtime
        role: "CUSTOMER"                      // Otoritas akses default untuk pembeli ruko
      });

      alert("Pendaftaran Sukses! Selamat bergabung di ruko Kopthree, Bro.");
      setIsAuthModalOpen(false); // Tutup modal jika sukses
      resetAuthFields();
    } catch (error) {
      setAuthError(error.message.includes("email-already-in-use") 
        ? "Email sudah terdaftar, Bro." 
        : "Gagal daftar. Pastikan password minimal 6 karakter.");
    }
  };

  // Fungsi untuk Login (Tetap sama dengan bawaan asli lu)
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthModalOpen(false); // Tutup modal jika sukses
      resetAuthFields();
    } catch (error) {
      setAuthError("Email atau password salah, silakan cek kembali.");
    }
  };

  // Fungsi untuk Logout (Tetap sama dengan bawaan asli lu)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Berhasil keluar ruko Kopthree. Ditunggu seduhan berikutnya!");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Fungsi Pembersih Kolom (Diperbarui agar ikut menghapus isi input Nama & HP)
  const resetAuthFields = () => {
    setEmail("");
    setPassword("");
    setRegisterName(""); // 🟢 Membersihkan sisa ketikan nama lengkap
    setPhone("");        // 🟢 Membersihkan sisa ketikan nomor WhatsApp
    setAuthError("");
  };

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const firebaseData = [];
        querySnapshot.forEach((doc) => {
          firebaseData.push({ id: doc.id, ...doc.data() });
        });
        
        // Jika di Firebase ada data, pakai data dari cloud. Jika kosong, pakai data lokal (PRODUCTS).
        setProducts(firebaseData.length > 0 ? firebaseData : PRODUCTS);
      } catch (error) {
        console.error("Gagal mengambil data dari Firestore, menggunakan data lokal:", error);
        setProducts(PRODUCTS);
      }
    };

    fetchProducts();
  }, []);

  // State untuk Interaktif "Cari Karakter Kopi"
  const [strengthPref, setStrengthPref] = useState(null);
  const [acidityPref, setAcidityPref] = useState(null);
  const [matchedCoffee, setMatchedCoffee] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Filter produk berdasarkan kategori
  const filteredProducts = useMemo(() => {
  if (selectedCategory === "all") return products; // Ubah dari PRODUCTS ke products
  return products.filter((p) => p.category === selectedCategory); // Ubah dari PRODUCTS ke products
}, [selectedCategory, products]); // Tambahkan products di dalam array dependency

  const handleAddToCart = (productId) => {
    setCart((prevCart) => {
      // 1. Cek apakah produk ini sudah pernah dimasukkan ke keranjang
      const isExist = prevCart.find((item) => item.id === productId);

      if (isExist) {
        // 2. Jika sudah ada, naikkan jumlah kuantitasnya (quantity + 1)
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // 3. Jika belum ada, cari detail produknya dari array 'products' utama
        const productDetail = products.find((p) => p.id === productId);
        
        if (productDetail) {
          // Masukkan objek produk baru lengkap dengan tambahan properti quantity: 1
          return [...prevCart, { ...productDetail, quantity: 1 }];
        }
        
        return prevCart;
      }
    });
  };

// Algoritma rekomendasi kopi berdasarkan preferensi user (VERSI FIX ANTI-NaN)
  const handleFindMyCoffee = (e) => {
    e.preventDefault();
    if (!strengthPref || !acidityPref) {
      alert("Pilih dulu opsi ketebalan rasa dan tingkat keasamannya, Bro!");
      return;
    }

    // 1. KAMUS PEMETAAN (Menerjemahkan teks UI menjadi nilai angka skala 1-5)
    // Sesuaikan teks di bawah ini dengan isi value/id yang lu set di tombol UI
    let targetStrength = 3; // default tengah-tengah
    if (strengthPref === "TRAIL BLAZER EXTRA BOLD" || strengthPref === "5" || strengthPref === "kuat") targetStrength = 5;
    if (strengthPref === "HEAVY BODY & FULL ACCORD" || strengthPref === "4" || strengthPref === "sedang") targetStrength = 4;
    if (strengthPref === "SWEET & SMOOTH LIGHT BODY" || strengthPref === "2" || strengthPref === "ringan") targetStrength = 2;

    let targetAcidity = 3; // default tengah-tengah
    if (acidityPref === "CHARMING CITRUS ACIDITY" || acidityPref === "5" || acidityPref === "asam") targetAcidity = 5;
    if (acidityPref === "BALANCED BALANCE" || acidityPref === "3" || acidityPref === "balanced") targetAcidity = 3;
    if (acidityPref === "SWEETNESS NO ACIDITY" || acidityPref === "1" || acidityPref === "low") targetAcidity = 1;

    // 2. MULAI HITUNG SELISIH TERKECIL
    let bestMatch = products[0];
    let minDifference = 999;

    products.forEach((product) => {
      // Ambil nilai matriks rasa dari database (kasih fallback || 0 kalo datanya kosong)
      const prodStrength = product.strength || 3;
      const prodAcidity = product.acidity || 3;

      // Hitung jarak absolut selisih rasa
      const diffStrength = Math.abs(prodStrength - targetStrength);
      const diffAcidity = Math.abs(prodAcidity - targetAcidity);
      const totalDiff = diffStrength + diffAcidity;

      // Cari yang paling mendekati keinginan user (selisih paling kecil)
      if (totalDiff < minDifference) {
        minDifference = totalDiff;
        bestMatch = product;
      }
    });

    setMatchedCoffee(bestMatch);
    setShowResult(true); // Membuka pop-up rincian hasil rekomendasi kopi
  };

  const resetMatcher = () => {
    setStrengthPref(null);
    setAcidityPref(null);
    setMatchedCoffee(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-900 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black tracking-widest text-amber-500 uppercase">
              Kop<span className="text-neutral-100">three</span>
            </span>
          </div>

          <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wider text-neutral-400">
            <a href="#katalog" className="hover:text-amber-500 transition-colors duration-200">KATALOG</a>
            <a href="#rekomendasi" className="hover:text-amber-500 transition-colors duration-200">REKOMENDASI</a>
            <a href="#tentang" className="hover:text-amber-500 transition-colors duration-200">FILOSOFI</a>
            <a href="#lokasi" className="hover:text-amber-500 transition-colors duration-200">OUTLET</a>
          </nav>

          <div className="flex items-center space-x-6">
            {/* Tombol Keranjang Belanjaan (SEKARANG SUDAH AKTIF) */}
            <button 
              onClick={() => setIsCartOpen(true)} // <--- Fungsi pembuka modal keranjang sudah nempel di sini
              className="relative p-2 text-neutral-400 hover:text-amber-500 transition-colors duration-200 outline-none" 
              aria-label="Keranjang"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
            
            {/* LOGIKA JIKA USER SUDAH LOGIN VS BELUM LOGIN */}
            {user ? (
              <div className="flex items-center space-x-5">
                
                {/* 🟢 TOMBOL BARU: Klik untuk melihat riwayat pesanan */}
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-xs font-bold tracking-wider text-neutral-400 hover:text-amber-500 transition-colors uppercase outline-none"
                >
                  Pesanan Saya ({orderHistory.length})
                </button>

                <span className="text-xs text-neutral-400 hidden sm:inline">
                  Halo, <span className="text-amber-500 font-bold">{user.email.split('@')[0]}</span>
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-neutral-900 border border-neutral-800 hover:border-red-500 text-neutral-300 hover:text-red-500 text-xs font-bold tracking-wider px-4 py-2.5 rounded-sm transition-all duration-300 uppercase"
                >
                  KELUAR
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); }}
                className="inline-flex bg-amber-600 hover:bg-amber-700 text-neutral-950 text-xs font-bold tracking-wider px-5 py-2.5 rounded-sm transition-all duration-300 uppercase shadow-md shadow-amber-950/20"
              >
                MASUK
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1920&auto=format&fit=crop"
            alt="Kopthree Premium Coffee Background"
            fill
            priority
            className="object-cover opacity-20 filter grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-neutral-950/90"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center sm:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-4 py-1.5 rounded-full text-xs text-amber-500 font-semibold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>100% Arabika Pilihan</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white uppercase">
              Bold. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Rich.</span> <br />
              Pure.
            </h1>
            
            <p className="max-w-lg text-neutral-400 text-base sm:text-lg font-light leading-relaxed">
              Diciptakan untuk jiwa petualang yang menghargai cita rasa autentik dan kepribadian yang tangguh. Setiap tetesan Kopthree menyimpan rahasia proses pemanggangan presisi tingkat tinggi.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center sm:justify-start">
              <a
                href="#katalog"
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold tracking-widest text-xs px-8 py-4 rounded-sm transition-all duration-300 uppercase shadow-lg shadow-amber-500/10 text-center"
              >
                Jelajahi Katalog
              </a>
              <a
                href="#rekomendasi"
                className="border border-neutral-800 hover:border-amber-500 text-neutral-200 hover:text-white font-bold tracking-widest text-xs px-8 py-4 rounded-sm transition-all duration-300 uppercase bg-neutral-900/50 backdrop-blur-sm text-center"
              >
                Temukan Karaktermu
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-end relative">
            <div className="relative w-80 h-96 border border-neutral-800 p-4 rounded-lg bg-neutral-900/30 backdrop-blur-md shadow-2xl">
              <div className="absolute -top-3 -left-3 w-12 h-12 border-t border-l border-amber-500/60"></div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b border-r border-amber-500/60"></div>
              <div className="relative w-full h-full overflow-hidden rounded-md group">
                <Image
  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop" // 👈 Menggunakan ID gambar yang terbukti aktif di console lu
  alt="Espresso shot Kopthree"
  fill
  sizes="(max-width: 1024px) 100vw, 320px" // 👈 Menghilangkan peringatan kuning di console
  className="object-cover group-hover:scale-105 transition-transform duration-700"
  priority // 👈 Ditambahkan karena ini gambar utama (Above the fold) biar loading-nya instan
/>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] text-amber-500 tracking-widest uppercase font-semibold">Flagship Roast</span>
                  <h3 className="text-lg font-bold text-white tracking-wide uppercase">Black Obsidian Blend</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Values Section (Why Kopthree) */}
      <section className="bg-neutral-950 border-y border-neutral-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-4 p-8 rounded-lg bg-neutral-900/20 border border-neutral-900 hover:border-amber-700/30 transition-colors duration-300">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Kurasi Biji Pilihan</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Kami bermitra langsung dengan petani lokal di wilayah vulkanik Indonesia untuk memperoleh biji kopi dengan kematangan optimal.
              </p>
            </div>

            <div className="flex flex-col space-y-4 p-8 rounded-lg bg-neutral-900/20 border border-neutral-900 hover:border-amber-700/30 transition-colors duration-300">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Precision Roasting</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Menggunakan sensor presisi digital dan profile hand-roasted untuk mengeluarkan seluruh kekayaan rasa orisinal tanpa cacat.
              </p>
            </div>

            <div className="flex flex-col space-y-4 p-8 rounded-lg bg-neutral-900/20 border border-neutral-900 hover:border-amber-700/30 transition-colors duration-300">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Jaminan Kesegaran</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Kopi dipanggang dalam batch kecil dan hanya dikirim dalam hitungan hari setelah pemanggangan untuk memastikan kualitas optimal di cangkir Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Product Catalog Section */}
      <section id="katalog" className="max-w-7xl mx-auto px-6 py-24 flex-1">
        <div className="text-center md:text-left md:flex md:items-end md:justify-between mb-16">
          <div className="space-y-4">
            <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">Pilihan Terbaik Kami</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-white">
              Katalog Produk Kopi
            </h2>
          </div>

          {/* Kategori Filter Tabs */}
          <div className="flex flex-wrap gap-2 mt-8 md:mt-0 justify-center">
            {[
              { id: "all", label: "Semua" },
              { id: "single-origin", label: "Single Origin" },
              { id: "blend", label: "Signature Blend" },
              { id: "cold-brew", label: "Cold Brew" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2 text-xs font-bold tracking-wider uppercase rounded-sm border transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 border-amber-500 text-neutral-950"
                    : "border-neutral-900 bg-neutral-900/30 hover:border-amber-500/50 text-neutral-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-neutral-900/40 border border-neutral-900 hover:border-amber-900/40 rounded-lg p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-950/5 relative overflow-hidden"
            >
              {/* Image & Badges */}
              <div className="relative w-full h-64 overflow-hidden rounded-md bg-neutral-950 mb-5">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80"></div>
                <div className="absolute top-3 left-3 bg-neutral-950/80 border border-neutral-800 text-[10px] text-amber-500 px-3 py-1 font-bold rounded-sm uppercase tracking-wider">
                  {product.origin}
                </div>
              </div>

              {/* Text Information */}
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{product.tagline}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-wide text-white mt-1 uppercase group-hover:text-amber-500 transition-colors duration-200">
                    {product.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light mt-2 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  {/* Notes / Taste */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.notes.map((note, idx) => (
                      <span key={idx} className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full uppercase">
                        {note}
                      </span>
                    ))}
                  </div>

                  {/* Profile Indicator */}
                  <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-900/60 py-3 text-[10px] tracking-wider font-semibold text-neutral-400">
                    <div>
                      <span className="block text-neutral-600 text-[9px] uppercase">Strength</span>
                      <div className="flex space-x-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < product.strength ? "bg-amber-500" : "bg-neutral-800"}`}></span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-neutral-600 text-[9px] uppercase">Acidity</span>
                      <div className="flex space-x-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < product.acidity ? "bg-amber-500" : "bg-neutral-800"}`}></span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-neutral-600 text-[9px] uppercase">Sweetness</span>
                      <div className="flex space-x-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < product.sweetness ? "bg-amber-500" : "bg-neutral-800"}`}></span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price and Add Button */}
                <div className="flex items-center justify-between pt-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-500 uppercase tracking-widest">Harga</span>
                    <span className="text-base font-black text-amber-500">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="bg-neutral-950 border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 hover:border-amber-500 text-neutral-300 p-2.5 rounded-sm transition-all duration-300 group/btn"
                    aria-label="Add to cart"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 transform group-hover/btn:scale-110 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Interactive Section: Cari Karakter Kopi */}
      <section id="rekomendasi" className="bg-neutral-900/30 border-t border-neutral-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">Coffee Matchmaker</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white">Temukan Karakter Kopimu</h2>
            <p className="max-w-md mx-auto text-sm text-neutral-400 font-light leading-relaxed">
              Jawab preferensi di bawah ini untuk menemukan biji kopi yang paling cocok dengan kepribadian Anda.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800/80 rounded-xl p-8 sm:p-12 shadow-2xl relative">
            <div className="absolute top-0 right-12 w-20 h-1 bg-amber-500"></div>
            
            {!showResult ? (
              <form onSubmit={handleFindMyCoffee} className="space-y-10">
                {/* Question 1 */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-neutral-300 uppercase tracking-widest block">
                    1. Tingkat Intensitas & Ketebalan Bodi Kopi
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { val: "5", label: "Tebal & Sangat Pekat (Bold)", desc: "Menyukai rasa kopi pahit manis yang dominan" },
                      { val: "4", label: "Sedang-Tinggi (Full-bodied)", desc: "Menyukai bodi kopi mantap berskala seimbang" },
                      { val: "2", label: "Ringan & Bersih (Light-bodied)", desc: "Menyukai rasa kopi halus seperti teh herbal" },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`border rounded-lg p-5 cursor-pointer flex flex-col justify-between hover:border-amber-500/50 transition-all duration-200 ${
                          strengthPref === opt.val
                            ? "bg-amber-950/20 border-amber-500 text-white"
                            : "bg-neutral-950/40 border-neutral-800/60 text-neutral-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="strength"
                          value={opt.val}
                          checked={strengthPref === opt.val}
                          onChange={(e) => setStrengthPref(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold block uppercase text-white">{opt.label}</span>
                        <span className="text-[10px] text-neutral-500 mt-2 font-light leading-snug">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Question 2 */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-neutral-300 uppercase tracking-widest block">
                    2. Tingkat Keasaman (Acidity) & Kecerahan Rasa
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { val: "1", label: "Sangat Rendah (Low)", desc: "Tanpa rasa asam buah sama sekali, cenderung earthy" },
                      { val: "3", label: "Sedang (Balanced)", desc: "Sedikit kesegaran buah dengan dominansi manis" },
                      { val: "5", label: "Tinggi & Cerah (Vibrant)", desc: "Sensasi kesegaran jeruk/beri matang yang menonjol" },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`border rounded-lg p-5 cursor-pointer flex flex-col justify-between hover:border-amber-500/50 transition-all duration-200 ${
                          acidityPref === opt.val
                            ? "bg-amber-950/20 border-amber-500 text-white"
                            : "bg-neutral-950/40 border-neutral-800/60 text-neutral-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="acidity"
                          value={opt.val}
                          checked={acidityPref === opt.val}
                          onChange={(e) => setAcidityPref(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold block uppercase text-white">{opt.label}</span>
                        <span className="text-[10px] text-neutral-500 mt-2 font-light leading-snug">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={!strengthPref || !acidityPref}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-bold tracking-widest text-xs px-10 py-4 rounded-sm transition-all duration-300 uppercase shadow-lg shadow-amber-500/10 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Temukan Kopi Saya
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 animate-fadeIn text-center sm:text-left">
                <div className="flex flex-col sm:flex-row gap-8 items-center">
                  <div className="relative w-48 h-64 overflow-hidden rounded-md bg-neutral-950 border border-neutral-800">
                    <Image
                      src={matchedCoffee.image}
                      alt={matchedCoffee.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">
                      Kopi Paling Cocok Untuk Anda
                    </span>
                    <h3 className="text-3xl font-black tracking-wide text-white uppercase">
                      {matchedCoffee.name}
                    </h3>
                    <div className="inline-flex items-center space-x-2 bg-neutral-950 px-3 py-1 rounded-sm border border-neutral-800 text-xs text-neutral-400 font-medium">
                      <span>Asal:</span>
                      <span className="font-bold text-neutral-200">{matchedCoffee.origin}</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-light leading-relaxed">
                      {matchedCoffee.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                      {matchedCoffee.notes.map((note, idx) => (
                        <span key={idx} className="text-[10px] bg-neutral-950 border border-neutral-800 text-amber-500 px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-neutral-800/80 pt-8 mt-6">
                  <button
                    onClick={resetMatcher}
                    className="border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white font-bold tracking-widest text-xs px-8 py-4 rounded-sm transition-all duration-300 uppercase"
                  >
                    Ulangi Tes
                  </button>
                  <button
                    onClick={() => {
                      handleAddToCart(matchedCoffee.id);
                      resetMatcher();
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold tracking-widest text-xs px-8 py-4 rounded-sm transition-all duration-300 uppercase shadow-lg shadow-amber-500/10"
                  >
                    Masukkan ke Keranjang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Philosophy/About Section */}
      <section id="tentang" className="max-w-7xl mx-auto px-6 py-24 border-t border-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">Filosofi Kami</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-tight">
              Menghargai Proses. <br />
              Menghormati Karakter.
            </h2>
            
            {/* Custom Tabs */}
            <div className="flex border-b border-neutral-900">
              {["about", "roasting", "sourcing"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-6 text-xs font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-all duration-300 ${
                    activeTab === tab
                      ? "border-amber-500 text-white"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {tab === "about" ? "Misi Kami" : tab === "roasting" ? "Pemanggangan" : "Asal Usul"}
                </button>
              ))}
            </div>

            <div className="pt-4 text-neutral-400 text-sm font-light leading-relaxed min-h-[120px]">
              {activeTab === "about" && (
                <p>
                  Kopthree lahir dari keinginan sederhana untuk menyajikan kopi yang melambangkan karakter kuat, kemurnian rasa, dan kejujuran dalam proses. Kami percaya kopi bukan sekadar minuman penghalau rasa kantuk, melainkan teman berkarya dan pengingat akan dedikasi tiada henti.
                </p>
              )}
              {activeTab === "roasting" && (
                <p>
                  Setiap biji kopi dipanggang menggunakan mesin modern berbasis kendali digital presisi. Namun, insting roaster profesional kami tetap menjadi juru kunci utama. Kami menyelaraskan waktu, temperatur, dan sirkulasi udara untuk mengunci kelembutan crema serta kedalaman rasa.
                </p>
              )}
              {activeTab === "sourcing" && (
                <p>
                  Kami menjalin hubungan erat berkelanjutan (Direct Trade) dengan para petani kopi di pegunungan Gayo, Toraja, Flores, dan Bali. Dengan memutus rantai distribusi konvensional, kami menjamin kesejahteraan petani lokal sembari menjaga standardisasi orisinalitas buah ceri kopi terbaik.
                </p>
              )}
            </div>
          </div>

          <div className="relative w-full h-[400px] overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
            <Image
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop"
              alt="Biji kopi disangrai Kopthree"
              fill
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* 7. Outlet Section */}
      <section id="lokasi" className="bg-neutral-900/10 border-t border-neutral-900 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* SISI KIRI: INFO UTAMA & SOSMED TOKO */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">Kunjungi Kami</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white">Kopthree & Kitchen</h2>
            <p className="text-neutral-400 text-sm font-light leading-relaxed">
              Ingin merasakan atmosfer maskulin dan seduhan kopi premium kami secara langsung? Nikmati racikan barista andalan kami langsung di flagship roastery kami.
            </p>
            
            {/* Detail Kontak Fisik */}
            <div className="space-y-4 pt-2 text-xs font-semibold text-neutral-300 border-b border-neutral-900 pb-6">
              <div className="flex items-center space-x-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Kopthree, Kelapa Dua, Tangerang</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Setiap Hari : 08.00 - 22.00 WIB</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.28-5.168-3.625-6.448-6.448l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span>+62 831-5490-4710</span>
              </div>
            </div>

            {/* Jalur Komunikasi Sosial Media */}
            <div className="space-y-2.5">
              <span className="block text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Connect With Us</span>
              <div className="flex items-center space-x-3">
                
                {/* WhatsApp */}
                <a 
                  href="https://wa.me/6283154904710?text=Halo%20Admin%20Kopthree%20&%20Kitchen..." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-sm text-neutral-400 hover:text-amber-500 hover:border-amber-500/40 transition-all duration-300"
                  title="Hubungi Via WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.948h.003c4.368 0 7.926-3.559 7.93-7.93a7.9 7.9 0 0 0-2.326-5.592zm-5.607 11.366a6.52 6.52 0 0 1-3.308-.905l-.237-.14-2.455.644.656-2.39-.153-.244a6.51 6.51 0 0 1-1.002-3.423c.003-3.593 2.922-6.513 6.517-6.513a6.51 6.51 0 0 1 4.612 1.912 6.51 6.51 0 0 1 1.911 4.617c-.003 3.593-2.92 6.513-6.515 6.513m3.54-4.177c-.194-.097-1.14-.561-1.314-.625-.174-.064-.3-.096-.426.097-.126.193-.488.625-.597.749-.11.124-.218.139-.412.042-1.923-.963-2.52-1.185-3.39-2.68-.23-.393.23-.364.659-1.217.073-.146.036-.274-.018-.372-.054-.097-.426-1.026-.583-1.409-.153-.371-.305-.32-.426-.326-.11-.006-.238-.006-.366-.006-.127 0-.335.048-.51.24-.175.192-.667.651-.667 1.591s.684 1.847.78 1.976c.097.129 1.34 2.044 3.247 2.87.453.197.806.314 1.082.402.454.144.867.124 1.196.075.367-.054 1.14-.466 1.302-.916.16-.45.16-.836.113-.916-.048-.08-.174-.129-.368-.226"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/_sherlyouu?igsh=cTNrYnRhaXV2ZHE3" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-sm text-neutral-400 hover:text-amber-500 hover:border-amber-500/40 transition-all duration-300"
                  title="Ikuti Di Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.174.01 2.446.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.446-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a 
                  href="https://www.tiktok.com/@lyy3__?_r=1&_t=ZS-97FtcsruyM0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-sm text-neutral-400 hover:text-amber-500 hover:border-amber-500/40 transition-all duration-300"
                  title="Tonton Kami Di TikTok"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-2.128V11a5.002 5.002 0 0 1-5 5c-2.753 0-5-2.247-5-5s2.247-5 5-5c.342 0 .674.034 1 .1v2.03A3.003 3.003 0 0 0 3 11c0 1.654 1.346 3 3 3a3 3 0 0 0 3-3z"/>
                  </svg>
                </a>

              </div>
            </div>
          </div>

          {/* SISI KANAN: LIVE IFRAME MAPS DEJOA COFFEE (DARK MODE STYLE) */}
          <div className="lg:col-span-7 h-[350px] w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50 relative group">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3966.254017285045!2d106.5831662!3d-6.2302052!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fd6c7cc2cfe1%3A0x541aa328e102aed1!2sDejoa%20Coffee!5e0!3m2!1sen!2sid!4v1781586698778!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(1) invert(0.9) contrast(1.2)" }}
              className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map Dejoa Coffee"
            ></iframe>
          </div>
          
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-neutral-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <span className="text-lg font-black tracking-widest text-amber-500 uppercase">
              Kop<span className="text-white">three</span>
            </span>
            <p className="font-light text-[10px]">Premium Coffee Roasters. All rights reserved.</p>
          </div>

          <div className="flex space-x-6">
            <a href="#katalog" className="hover:text-amber-500 transition-colors">Katalog</a>
            <a href="#rekomendasi" className="hover:text-amber-500 transition-colors">Rekomendasi</a>
            <a href="#tentang" className="hover:text-amber-500 transition-colors">Tentang Kami</a>
            <a href="#lokasi" className="hover:text-amber-500 transition-colors">Lokasi</a>
          </div>

          <div className="text-center md:text-right font-light text-[10px]">
            &copy; {new Date().getFullYear()} Kopthree Coffee. Made with pride in Indonesia.
          </div>
        </div>
      </footer>
      {/* --- POP-UP MODAL AUTHENTICATION --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg max-w-md w-full relative shadow-2xl">
            {/* Tombol Close (X) */}
            <button 
              onClick={() => { setIsAuthModalOpen(false); resetAuthFields(); }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white text-sm"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-center text-white tracking-wider uppercase mb-6">
              {authMode === "login" ? "Masuk Ruko Kopthree" : "Daftar Pendekar Kopi"}
            </h3>

            {authError && (
              <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs p-3 rounded-sm mb-4 text-center font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              
              {/* 🟢 TEPAT DI SINI: Masukkan input Nama & No HP khusus untuk mode register */}
              {authMode === "register" && (
                <>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                      placeholder="Ade Tricahyo"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-1">No. WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                      placeholder="0831xxxx"
                    />
                  </div>
                </>
              )}

              {/* ⬇️ Input Email bawaan lu yang sudah ada sebelumnya */}
              <div>
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-sm text-white px-4 py-3 rounded-sm outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs tracking-widest py-3.5 rounded-sm uppercase transition-all duration-300 mt-2 shadow-lg shadow-amber-500/5"
              >
                {authMode === "login" ? "MASUK" : "DAFTAR SEKARANG"}
              </button>
            </form>

            <div className="text-center text-xs text-neutral-500 font-light mt-6 pt-4 border-t border-neutral-800/60">
              {authMode === "login" ? (
                <p>Belum punya akun? <span onClick={() => { setAuthMode("register"); setAuthError(""); }} className="text-amber-500 font-bold cursor-pointer hover:underline">Daftar di sini</span></p>
              ) : (
                <p>Sudah punya akun? <span onClick={() => { setAuthMode("login"); setAuthError(""); }} className="text-amber-500 font-bold cursor-pointer hover:underline">Login di sini</span></p>
              )}

            
            </div>
          </div>
        </div>
      )}
      {/* --- POP-UP MODAL KERANJANG BELANJA (VERSI RESMI MIDTRANS) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-950/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 h-full max-w-md w-full p-6 relative flex flex-col shadow-2xl">
            
            {/* Header Keranjang */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-lg font-black text-white tracking-wider uppercase">
                Keranjang Kopthree ({cartCount})
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors text-sm font-bold"
              >
                TUTUP ✕
              </button>
            </div>

            {/* List Item Kopi */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 font-light text-sm">
                  <p>Keranjang masih kosong, Bro.</p>
                  <p className="text-xs text-amber-500/60 mt-1">Yuk, pilih seduhan kopi premium dulu!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-3 bg-neutral-950 border border-neutral-800/60 rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">{item.name}</h4>
                        <p className="text-xs text-amber-500 font-mono mt-0.5">
                          Rp {(item.price).toLocaleString("id-ID")} x {item.quantity}
                        </p>
                      </div>
                      
                      {/* Tombol + - */}
                      <div className="flex items-center space-x-2.5 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                        <span className="text-xs font-mono font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                      </div>
                    </div>

                    {/* 🟢 SEKARANG MUNCUL: PILIHAN PREMIUM ADD-ONS CAFE */}
                    <div className="border-t border-neutral-900 pt-2 grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
                      {[
                        { name: "Extra Shot (+5k)", key: "Extra Shot", price: 5000 },
                        { name: "Oat Milk (+10k)", key: "Oat Milk", price: 10000 },
                        { name: "Ice Cream (+7k)", key: "Ice Cream", price: 7000 }
                      ].map((addon) => {
                        const isChecked = (item.selectedAddOns || []).some((a) => a.name === addon.key);
                        return (
                          <label key={addon.key} className="flex items-center space-x-1.5 cursor-pointer hover:text-white select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddOn(item.id, addon.key, addon.price)}
                              className="accent-amber-500 h-3 w-3"
                            />
                            <span>{addon.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* --- INPUT OPSI PESANAN & NOTES (BARU) --- */}
            {cart.length > 0 && (
              <div className="py-4 border-t border-neutral-800 space-y-4">
                
                {/* Pilihan Metode Opsi */}
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-2">Metode Pesanan</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["dine-in", "takeaway", "delivery"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderType(type)}
                        className={`py-2 rounded-sm uppercase tracking-wider font-mono text-[10px] border font-bold transition-all ${orderType === type ? "border-amber-500 bg-amber-500/10 text-white" : "border-neutral-800 bg-neutral-950 text-neutral-500"}`}
                      >
                        {type === "dine-in" ? "Dine In" : type === "takeaway" ? "Takeaway" : "Delivery"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🟢 INPUT DINAMIS: Muncul otomatis sesuai tombol metode yang diklik */}
                {orderType === "dine-in" && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-[10px] text-amber-500 uppercase tracking-widest font-bold">Nomor Meja Dine-In</label>
                    <input
                      type="text"
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Misal: Meja 04, Meja Pojok"
                      className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white rounded-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                )}

                {orderType === "takeaway" && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-[10px] text-amber-500 uppercase tracking-widest font-bold">Jam Rencana Pengambilan</label>
                    <input
                      type="time"
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white rounded-sm focus:outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                  </div>
                )}

                {/* Input Catatan Tambahan */}
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1.5">Catatan Tambahan (Notes)</label>
                  <textarea
                    rows="2"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Contoh: Less sugar, giling kasar, atau detail patokan alamat..."
                    className="w-full bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white rounded-sm focus:outline-none focus:border-amber-500 resize-none placeholder:text-neutral-700 font-sans"
                  ></textarea>
                </div>

              </div>
            )}

            {/* 🟢 RINCIAN NOTA & TOTAL AKHIR (SUDAH TERHUBUNG GRANDTOTAL + ONGKIR) */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Subtotal Kopi:</span>
                  <span className="font-mono">Rp {cartTotal.toLocaleString("id-ID")}</span>
                </div>
                
                {/* Muncul baris baru kalau user milih Delivery */}
                {orderType === "delivery" && (
                  <div className="flex items-center justify-between text-xs text-neutral-400 animate-fadeIn">
                    <span>Biaya Ongkir:</span>
                    <span className="font-mono text-amber-500">+ Rp {deliveryFee.toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-900 font-bold">
                  <span className="text-neutral-200">Total Tagihan:</span>
                  <span className="text-base font-mono text-amber-500">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs tracking-widest py-4 rounded-sm uppercase transition-all duration-300 shadow-lg shadow-amber-500/10"
                >
                  Checkout Pesanan Kamu
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* --- POP-UP MODAL JODOH KOPI (MATCHMAKER) --- */}
      {showResult && matchedCoffee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full p-6 rounded-sm relative shadow-2xl text-center space-y-4">
            
            <button 
              onClick={resetMatcher} // Menggunakan fungsi reset bawaan lu
              className="absolute top-4 right-4 text-neutral-500 hover:text-white font-bold text-xs font-mono tracking-widest"
            >
              ✕ CLOSE
            </button>

            <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase block">
              ✨ Hasil Rekomendasi Karakter Kopimu
            </span>

            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              {matchedCoffee.name}
            </h3>

            <p className="text-[11px] text-neutral-400 italic font-mono px-4">
              "{matchedCoffee.tagline || 'Racikan Kopi Pilihan Terbaik'}"
            </p>

            <div className="flex justify-center py-2">
              <img 
                src={matchedCoffee.image} 
                alt={matchedCoffee.name} 
                className="w-36 h-36 object-cover rounded-sm border border-neutral-800 shadow-md"
              />
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed px-2">
              {matchedCoffee.description}
            </p>

            {/* Render Flavor Notes asli dari Firebase */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {matchedCoffee.notes?.map((note, index) => (
                <span key={index} className="bg-neutral-950 border border-neutral-800 text-[9px] text-amber-500/90 font-mono px-2.5 py-0.5 rounded-full uppercase">
                  • {note}
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between">
              <span className="font-mono text-amber-500 font-bold text-sm">
                Rp {matchedCoffee.price?.toLocaleString("id-ID")}
              </span>
              <button 
                onClick={() => {
                  handleAddToCart(matchedCoffee.id); // Terhubung ke fungsi add to cart lu
                  resetMatcher(); // Tutup modal setelah masuk keranjang
                }}
                className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-[10px] tracking-widest px-4 py-2.5 rounded-sm uppercase transition-colors"
              >
                Masukkan Keranjang
              </button>
            </div>

          </div>
        </div>
      )}
      {/* --- 🟢 POP-UP MODAL RIWAYAT & STATUS PESANAN PELANGGAN --- */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg max-w-lg w-full relative flex flex-col max-h-[85vh] shadow-2xl">
            
            {/* Tombol Tutup */}
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white tracking-wider uppercase mb-4 border-b border-neutral-800 pb-3">
              📋 Riwayat Seduhan Lu
            </h3>

            {/* Kotak Scroll List Riwayat */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {orderHistory.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 font-light text-xs space-y-1">
                  <p>Lu belum pernah mesen kopi di ruko Kopthree, Bro.</p>
                  <p className="text-amber-500/60 font-medium">Ditunggu orderan pertamamu!</p>
                </div>
              ) : (
                orderHistory.map((order) => (
                  <div key={order.id} className="p-4 bg-neutral-950 border border-neutral-800/80 rounded-sm space-y-3">
                    
                    {/* Baris Atas: ID & Waktu */}
                    <div className="flex justify-between items-start text-[10px] text-neutral-400 font-mono">
                      <div>
                        <span className="block text-neutral-500">ORDER ID</span>
                        <span className="text-white font-bold">{order.id}</span>
                      </div>
                      <div className="text-right">
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleString("id-ID") : "-"}</span>
                      </div>
                    </div>

                    {/* Baris Tengah: Daftar Item Produk */}
                    <div className="border-y border-neutral-900/60 py-2 space-y-1">
                      {order.cart?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-medium">
                          <span className="text-neutral-300 uppercase">• {item.name} <span className="text-neutral-500 font-mono text-[10px]">({item.quantity}x)</span></span>
                          <span className="text-neutral-400 font-mono">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                        </div>
                      ))}
                    </div>

                    {/* Info Tambahan Opsi Meja / Jam Takeaway / Ongkir */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-neutral-900 px-2 py-0.5 rounded-sm text-neutral-400 border border-neutral-800">{order.orderType}</span>
                      {order.orderType === "dine-in" && <span className="text-amber-500">Meja: {order.tableNumber || "Bebas"}</span>}
                      {order.orderType === "takeaway" && <span className="text-purple-400">Jam Ambil: {order.pickupTime || "Secepatnya"}</span>}
                      {order.orderType === "delivery" && <span className="text-blue-400">Ongkir Terbayar</span>}
                    </div>

                    {/* Baris Bawah: Status Bayar & Status Antrean Seduh */}
                    <div className="flex justify-between items-center pt-1">
                      <div className="flex space-x-2 text-[9px] font-black tracking-widest uppercase">
                        {/* Status Transaksi Midtrans */}
                        <span className={`px-2 py-0.5 rounded-sm ${order.status_pembayaran === "SUCCESS" ? "bg-green-950/60 text-green-400 border border-green-900" : "bg-amber-950/60 text-amber-500 border border-amber-900"}`}>
                          💵 {order.status_pembayaran || "PENDING"}
                        </span>
                        
                        {/* Status Pengerjaan Barista (Realtime) */}
                        <span className={`px-2 py-0.5 rounded-sm ${
                          order.status_pesanan === "SELESAI" ? "bg-blue-950 text-blue-400 border border-blue-900" :
                          order.status_pesanan === "DIPROSES" ? "bg-purple-950 text-purple-400 border border-purple-900 animate-pulse" :
                          "bg-neutral-900 text-neutral-500 border border-neutral-800"
                        }`}>
                          {order.status_pesanan === "SELESAI" ? "🎉 SIAP DINIKMATI" :
                           order.status_pesanan === "DIPROSES" ? "☕ SEDANG DISEDUH" :
                           "⏳ MENUNGGU ANTREAN"}
                        </span>
                      </div>

                      {/* Total Biaya Akhir */}
                      <span className="text-sm font-mono font-black text-amber-500">
                        Rp {(order.cartTotal || 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}