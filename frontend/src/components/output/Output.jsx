import React from 'react';
import { useNavigate } from 'react-router';
const Output = () => {
  const navigate = useNavigate();

  const handleGenerated_guide = () => {
    navigate('/output/generated_guidelines_docs');
  }
  const handleGenerated_files = () => {
    navigate('/output/generated_analyzed_files_docs');
  }
  


  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white">
        <div className="container px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and text */}
            <div className="flex items-center text-xl font-medium">
              <div className="flex items-start">  
                <img src="../../../public/Logo.png" alt="CodeInsight Logo" className="h-8 w-8" />
                <span className="ml-2">Code Insight</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Added more top padding */}
      <div className="container mx-auto px-4 py-40">
        {/* Grid container for first row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto mb-10">
          {/* Generated Guideline Documents */}
          <div 
            onClick={handleGenerated_guide}
            className="border rounded-lg p-8 flex flex-col items-center justify-center space-y-4 hover:border-purple-400 transition-colors cursor-pointer"
          >
            <img 
              src="../../../public/generatedguidelinesdocs.png" 
              alt="Download Icon" 
              className="w-12 h-12"
            />
            <h3 className="text-center font-medium">Generated Guideline Documents</h3>
            <button 
              onClick={(e) => e.stopPropagation()} 
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Download Your Generated Documents
            </button>
          </div>

          {/* Generate Knowledge Graph */}
          <div 
            
            className="border rounded-lg p-8 flex flex-col items-center justify-center space-y-4 hover:border-purple-400 transition-colors cursor-pointer"
          >
            <img 
              src="../../../public/generateknowledgegraph.png" 
              alt="Knowledge Graph Icon" 
              className="w-12 h-12"
            />
            <h3 className="text-center font-medium">Generate Knowledge Graph for codebase</h3>
            <button 
              onClick={(e) => e.stopPropagation()} 
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Explore and Download Knowledge Graph
            </button>
          </div>
        </div>

        {/* Centered third box */}
        <div className="max-w-md mx-auto">
          <div 
            onClick={handleGenerated_files}
            className="border rounded-lg p-8 flex flex-col items-center justify-center space-y-4 hover:border-purple-400 transition-colors cursor-pointer"
          >
            <img 
              src="../../../public/generateanalyzedfile.png" 
              alt="Folder Icon" 
              className="w-12 h-12"
            />
            <h3 className="text-center font-medium">Generated Analyzed Files</h3>
            <button 
              onClick={(e) => e.stopPropagation()} 
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Download Your Generated Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Output;