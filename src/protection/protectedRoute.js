import { useMsal } from "@azure/msal-react";
import { Navigate, useLocation } from "react-router-dom";
import { InteractionStatus } from "@azure/msal-browser";

const ProtectedRoute = ({ children }) => {
    const { instance, inProgress } = useMsal();
    const activeAccount = instance.getActiveAccount();
    const location = useLocation();

    if (inProgress !== InteractionStatus.None) {
        return <div>Verifying Session...</div>;
    }

    // 1. Wait for MSAL to finish checking cookies/cache
    if (inProgress !== InteractionStatus.None) {
        return <div>Loading authentication...</div>;
    }

    // 2. If no account is found, redirect to home (or login)
    if (!activeAccount) {
        // We save the current location so we can redirect back after login if needed
        return <Navigate to="/" state={{ from: location, showLoginMessage: true }} replace />;
    }

    return children;
};

export default ProtectedRoute;