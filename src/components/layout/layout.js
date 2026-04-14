import { AuthenticatedTemplate } from "@azure/msal-react";
import Navbar from '../navbar/navbar';
import './layout.css'

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Navbar stays fixed at the top */}
      <AuthenticatedTemplate>
        <Navbar userName="Ankush Kaudi" />
      </AuthenticatedTemplate>

      <div className="main-content-wrapper">
        {/* Sidebar stays fixed on the left */}
        {/* <Sidebar /> */}

        {/* This is where your page-specific content will render */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;