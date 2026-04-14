import React, { useState } from 'react';
import './navbar.css';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import menuItems from '../../constants/menuConfig.json';

const NavbarItem = ({ item, isOpen, onToggle, closeMenu }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if the current route matches the item's path or any of its children's paths
    const isActiveRoute = item.children
        ? item.children.some(child => location.pathname === child.path)
        : location.pathname === item.path;

    // Handle clicking the top-level menu
    const handleMenuClick = () => {
        if (item.children) {
            onToggle(); // Open/close dropdown if it has children
        } else if (item.path) {
            navigate(item.path); // Navigate directly if it has no children
            closeMenu(); // Ensure other open menus close
        }
    };

    return (
        <div className="sidebar-item-container">
            <div
                // Keep the 'active' class if the menu is open OR if it is the current active route
                className={`nav-item ${isOpen || isActiveRoute ? 'active' : ''}`}
                onClick={handleMenuClick}
            >
                <span className="nav-text">{item.title}</span>
                {item.children && <span className="nav-arrow"></span>}
            </div>

            {/* FLYOUT MENU */}
            {item.children && isOpen && (
                <div className="nav-flyout">
                    {item.children.map((child, idx) => (
                        <NavLink
                            key={idx}
                            to={child.path}
                            className="flyout-item"
                            onClick={closeMenu} // 1. Closes the flyout immediately after clicking
                        >
                            <span className="flyout-icon">🗇</span>
                            <span className="flyout-text">{child.title}</span>
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
};

const Navbar = ({ userName }) => {
    const [openMenu, setOpenMenu] = useState(null);

    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    const handleMenuToggle = (index) => {
        setOpenMenu(openMenu === index ? null : index);
    }

    // Function to close all menus
    const closeMenu = () => {
        setOpenMenu(null);
    }

    return (
        <header className="navbar">
            <div className="navbar-brand">
                <NavLink to="/">
                    <img src="/Thingverse.png" alt="ThingVerse" className="logo" />
                </NavLink>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <NavbarItem
                        key={index}
                        item={item}
                        isOpen={openMenu === index}
                        onToggle={() => handleMenuToggle(index)}
                        closeMenu={closeMenu} // Pass the close function down
                    />
                ))}
            </nav>

            <div className="navbar-user-actions">
                <div className="user-welcome">
                    <p>Welcome, <strong>{userName}</strong>!</p>
                    <small>Multiple Roles</small>
                </div>
                <div className="navbar-icons">
                    <button className="icon-btn" title="Theme/Settings">🎨</button>
                    <div className="user-avatar">{initials}</div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;