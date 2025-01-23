import React from "react";

const StudentList = ({ students }) => {
  if (students.length === 0) {
    return <p>No hay estudiantes registrados.</p>;
  }

  return (
    <div>
      <h2>Lista de Estudiantes</h2>
      <ul>
        {students.map((student) => (
          <li key={student.id}>
            <strong>Nombre:</strong> {student.name} | <strong>Email:</strong> {student.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
