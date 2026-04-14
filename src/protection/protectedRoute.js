import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { Navigate, useLocation } from "react-router-dom";
import { InteractionStatus } from "@azure/msal-browser";

const ProtectedRoute = ({ children }) => {
    const { inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated(); // <-- Let MSAL do the heavy lifting here
    const location = useLocation();

    // 1. Wait for MSAL to finish checking cookies/cache/tokens
    if (inProgress !== InteractionStatus.None) {
        return <div>Verifying Session...</div>;
    }

    // 2. If MSAL is completely idle but no valid session is found, redirect to home
    if (!isAuthenticated) {
        // We save the current location so we can redirect back after login if needed
        return <Navigate to="/" state={{ from: location, showLoginMessage: true }} replace />;
    }

    // 3. User is verified and MSAL is idle! Render the page.
    return children;
};

export default ProtectedRoute;