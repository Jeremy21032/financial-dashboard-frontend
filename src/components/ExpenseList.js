import React from "react";

const ExpenseList = ({ expenses }) => {
  if (expenses.length === 0) {
    return <p>No hay gastos registrados.</p>;
  }

  return (
    <div>
      <h2>Lista de Gastos</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {/* <strong>Categoría:</strong> {expense.category} | <strong>Monto:</strong> {expense.amount} |{" "} */}
            <strong>Fecha:</strong> {new Date(expense.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseList;
