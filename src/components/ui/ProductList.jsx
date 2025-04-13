import { useEffect, useState } from "react";
import axios from "axios";

export default function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/products/list?page=1&pageSize=10")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Erro ao buscar produtos:", err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🛒 Produtos Cadastrados</h2>
      <table className="w-full table-auto border rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Preço</th>
            <th className="px-4 py-2">Estoque</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">R$ {p.price.toFixed(2)}</td>
              <td className="px-4 py-2">{p.stock}</td>
              <td className="px-4 py-2">{p.categoryName}</td>
              <td className="px-4 py-2">
                <button className="mr-2 text-blue-500 hover:underline">Editar</button>
                <button className="text-red-500 hover:underline">Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
