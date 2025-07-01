"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
require("./App.css");
const HomePage_1 = __importDefault(require("./pages/HomePage"));
const AuthPage_1 = __importDefault(require("./pages/AuthPage"));
const ServiceDetailPage_1 = __importDefault(require("./pages/ServiceDetailPage"));
const ProfileDashboardPage_1 = __importDefault(require("./pages/ProfileDashboardPage"));
function App() {
    return ((0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsxs)(react_router_dom_1.Routes, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/", element: (0, jsx_runtime_1.jsx)(AuthPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/home", element: (0, jsx_runtime_1.jsx)(HomePage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/services/:id", element: (0, jsx_runtime_1.jsx)(ServiceDetailPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "/profile", element: (0, jsx_runtime_1.jsx)(ProfileDashboardPage_1.default, {}) })] }) }));
}
exports.default = App;
