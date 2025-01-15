import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewFile = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [filePath, setFilePath] = useState('');
  const [compliancePath, setCompliancePath] = useState('');
  const [additionalPaths, setAdditionalPaths] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [modelType, setModelType] = useState('Gpt4o_mini');
  const [provider, setProvider] = useState('Gpt');

  const handleOptionChange = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(item => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOptions.length === 0) {
      alert('Please select at least one option');
      return;
    }
    if (!filePath) {
      alert('Please enter a file path');
      return;
    }
    navigate('/output');
    console.log({
      selectedOptions,
      filePath,
      modelType,
      provider,
      compliancePath,
      additionalPaths
    });
  };

  const handleComplianceFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompliancePath(file.name); // Update compliancePath with selected file name
    }
  };

  const handleAdditionalFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    setAdditionalPaths(newFiles.map(f => f.name).join(', ')); // Update additionalPaths with file names
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

      <div className="max-w-3xl mx-auto px-8 pt-12 pb-8">
        <h2 className="text-2xl font-bold text-center mb-12">Review Your Code</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-12">
            <p className="mb-5 text-xl font-medium">Select Options :</p>
            <div className="flex justify-center gap-8">
              {[
                { id: 'review', label: 'Review Code' },
                { id: 'documentation', label: 'Generate Documentation' },
                { id: 'comments', label: 'Create Comments' },
              ].map((option) => (
                <label key={option.id} className="flex items-center group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="selectedOptions"
                      value={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleOptionChange(option.id)}
                      className="appearance-none w-4 h-4 rounded-full border-2 border-purple-500 
                                 checked:bg-white cursor-pointer"
                    />
                    {selectedOptions.includes(option.id) && (
                      <div className="absolute left-1 top-1 w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </div>
                  <span className="ml-2 bg-purple-500 text-white px-4 py-1 rounded-full text-me">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-8">
            <div className="space-y-6">
              {/* Main File */}
              <div className="relative">
                <label className="block text-me mb-1">
                  <span className="text-red-500 mr-1">*</span>
                  Main File:
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="mainFile"
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFilePath(e.target.files[0]?.name || '')}
                  />
                  <div className="w-full px-3 py-2 border border-purple-400 rounded text-gray-500">
                    {filePath || '/home/user/file.py'}
                  </div>
                </div>
              </div>

              {/* Model Type and Provider */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-me mb-1">Provider:</label>
                  <select
                    name="provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-400 rounded appearance-none bg-white pr-8"
                  >
                    <option value="Gpt">Gpt</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-me mb-1">Model Type:</label>
                  <select
                    name="modelType"
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-400 rounded appearance-none bg-white pr-8"
                  >
                    <option value="Gpt4o_mini">Gpt4o_mini</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Compliance File */}
              <div>
                <label className="block text-me mb-1">Compliance File:</label>
                <div className="relative">
                  <input
                    type="file"
                    name="complianceFile"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleComplianceFile}
                  />
                  <div className="w-full px-3 py-2 border border-purple-400 rounded text-gray-500">
                    {compliancePath || '/home/pidm/compliance.txt'}
                  </div>
                </div>
              </div>

              {/* Additional Files */}
              <div>
                <label className="block text-me mb-1">Additional Files:</label>
                <div className="relative">
                  <input
                    type="file"
                    name="additionalFiles"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleAdditionalFiles}
                  />
                  <div className="w-full px-3 py-2 border border-purple-400 rounded text-gray-500">
                    {additionalPaths || '/home/pidm/additionalfile.py'}
                  </div>
                </div>
                {additionalPaths && (
                  <p className="text-xs text-gray-500 mt-1">Selected files: {additionalPaths}</p>
                )}
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

export default ReviewFile;
