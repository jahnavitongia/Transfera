import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../services/api";

const Login = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isRegistering ? "/auth/register" : "/auth/login";
            const payload = isRegistering ? { name, email, password } : { email, password };
            const response = await post(endpoint, payload);

            if (response.data.token) {
                localStorage.setItem("transferaToken", response.data.token);
                navigate("/dashboard");
            } else {
                setError("Account created successfully. Please sign in.");
                setIsRegistering(false);
            }

        } catch (requestError) {
            const serverMessage = requestError.response?.data?.message;
            const isNetworkError = !requestError.response && requestError.code !== "ERR_CANCELED";

            if (serverMessage) {
                setError(serverMessage);
            } else if (isNetworkError) {
                setError("Unable to connect to the backend. Ensure the API server is running.");
            } else {
                setError("Unable to complete the request. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setError("");
        setIsRegistering((current) => !current);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">T</div>
                <h1>Transfera</h1>
                <p className="login-subtitle">Student Transfer Management System</p>

                <form onSubmit={handleSubmit}>
                    {isRegistering && (
                        <>
                            <label htmlFor="name">Full name</label>
                            <input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} minLength="2" required />
                        </>
                    )}

                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} minLength="6" required />

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? (isRegistering ? "Creating account..." : "Signing in...") : (isRegistering ? "Create account" : "Sign in")}
                    </button>
                </form>

                <p className="login-switch">
                    {isRegistering ? "Already have an account?" : "New to Transfera?"}{" "}
                    <button type="button" onClick={switchMode}>{isRegistering ? "Sign in" : "Create account"}</button>
                </p>
                <p className="login-footer">Secure Student Transfer & Evaluation</p>
            </div>
        </div>
    );
};

export default Login;