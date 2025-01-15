import React, { useState } from 'react';

const GeneratedAnalyzedFiles = () => {
  const [tableData, setTableData] = useState([
    {
      id: 1,
      content: 'Review',
      fileName: 'Review.txt',
      filePath: '/files/Review.txt'
    },
    {
      id: 2,
      content: 'Documentation',
      fileName: 'Documentation_file.txt',
      filePath: '/files/Documentation_file.txt'
    },
    {
      id: 3,
      content: 'Review',
      fileName: 'Review.txt',
      filePath: '/files/Review.txt'
    },
    {
      id: 4,
      content: 'Comments',
      fileName: 'Comments.txt',
      filePath: '/files/Comments.txt'
    }
  ]);

  const handleDelete = (id) => {
    setTableData(tableData.filter(item => item.id !== id));
  };

  const handleDownload = async (filename, filePath) => {
    try {
      // You'll need to replace this with your actual API endpoint
      const response = await fetch(filePath);
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-White-50">
      {/* Navigation Bar */}
      <nav className="bg-white">
        <div className="container px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center text-xl font-medium">
              <div className="flex items-start">  
                <img src="../../../public/Logo.png" alt="CodeInsight Logo" className="h-8 w-8" />
                <span className="ml-2">Code Insight</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 mt-20">
          <h1 className="text-2xl font-semibold text-indigo-600">
            Generated Analyzed Files
          </h1>
          <div className="mt-2 h-1 w-48 bg-indigo-500 mx-auto rounded-full"></div>
        </div>

        {/* Downloads Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Downloads</h2>

          {/* Table */}
          <div className="overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-full divide-y divide-purple-200">
                {/* Table Header */}
                <thead className="bg-purple-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Files Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Download Files
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Delete
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleDownload(row.fileName, row.filePath)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150"
                        >
                          <svg 
                            className="h-5 w-5 mr-1" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Link
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleDelete(row.id)}
                          className="text-red-600 hover:text-red-800 transition duration-150"
                        >
                          <svg 
                            className="h-5 w-5" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedAnalyzedFiles;