"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const authService_1 = __importDefault(require("../services/authService"));
function AuthPage() {
    const [isLogin, setIsLogin] = (0, react_1.useState)(true);
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [name, setName] = (0, react_1.useState)('');
    const [isNonProfit, setIsNonProfit] = (0, react_1.useState)(false);
    const [organizationName, setOrganizationName] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            if (isLogin) {
                const response = await authService_1.default.login(email, password);
                console.log('Login successful:', response);
                // Store token in localStorage or context if needed
                // localStorage.setItem('user', JSON.stringify(response));
                navigate('/home'); // Redirect to home page on success
            }
            else {
                const response = await authService_1.default.register(name, email, password, isNonProfit, organizationName);
                console.log('Signup successful:', response);
                // Store token in localStorage or context if needed
                // localStorage.setItem('user', JSON.stringify(response));
                navigate('/home'); // Redirect to home page on success
            }
        }
        catch (err) {
            setError(err.message || 'An unexpected error occurred');
            console.error('Authentication Error:', err);
        }
        // Reset password field after submission (optional, for security)
        setPassword('');
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-md", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-4xl font-extrabold text-center text-gray-900 mb-8", children: isLogin ? 'Welcome Back!' : 'Join Smart Civic Navigator' }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center text-gray-600 mb-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-2", children: "Connecting communities to vital services and fostering local engagement." }), (0, jsx_runtime_1.jsxs)("p", { children: [isLogin ? "Don't have an account?" : "Already have an account?", " ", (0, jsx_runtime_1.jsx)("button", { onClick: () => { setIsLogin(!isLogin); setError(''); }, className: "text-blue-600 hover:underline font-medium focus:outline-none", children: isLogin ? 'Sign Up' : 'Login' })] })] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6", role: "alert", children: [(0, jsx_runtime_1.jsx)("strong", { className: "font-bold", children: "Error!" }), (0, jsx_runtime_1.jsxs)("span", { className: "block sm:inline", children: [" ", error] })] })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }), (0, jsx_runtime_1.jsx)("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, className: "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", value: email, onChange: (e) => setEmail(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }), (0, jsx_runtime_1.jsx)("input", { id: "password", name: "password", type: "password", autoComplete: "current-password", required: true, className: "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", value: password, onChange: (e) => setPassword(e.target.value) })] }), !isLogin && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Your Name" }), (0, jsx_runtime_1.jsx)("input", { id: "name", name: "name", type: "text", autoComplete: "name", required: true, className: "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", value: name, onChange: (e) => setName(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { id: "isNonProfit", name: "isNonProfit", type: "checkbox", className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded", checked: isNonProfit, onChange: (e) => setIsNonProfit(e.target.checked) }), (0, jsx_runtime_1.jsx)("label", { htmlFor: "isNonProfit", className: "ml-2 block text-sm text-gray-900", children: "Register as a Nonprofit Organization" })] }), isNonProfit && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "organizationName", className: "block text-sm font-medium text-gray-700", children: "Organization Name" }), (0, jsx_runtime_1.jsx)("input", { id: "organizationName", name: "organizationName", type: "text", required: true, className: "mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", value: organizationName, onChange: (e) => setOrganizationName(e.target.value) })] }))] })), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: isLogin ? 'Login' : 'Sign Up' }) })] })] }) }));
}
exports.default = AuthPage;
