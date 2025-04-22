import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_URL = "https://backend-eskimo.onrender.com/api/categories"; // ou seu localhost

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_URL);
      setCategories(res.data);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, { name });
      } else {
        await axios.post(API_URL, { name });
      }
      setName("");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
    }
  };

  const handleEdit = (category) => {
    setName(category.name);
    setEditingId(category.id);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gerenciar Categorias</h2>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-4 items-end">
        <div>
          <Label>Nome da Categoria</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit">{editingId ? "Atualizar" : "Cadastrar"}</Button>
      </form>

      <Card className="p-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex justify-between items-center border-b py-2"
          >
            <span>{cat.name}</span>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(cat)}>Editar</Button>
              <Button variant="destructive" onClick={() => handleDelete(cat.id)}>
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
