
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoutes";
import { AuthProvider } from "./context/AuthContext";
import Home from './components/home/Home'
import Dashboard from './components/dashboard/Dashboard'
import GenerateGuidelines from "./components/generateguidelines/GenerateGuidelines"
import ReviewFile from "./components/review/ReviewFile";
import ReviewCodebase from "./components/review/ReviewCodebase";
import Output from "./components/output/Output";
import GeneratedGuidelinesDocument from "./components/downloads/GeneratedGuidelinesDocument";
import GeneratedAnalyzedFiles from "./components/downloads/GeneratedAnalyzedFiles";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate_guidelines" element={<GenerateGuidelines />} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/analyzecodebase" element={<ReviewCodebase/>} />
          <Route path="/analyzefile" element={<ReviewFile/>} />
          <Route path="/output" element={<Output/>} />
          <Route path="/output/generated_guidelines_docs" element={<GeneratedGuidelinesDocument/>} />
          <Route path="/output/generated_analyzed_files_docs" element={<GeneratedAnalyzedFiles/>} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/generate_guidelines"
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
          <Route
            path="/analyzecodebase"
            element={
              <PrivateRoute>
                <ReviewCodebase />
              </PrivateRoute>
            }
          />
          <Route
          path="/analyzefile"
          element={
            <PrivateRoute>
              <ReviewFile/>
            </PrivateRoute>
          }
          />
          <Route
          path="/output"
          element={
            <PrivateRoute>
              <Output/>
            </PrivateRoute>
            }
            />
            <Route
          path="/output/generated_guidelines_docs"
          element={
            <PrivateRoute>
              <GenerateGuidelines/>
            </PrivateRoute>
            }
            />
            <Route
          path="/output/generated_analyzed_files_docs"
          element={
            <PrivateRoute>
              <GeneratedAnalyzedFiles/>
            </PrivateRoute>
            }
            />
          

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
