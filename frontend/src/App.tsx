import { useState } from 'react'

const products = [
  { id: 1, name: 'Buku Catatan Teknik', price: 25000 },
  { id: 2, name: 'Kemeja Praktikum', price: 120000 },
  { id: 3, name: 'Sticker Coding', price: 5000 },
]

function App() {
  const [cartCount, setCartCount] = useState(0)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-700">Akademart</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Keranjang ({cartCount})
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-50 p-8 rounded-2xl mb-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Selamat Datang di Akademart</h2>
        <p className="text-gray-600">Tempat jual beli kebutuhan mahasiswa kampus.</p>
      </section>

      {/* Product Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-blue-600 font-bold mb-4">Rp {product.price.toLocaleString()}</p>
            <button
              onClick={() => setCartCount(cartCount + 1)}
              className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
            >
              Tambah ke Keranjang
            </button>
          </div>
        ))}
      </section>
    </div>
  )
}

export default App