"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const API_URL = 'http://localhost:5001/api/auth'; // Adjust if your backend runs on a different port/URL
const register = async (name, email, password, isNonProfit, organizationName) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                isNonProfit,
                organizationName: isNonProfit ? organizationName : undefined,
                // Omit location unless a non-profit is being registered AND we eventually collect their location
                // location: isNonProfit ? { type: "Point", coordinates: [0,0] } : undefined, // Example if we needed a default for nonprofit
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Backend Response Data (Error):', data);
            const errorMessage = data.message || (data.errors && data.errors[0] && data.errors[0].msg) || 'Registration failed';
            throw new Error(errorMessage);
        }
        return data; // Contains user info and token
    }
    catch (error) {
        console.error('Registration Error:', error);
        throw error; // Re-throw to be caught by the component
    }
};
const login = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        return data; // Contains user info and token
    }
    catch (error) {
        console.error('Login Error:', error);
        throw error; // Re-throw to be caught by the component
    }
};
const authService = {
    register,
    login,
};
exports.default = authService;
