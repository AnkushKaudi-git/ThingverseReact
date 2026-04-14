import React from 'react';
import './navbar.css'
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import menuItems from '../../constants/menuConfig.json'

const NavbarItem = ({ item, isOpen, onToggle }) => {
    return (
        <div className="sidebar-item-container"> {/* This must be position: relative */}
            <div
                className={`nav-item ${isOpen ? 'active' : ''}`}
                onClick={onToggle}
            >
                {/* <span className="nav-icon" style={{ marginRight: '15px' }}>⊞</span> */}
                <span className="nav-text">{item.title}</span>
                {item.children && <span className="nav-arrow"></span>}
            </div>

            {/* FLYOUT MENU */}
            {item.children && isOpen && (
                <div className="nav-flyout">
                    {item.children.map((child, idx) => (
                        <NavLink key={idx} to={child.path} className="flyout-item">
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

    return (
        <header className="navbar">
            <div className="navbar-brand">
                <NavLink to="/">
                    <img src="/Thingverse.png" alt="ThingVerse" className="logo" />
                </NavLink>
                {/* <h1 className="app-title">ThingVerse - Device Management Solutions</h1> */}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <NavbarItem key={index} item={item} 
                    isOpen={openMenu === index}
                    onToggle={() => handleMenuToggle(index)}
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