import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/students">Students</Link></li>
        <li><Link to="/payments">Payments</Link></li>
        <li><Link to="/expenses">Expenses</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
