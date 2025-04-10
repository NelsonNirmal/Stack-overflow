import { Link, useNavigate } from "react-router-dom";
import "../Auth/Auth.css";
import React, { useState } from 'react';
import axios from 'axios';
import Navbar from "../Comnponent/Navbar/navbar";
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from "react-i18next";


function LoginPage() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);
            alert(response.data.message);
            navigate('/dashboard/home');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An unexpected error occurred';
            setError(errorMessage);
            console.error(err);
        }
    };

    

    return (
        <section className="auth-section">
            <Navbar />
            <div className="auth-container-1">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/02/Stack_Overflow_logo.svg"
                    alt="Stack Overflow Logo"
                    className="login-logo"
                />
            </div>
            <div className="auth-container-2">
                <form onSubmit={handleSubmit}>
                    <label>
                    <h4>{t("login.email")}</h4>
                        <input
                            type="email"
                            name="email"
                            placeholder={t("login.email")}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </label>
                    <label>
                    <h4>{t("login.password")}</h4>
                        <input
                            type="password"
                            name="password"
                            placeholder={t("login.password")}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="auth-btn">
                    {t("login.title")}
                    </button>

                </form>
                


                <p>
                {t("login.noAccount")}{" "}
                    <Link to="/signup" className="handle-switch-btn">
                    {t("login.signup")}
                    </Link>
                </p>
            </div>
        </section>
    );
}

export default LoginPage;
