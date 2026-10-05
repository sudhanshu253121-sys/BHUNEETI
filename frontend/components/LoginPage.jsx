"use client";

import React, { useState } from "react";

/**
 * National Land Governance Platform (NLGP) - Secure Authentication Page
 * 
 * Tech Stack: Next.js (App Router / Pages Router compatible) + Tailwind CSS
 * Features:
 *  - Split-screen layout (Left: Form, Right: High-tech GIS Map Visualization)
 *  - Role-Based Access Control (RBAC): Citizen, Researcher, Government Official
 *  - Interactive password show/hide toggle
 *  - Real-time client validation with accessible ARIA error announcements
 *  - JWT & Redis session integration hooks
 *  - Indian Government visual design tokens (Deep Navy #0f2942, Emerald #059669)
 */

export default function LoginPage() {
  const [formData, setFormData] = useState({
    role: "Official", // "Citizen" | "Researcher" | "Official"
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState(null);

  const roles = [
    { id: "Citizen", label: "Citizen / Land Owner", desc: "View ULPIN, Bhu-Aadhar & Mutation Status" },
    { id: "Researcher", label: "Research Scholar / Academic", desc: "Access PostGIS Data & Policy RAG Papers" },
    { id: "Official", label: "Government Official", desc: "Revenue Administration, Cadastre & ML Audits" },
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier =
        formData.role === "Citizen"
          ? "Please enter your 14-digit ULPIN, Mobile, or Aadhaar."
          : "Please enter your official email or Government Employee ID.";
    }
    if (!formData.password) {
      newErrors.password = "Password is required to proceed.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginFeedback(null);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      /*
       * ======================================================================
       * BACKEND INTEGRATION POINT: JWT AUTH & REDIS SESSION
       * ======================================================================
       * 1. Send credentials to FastAPI microservice:
       *    const response = await fetch('/api/v1/auth/login', {
       *      method: 'POST',
       *      headers: { 'Content-Type': 'application/json' },
       *      body: JSON.stringify({
       *        username: formData.identifier,
       *        password: formData.password,
       *        role: formData.role
       *      })
       *    });
       *    const data = await response.json();
       * 
       * 2. Store JWT in secure HttpOnly cookie or SessionStorage:
       *    sessionStorage.setItem('access_token', data.access_token);
       * 
       * 3. Redis session caching (Handled on FastAPI server):
       *    redis_client.setex(`session:${data.user_id}`, 3600, JSON.stringify(data.claims));
       * ======================================================================
       */

      // Simulated network round-trip delay
      await new Promise((resolve) => setTimeout(resolve, 900));

      setLoginFeedback({
        type: "success",
        message: `Authentication successful as [${formData.role}]. Redirecting to Spatial Cadastre Workspace...`,
      });

      // router.push('/dashboard');
    } catch (err) {
      setLoginFeedback({
        type: "error",
        message: "Authentication failed. Invalid credentials or inactive role token.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-800">
      
      {/* =================================================================== */}
      {/* LEFT PANEL: AUTHENTICATION FORM & ROLE SELECTION                     */}
      {/* =================================================================== */}
      <main className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white border-r border-slate-200">
        
        {/* Top Header / National Branding */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#0f2942] flex items-center justify-center text-emerald-400 shadow-md">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-[#0f2942] uppercase">भारत सरकार • Government of India</span>
              <h1 className="text-base font-bold text-slate-900 leading-tight">National Land Governance Platform</h1>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#0f2942] tracking-tight">Sign in to your Portal</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your access authorization profile to verify land titles, research policy, or administer cadastres.
            </p>
          </div>

          {/* Feedback Banner */}
          {loginFeedback && (
            <div
              role="alert"
              className={`p-3.5 rounded-lg mb-5 text-xs font-medium border flex items-center space-x-2 ${
                loginFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-red-50 border-red-300 text-red-800"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>{loginFeedback.message}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* RBAC Role Selector Dropdown */}
            <div>
              <label htmlFor="rbac-role-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Access Authorization Role (RBAC) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="rbac-role-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-medium border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-transparent transition-all cursor-pointer appearance-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} — ({r.id})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {roles.find((r) => r.id === formData.role)?.desc}
              </p>
            </div>

            {/* Email / Username / ULPIN Input */}
            <div>
              <label htmlFor="identifier-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {formData.role === "Citizen" ? "ULPIN (14-Digit), Mobile, or Email" : "Official Email / Government ID"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="identifier-input"
                  type="text"
                  placeholder={
                    formData.role === "Citizen"
                      ? "e.g., 27-520-004-98124 or 9823012345"
                      : "e.g., rajesh.varma@nic.in or EMP-90214"
                  }
                  value={formData.identifier}
                  onChange={(e) => {
                    setFormData({ ...formData, identifier: e.target.value });
                    if (errors.identifier) setErrors({ ...errors, identifier: null });
                  }}
                  aria-invalid={errors.identifier ? "true" : "false"}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border transition-all ${
                    errors.identifier
                      ? "border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400"
                      : "border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                  }`}
                />
              </div>
              {errors.identifier && (
                <p id="identifier-error" className="text-[11px] text-red-600 mt-1 font-medium flex items-center">
                  <span className="mr-1">⚠</span> {errors.identifier}
                </p>
              )}
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password-input" className="block text-xs font-semibold text-slate-700">
                  Password / Passkey <span className="text-red-500">*</span>
                </label>
                <a href="#forgot" className="text-[11px] font-semibold text-blue-700 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your confidential passphrase"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-lg border transition-all ${
                    errors.password
                      ? "border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400"
                      : "border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e40af] focus:border-transparent"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-[11px] text-red-600 mt-1 font-medium flex items-center">
                  <span className="mr-1">⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember this terminal session</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">TLS 1.3 / NIC VPN</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0f2942] hover:bg-[#1e40af] text-white py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2942] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {formData.role}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Alternate SSO Logins */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block text-center mb-3">
              National Digital Identity Options
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-2 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>MeriPehchaan (SSO)</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-2 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>e-Pramaan Auth</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center text-[10px] text-slate-400 gap-2">
          <span>Protected under IT Act, 2000 & Digital Personal Data Protection (DPDP)</span>
          <div className="flex space-x-3">
            <span className="hover:text-slate-600 cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-pointer">Helpdesk 1800-11-BHU</span>
          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* RIGHT PANEL: GEOMETRIC GIS MAP & NETWORK VISUALIZATION               */}
      {/* =================================================================== */}
      <aside className="w-full lg:w-1/2 bg-[#0a1d30] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle Background Geometric Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cadastral-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.75" />
                <circle cx="40" cy="0" r="1.5" fill="#34d399" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cadastral-grid)" />
          </svg>
        </div>

        {/* Top Right Live Sync Status */}
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-300">National Cadastral Grid: Active</span>
          </div>
          <span className="text-xs font-mono text-slate-400">EPSG:4326 (WGS84)</span>
        </div>

        {/* Center Graphic & Vision Content */}
        <div className="relative z-10 my-auto py-8">
          
          {/* Abstract SVG GIS Cadastre Artwork */}
          <div className="w-full max-w-md mx-auto mb-8 relative">
            <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-2xl bg-gradient-to-tr from-blue-900/60 to-emerald-900/40 p-4 border border-blue-500/30 shadow-2xl relative flex items-center justify-center">
              
              {/* Concentric Coordinate Rings */}
              <div className="absolute inset-2 border border-blue-400/20 rounded-xl animate-pulse"></div>
              <div className="absolute inset-8 border border-emerald-400/30 rounded-lg"></div>

              {/* Cadastral Polygon Mesh */}
              <svg className="w-36 h-36 text-emerald-400" viewBox="0 0 100 100" fill="none">
                <polygon points="50,10 90,30 75,80 25,85 10,40" stroke="#10b981" strokeWidth="1.5" fill="rgba(16, 185, 129, 0.12)" />
                <polygon points="50,10 50,55 75,80" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                <polygon points="10,40 50,55 25,85" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                <circle cx="50" cy="55" r="4" fill="#38bdf8" />
                <circle cx="90" cy="30" r="3" fill="#10b981" />
                <circle cx="25" cy="85" r="3" fill="#fbbf24" />
              </svg>

              {/* Floating Data Badge 1 */}
              <div className="absolute -top-3 -right-4 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1 text-[10px] font-mono text-emerald-300 shadow">
                ULPIN: 27-520-004
              </div>

              {/* Floating Data Badge 2 */}
              <div className="absolute -bottom-3 -left-4 bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1 text-[10px] font-mono text-blue-300 shadow">
                PostGIS 3D Mesh
              </div>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
            Spatial Intelligence for Unified Land Administration
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
            Aggregating heterogeneous land records across all 28 States and 8 Union Territories through automated API Setu pipelines, Bhashini multilingual translation, and XGBoost urbanization risk models.
          </p>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
            <div>
              <div className="text-lg font-bold text-emerald-400 font-mono">34.82 Cr</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">ULPINs Generated</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400 font-mono">89.4%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cadastral Digitized</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400 font-mono">&lt; 15 ms</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Elasticsearch Latency</div>
            </div>
          </div>
        </div>

        {/* Bottom System Banner */}
        <div className="relative z-10 flex justify-between items-center text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
          <span>Department of Land Resources (DoLR) • MoRD</span>
          <span className="font-mono">v2.4.0-Production</span>
        </div>
      </aside>
    </div>
  );
}
