import React, { useState, useEffect } from "react";
import api from "../services/api";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: "",
    date: "",
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = () => {
    api
      .get("/expenses")
      .then((response) => setExpenses(response.data))
      .catch((error) => console.error("Error al obtener los gastos:", error));
  };

  const handleInputChange = (e) => {
    setNewExpense({ ...newExpense, [e.target.name]: e.target.value });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    api
      .post("/expenses", newExpense)
      .then(() => {
        fetchExpenses();
        setNewExpense({  amount: "", date: "" });
      })
      .catch((error) => console.error("Error al agregar el gasto:", error));
  };

  return (
    <div>
      <h1>Gastos</h1>
      <form onSubmit={handleAddExpense}>
        <input
          type="text"
          name="category"
          placeholder="Categoría"
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Monto"
          value={newExpense.amount}
          onChange={handleInputChange}
          required
        />
        <input
          type="date"
          name="date"
          placeholder="Fecha"
          value={newExpense.date}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Agregar Gasto</button>
      </form>

      <h2>Lista de Gastos</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
           {/*  <strong>Categoría:</strong> {expense.category} | <strong>Monto:</strong> {expense.amount} |{" "} */}
            <strong>Fecha:</strong> {new Date(expense.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Expenses;
