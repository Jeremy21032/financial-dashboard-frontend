import React from "react";

const PaymentList = ({ payments }) => {
  if (payments.length === 0) {
    return <p>No hay pagos registrados.</p>;
  }

  return (
    <div>
      <h2>Lista de Pagos</h2>
      <ul>
        {payments.map((payment) => (
          <li key={payment.id}>
            <strong>ID Estudiante:</strong> {payment.student_id} | <strong>Monto:</strong> {payment.amount} |{" "}
            <strong>Fecha:</strong> {new Date(payment.date).toLocaleDateString()} |{" "}
            <strong>Periodo:</strong> {payment.payment_period}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentList;
