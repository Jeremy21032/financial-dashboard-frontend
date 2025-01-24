import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import config from "./config"; // Importa la configuración

function App() {
  console.log("Cargando configuración:", config); // Verifica que las variables se carguen correctamente

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
