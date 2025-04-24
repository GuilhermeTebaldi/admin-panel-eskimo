import { useEffect, useState } from "react";
import axios from "axios";

export default function HomePublic() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://backend-eskimo.onrender.com/api/products/list?page=1&pageSize=100");
        if (res.data && Array.isArray(res.data.items)) {
          setProducts(res.data.items);
        } else {
          throw new Error("Resposta da API inválida ou sem produtos.");
        }
      } catch (err) {
        console.error("Erro ao buscar produtos", err);
        setError("Erro ao buscar produtos. Tente novamente mais tarde.");
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="bg-green-200 text-green-900 text-xl text-center font-bold py-4 shadow-md">
        Tailwind funcionando? ✅ Se você vê esta faixa verde, está tudo OK!
      </div>

      <header className="flex items-center justify-between px-6 py-4 shadow-md bg-red-600 text-white">
        <div className="flex items-center gap-4">
          <img src="https://eskimo.com.br/wp-content/uploads/2023/03/image-1.png" alt="Eskimo" className="h-10" />
          <h1 className="text-2xl font-bold">Eskimo Sorvetes</h1>
        </div>
        <nav className="flex gap-6">
          <a href="#produtos" className="hover:underline">Produtos</a>
          <a href="#carrinho" className="hover:underline">Carrinho</a>
        </nav>
      </header>

      <section className="px-6 py-12 bg-gradient-to-b from-white to-red-50 text-center">
        <h2 className="text-3xl font-bold mb-2">Bem-vindo à nossa loja online 🍦</h2>
        <p className="text-gray-600">Escolha seus sabores favoritos e receba em casa!</p>
      </section>

      <section id="produtos" className="px-6 py-12 max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold mb-6">Produtos disponíveis</h3>
        {error ? (
          <p className="text-red-600 font-semibold text-center">{error}</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {products.map(product => (
              <div key={product.id} className="border rounded-xl p-4 shadow-sm bg-white">
                <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded" />
                <h4 className="mt-4 text-lg font-semibold">{product.name}</h4>
                <p className="text-sm text-gray-600">{product.description}</p>
                <p className="mt-2 font-bold">R$ {product.price.toFixed(2)}</p>
                <button className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Adicionar ao Carrinho</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-sm text-gray-500 py-6 bg-gray-100">
        © 2025 Eskimo Sorvetes. Todos os direitos reservados.
      </footer>
    </div>
  );
}
