
// function App() {
//   return (
//     // <Home />
//     // <Dashboard/>
//     <GenerateGuidelines/>
//   )
// }

// export default App

// src/App.js
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoutes";
import { AuthProvider } from "./context/AuthContext";
import Home from './components/home/Home'
import Dashboard from './components/dashboard/Dashboard'
import GenerateGuidelines from "./components/generateguidelines/GenerateGuidelines"
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generateguidelines" element={<GenerateGuidelines />} />
          <Route path="/dashboard" element={<Dashboard/>} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/generateguidelines"
            element={
              <PrivateRoute>
                <GenerateGuidelines/>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
         
          

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
