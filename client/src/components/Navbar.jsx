import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className="navbar">
      <ul className="navbar-menu">
        <li className={`navbar-item ${isActive("/")}`}>
          <Link to="/">Beranda</Link>
        </li>
        <li className={`navbar-item ${isActive("/form")}`}>
          <Link to="/form">Form</Link>
        </li>
        {/* <li className={`navbar-item ${isActive("/indikator")}`}>
          <Link to="/indikator">Indikator</Link>
        </li> */}
      </ul>
    </nav>
  );
};

export default Navbar;
