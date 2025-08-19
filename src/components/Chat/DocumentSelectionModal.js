import React, { useState, useEffect } from 'react';
import { attachmentApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import {
  XMarkIcon,
  ComputerDesktopIcon,
  FolderOpenIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function DocumentSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectDocument,
  courseId,
  userId,
  currentProjectId
}) {
  const [activeTab, setActiveTab] = useState('upload');
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [hasPersonalDocs, setHasPersonalDocs] = useState(false);
  const [hasCourseMaterials, setHasCourseMaterials] = useState(false);

  useEffect(() => {
    if (isOpen && courseId && userId) {
      loadDocuments();
    }
  }, [isOpen, courseId, userId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Load personal documents
      const personalDocs = await attachmentApi.getStudentAttachments(courseId, userId);
      setPersonalDocuments(personalDocs);
      setHasPersonalDocs(personalDocs.length > 0);
      
      // Load course materials
      const materials = await attachmentApi.getVisibleCourseMaterials(courseId);
      setCourseMaterials(materials);
      setHasCourseMaterials(materials.length > 0);
      
      // Set initial tab based on available content
      if (personalDocs.length === 0 && materials.length === 0) {
        setActiveTab('upload');
      } else if (personalDocs.length > 0) {
        setActiveTab('personal');
      } else if (materials.length > 0) {
        setActiveTab('course');
      }
      
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onSelectDocument(file, 'upload');
      onClose();
    }
  };

  const handleSelectLibraryDocument = () => {
    if (selectedDocument) {
      onSelectDocument(selectedDocument, activeTab === 'personal' ? 'personal' : 'course');
      onClose();
    }
  };

  const getFilteredDocuments = (documents) => {
    if (!searchTerm) return documents;
    
    return documents.filter(doc => {
      const fileName = doc.file_name || doc.fileName || '';
      const title = doc.title || '';
      const projectTitle = doc.project_title || '';
      
      return fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType, fileName) => {
    const name = fileName?.toLowerCase() || '';
    const type = fileType?.toLowerCase() || '';
    
    let color = 'text-gray-500';
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      color = 'text-red-500';
    } else if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
      color = 'text-blue-500';
    } else if (type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
      color = 'text-orange-500';
    } else if (type.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
      color = 'text-green-500';
    } else if (type.includes('text') || name.endsWith('.txt')) {
      color = 'text-gray-700';
    }
    
    return <DocumentTextIcon className={`h-5 w-5 ${color}`} />;
  };

  if (!isOpen) return null;

  // Build tabs array based on available content
  const tabs = [
    { id: 'upload', label: 'Upload from Computer', icon: ComputerDesktopIcon, always: true }
  ];
  
  if (hasPersonalDocs) {
    tabs.push({ 
      id: 'personal', 
      label: `My Documents (${personalDocuments.length})`, 
      icon: FolderOpenIcon 
    });
  }
  
  if (hasCourseMaterials) {
    tabs.push({ 
      id: 'course', 
      label: `Course Materials (${courseMaterials.length})`, 
      icon: BookOpenIcon 
    });
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Add Document to Chat
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <div className="p-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF (with OCR), Word, TXT, PowerPoint, Excel up to 10MB
                    </p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 cursor-pointer transition-colors"
                    >
                      <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                      Choose File
                    </label>
                  </div>
                </div>
              )}

              {(activeTab === 'personal' || activeTab === 'course') && (
                <div className="flex flex-col h-full">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {(() => {
                        const documents = activeTab === 'personal' 
                          ? getFilteredDocuments(personalDocuments)
                          : getFilteredDocuments(courseMaterials);
                        
                        if (documents.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              {searchTerm ? 'No documents found matching your search' : 'No documents available'}
                            </div>
                          );
                        }
                        
                        return documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedDocument?.id === doc.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                {getFileIcon(doc.file_type || doc.fileType, doc.file_name || doc.fileName)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {doc.title || doc.file_name || doc.fileName}
                                    </h4>
                                    {selectedDocument?.id === doc.id && (
                                      <CheckCircleIcon className="h-5 w-5 text-primary-600 ml-2 flex-shrink-0" />
                                    )}
                                  </div>
                                  {doc.description && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">{doc.description}</p>
                                  )}
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                                    {activeTab === 'personal' && doc.project_title && (
                                      <span>{doc.project_title}</span>
                                    )}
                                    {activeTab === 'course' && doc.category && (
                                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                        {doc.category}
                                      </span>
                                    )}
                                    <span>{formatFileSize(doc.file_size || doc.fileSize)}</span>
                                    <span>
                                      {doc.uploaded_at ? 
                                        format(
                                          doc.uploaded_at.toDate ? doc.uploaded_at.toDate() : new Date(doc.uploaded_at),
                                          'MMM dd, yyyy'
                                        ) : 
                                        'Unknown date'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleSelectLibraryDocument}
                      disabled={!selectedDocument}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                        selectedDocument
                          ? 'text-white bg-primary-600 hover:bg-primary-700'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      {selectedDocument ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          Add Selected Document
                        </>
                      ) : (
                        'Select a document to add'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}