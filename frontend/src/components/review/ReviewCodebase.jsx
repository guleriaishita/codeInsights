import React, { useState } from 'react';
import { useNavigate } from 'react-router';
const ReviewCodebase = () => {
  const navigate = useNavigate();
  const [folderContents, setFolderContents] = useState([]);
  const [complianceFile, setComplianceFile] = useState(null);
  const [modelType, setModelType] = useState('Gpt4o_mini');
  const [provider, setProvider] = useState('Gpt');

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files).map((file) => ({
        name: file.name,
        path: file.webkitRelativePath || file.name, // handle path for regular files
        file,
      }));
      console.log("Uploaded files:", fileList);
      setFolderContents(fileList);
    } else {
      console.error("No files were uploaded.");
    }
  };

  const handleComplianceFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComplianceFile(file);
    } else {
      console.error("No compliance file uploaded.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
  
    folderContents.forEach(file => {
      formData.append('codebaseFolder', file.file);
    });
  
    if (complianceFile) {
      formData.append('complianceFile', complianceFile);
    }
  
    formData.append('modelType', modelType);
    formData.append('provider', provider);

    try {
      const response = await fetch('http://localhost:5000/api/analyzecodebase', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Handle the response data as needed in your UI
      console.log('Review started:', result.reviewData);
      navigate('/analyzefile');
    
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white">
        <div className="container px-8">
          <div className="flex h-16 items-center">
            <div className="flex items-center text-xl font-medium">
              <div className="flex items-start">  
                <img src="../../../public/Logo.png" alt="CodeInsight Logo" className="h-8 w-8" />
                <span className="ml-2">Code Insight</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 pt-12 pb-8 mt-10">
        <h2 className="text-2xl font-bold text-center mb-6">Review Your CodeBase</h2>

        <form onSubmit={handleSubmit}>
          <div className="rounded-lg p-8">
            <div className="space-y-6">
              {/* Folder Input */}
              <div className="relative">
                <label className="block text-me mb-1">
                  <span className="text-red-500 mr-1">*</span>
                  CodeBase Folder:
                </label>
                <div className="relative">
                  <input
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    onChange={handleFolderSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                    multiple
                  />
                  <div className="w-full px-3 py-2 border border-purple-400 rounded text-gray-500">
                    {folderContents.length > 0 ? `${folderContents.length} files selected` : 'Select a folder'}
                  </div>
                </div>
              </div>

              {/* Model Type and Provider */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-me mb-1">Provider:</label>
                  <div className="relative">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-400 rounded appearance-none bg-white pr-8"
                    >
                      <option value="Gpt">Gpt</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-me mb-1">Model Type:</label>
                  <div className="relative">
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-400 rounded appearance-none bg-white pr-8"
                    >
                      <option value="Gpt4o_mini">Gpt4o_mini</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance File Path */}
              <div>
                <label className="block text-me mb-1">Compliance File Path:</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleComplianceFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full px-3 py-2 border border-purple-400 rounded text-gray-500">
                    {complianceFile ? complianceFile.name : 'Select a compliance file'}
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              type="submit"
              className="w-full mt-6 bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 
                       transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewCodebase;
