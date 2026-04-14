import { useLocation } from "react-router-dom";
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { environment } from "../../environments/environment";
import './login.css';

const Login = () => {
    const { instance, accounts } = useMsal();
    const location = useLocation();

    const showMessage = location.state?.showLoginMessage && accounts.length === 0;

    const handleLogin = () => {
        const loginRequest = {
            scopes: environment.apiConfig.scopes
        };

        instance.loginRedirect(loginRequest)
            .then(response => {
                console.log("Successfully logged in: ", response);
            })
            .catch(e => {
                console.error("Login failed:", e);
            });
    };

    const handleLogout = () => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/"
        });
        localStorage.clear();
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
            {showMessage && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeeba',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <strong>Wait!</strong> Please login to continue....
                </div>
            )}

            <AuthenticatedTemplate>
                <div style={{ padding: "20px", border: "1px solid green", display: "inline-block" }}>
                    <h2>Welcome, {accounts[0]?.name}!</h2>
                    <p>Your email: {accounts[0]?.username}</p>
                    <button onClick={handleLogout} style={{ padding: "10px 20px", cursor: "pointer" }}>
                        Sign Out
                    </button>
                </div>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <div style={{ padding: "20px", border: "1px solid red", display: "inline-block" }}>
                    <h2>You are not signed in.</h2>
                    <button onClick={handleLogin} style={{ padding: "10px 20px", cursor: "pointer" }}>
                        Sign In with Microsoft
                    </button>
                </div>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default Login;