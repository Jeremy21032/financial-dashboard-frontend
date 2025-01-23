import React, { useState } from "react";
import api from "../services/api";

const AddStudentForm = ({ onStudentAdded }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post("/students", { name, email })
      .then((response) => {
        onStudentAdded(response.data);
        setName("");
        setEmail("");
      })
      .catch((error) => console.error("Error adding student:", error));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Add Student</button>
    </form>
  );
};

export default AddStudentForm;
