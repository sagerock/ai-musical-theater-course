import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attachmentApi, projectApi, chatApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import LibraryChatModal from './LibraryChatModal';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  PlusIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';

export default function StudentLibrary({ selectedCourseId, selectedCourse, currentUser }) {
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState([]);
  const [filteredAttachments, setFilteredAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [libraryProjectId, setLibraryProjectId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef();

  useEffect(() => {
    if (selectedCourseId && currentUser) {
      loadAttachments();
      findOrCreateLibraryProject();
    }
  }, [selectedCourseId, currentUser]);

  useEffect(() => {
    applyFilters();
  }, [attachments, searchTerm, sortBy]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const attachmentsData = await attachmentApi.getStudentAttachments(
        selectedCourseId, 
        currentUser.id
      );
      
      // Map the data structure with file type inference
      const mappedAttachments = attachmentsData.map(attachment => {
        // Infer file type from file name if fileType is missing
        let inferredFileType = attachment.fileType || attachment.file_type;
        const fileName = attachment.fileName || attachment.file_name || 'Unknown File';
        
        if (!inferredFileType || inferredFileType === 'application/pdf') {
          const lowerFileName = fileName.toLowerCase();
          if (lowerFileName.endsWith('.txt')) {
            inferredFileType = 'text/plain';
          } else if (lowerFileName.endsWith('.doc')) {
            inferredFileType = 'application/msword';
          } else if (lowerFileName.endsWith('.docx')) {
            inferredFileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (lowerFileName.endsWith('.pdf')) {
            inferredFileType = 'application/pdf';
          } else {
            inferredFileType = 'application/pdf';
          }
        }
        
        return {
          ...attachment,
          file_name: fileName,
          file_size: attachment.fileSize || attachment.file_size || 0,
          file_type: inferredFileType,
          uploaded_at: attachment.createdAt || attachment.uploaded_at || attachment.uploadedAt,
          storage_path: attachment.storagePath || attachment.storage_path || attachment.storageRef,
          project_title: attachment.project?.title || attachment.chats?.projects?.title || 'Unknown Project'
        };
      });
      
      // Deduplicate by file name and size, keeping the newest version
      const uniqueAttachments = [];
      const seenFiles = new Map();
      
      // Sort by date first (newest first) so we keep the newest when deduplicating
      mappedAttachments.sort((a, b) => {
        const dateA = a.uploaded_at ? (a.uploaded_at.toDate ? a.uploaded_at.toDate() : new Date(a.uploaded_at)) : new Date(0);
        const dateB = b.uploaded_at ? (b.uploaded_at.toDate ? b.uploaded_at.toDate() : new Date(b.uploaded_at)) : new Date(0);
        return dateB - dateA;
      });
      
      mappedAttachments.forEach(attachment => {
        const key = `${attachment.file_name}_${attachment.file_size}`;
        
        if (!seenFiles.has(key)) {
          seenFiles.set(key, true);
          uniqueAttachments.push(attachment);
        }
      });
      
      console.log(`📚 Student Library: Loaded ${uniqueAttachments.length} files`);
      setAttachments(uniqueAttachments);
    } catch (error) {
      console.error('Error loading library:', error);
      toast.error('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attachments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(attachment =>
        attachment.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attachment.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.uploaded_at ? (a.uploaded_at.toDate ? a.uploaded_at.toDate() : new Date(a.uploaded_at)) : new Date(0);
          const dateB = b.uploaded_at ? (b.uploaded_at.toDate ? b.uploaded_at.toDate() : new Date(b.uploaded_at)) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.uploaded_at ? (a.uploaded_at.toDate ? a.uploaded_at.toDate() : new Date(a.uploaded_at)) : new Date(0);
          const dateB = b.uploaded_at ? (b.uploaded_at.toDate ? b.uploaded_at.toDate() : new Date(b.uploaded_at)) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'filename':
        filtered.sort((a, b) => a.file_name.localeCompare(b.file_name));
        break;
      case 'project':
        filtered.sort((a, b) => (a.project_title || '').localeCompare(b.project_title || ''));
        break;
      case 'size':
        filtered.sort((a, b) => {
          const sizeA = a.file_size || 0;
          const sizeB = b.file_size || 0;
          return sizeB - sizeA;
        });
        break;
      default:
        break;
    }

    setFilteredAttachments(filtered);
  };

  const handleDownloadFile = async (attachment) => {
    try {
      console.log('📥 Downloading file:', attachment.file_name);
      
      if (attachment.downloadURL) {
        window.open(attachment.downloadURL, '_blank');
        toast.success('File download started');
      } else if (attachment.storage_path) {
        const downloadUrl = await attachmentApi.getAttachmentDownloadUrl(attachment.storage_path);
        window.open(downloadUrl, '_blank');
        toast.success('File download started');
      } else {
        throw new Error('No download URL available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const findOrCreateLibraryProject = async () => {
    try {
      // Look for existing library project
      const projects = await projectApi.getUserProjects(currentUser.id);
      const libraryProject = projects.find(p => 
        p.courseId === selectedCourseId && 
        p.title === 'My Document Library'
      );

      if (libraryProject) {
        setLibraryProjectId(libraryProject.id);
      } else {
        // Create a library project for this student
        const newProject = await projectApi.createProject(
          {
            title: 'My Document Library',
            description: 'A personal library for all my course documents and resources'
          },
          currentUser.id,
          selectedCourseId
        );
        setLibraryProjectId(newProject.id);
        console.log('📚 Created library project:', newProject.id);
      }
    } catch (error) {
      console.error('Error finding/creating library project:', error);
    }
  };

  const handleChatWithDocument = (attachment) => {
    // Add the extracted text to the attachment object for the modal
    const documentWithText = {
      ...attachment,
      extractedText: attachment.extracted_text || attachment.extractedText || ''
    };
    setSelectedDocument(documentWithText);
    setShowChatModal(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['pdf', 'txt', 'docx', 'doc'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(`.${type}`));
    
    if (!isValidType) {
      toast.error('Supported formats: PDF, TXT, DOC, DOCX');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Create a library chat entry for this upload
      const chatData = {
        user_id: currentUser.id,
        created_by: currentUser.id,
        project_id: libraryProjectId,
        tool_used: 'Library Upload',
        prompt: `Uploaded ${file.name} to library`,
        response: 'Document successfully added to your library',
        title: `Library: ${file.name}`
      };
      
      const tempChat = await chatApi.createChat(chatData, selectedCourseId);
      
      // Upload the file as an attachment
      const attachment = await attachmentApi.uploadPDFAttachment(
        file,
        tempChat.id,
        currentUser.id
      );
      
      toast.success('Document uploaded to library!');
      
      // Reload attachments to show the new file
      loadAttachments();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
    } else if (fileType === 'text/plain') {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileType === 'application/msword' || 
               fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <DocumentTextIcon className="h-5 w-5 text-indigo-500" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  };

  const getFileTypeLabel = (fileType, fileName) => {
    if (fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
      return 'PDF';
    } else if (fileType === 'text/plain' || fileName?.toLowerCase().endsWith('.txt')) {
      return 'TXT';
    } else if (fileType === 'application/msword' || fileName?.toLowerCase().endsWith('.doc')) {
      return 'DOC';
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileName?.toLowerCase().endsWith('.docx')) {
      return 'DOCX';
    }
    return 'File';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpenIcon className="h-7 w-7 mr-2 text-primary-600" />
            My Library
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            All your uploaded documents for {selectedCourse?.name || 'this course'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{attachments.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="flex items-center space-x-2">
            {libraryProjectId && (
              <button
                onClick={() => navigate(`/chat/${libraryProjectId}`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                title="View all library chat conversations"
              >
                <HistoryIcon className="h-5 w-5 mr-2" />
                Chat History
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !libraryProjectId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="filename">File Name</option>
              <option value="project">Project</option>
              <option value="size">File Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredAttachments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload files in your projects to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredAttachments.map((attachment) => (
              <div key={attachment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getFileIcon(attachment.file_type)}
                    <span className="ml-2 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {getFileTypeLabel(attachment.file_type, attachment.file_name)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleChatWithDocument(attachment)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Chat with document"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadFile(attachment)}
                      className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 truncate mb-1" title={attachment.file_name}>
                  {attachment.file_name}
                </h3>
                
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <FolderIcon className="h-3 w-3 mr-1" />
                    <span className="truncate" title={attachment.project_title}>
                      {attachment.project_title || 'Unknown Project'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    <span>
                      {(() => {
                        try {
                          if (attachment.uploaded_at) {
                            const date = attachment.uploaded_at.toDate ? 
                              attachment.uploaded_at.toDate() : 
                              new Date(attachment.uploaded_at);
                            return format(date, 'MMM dd, yyyy');
                          }
                          return 'Unknown date';
                        } catch (error) {
                          return 'Invalid date';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {formatFileSize(attachment.file_size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {attachments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Library Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attachments.length}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatFileSize(attachments.reduce((sum, att) => {
                  const fileSize = att.file_size || 0;
                  return sum + (isNaN(fileSize) ? 0 : fileSize);
                }, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(attachments.map(att => att.project_title)).size}
              </div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const types = new Set(attachments.map(att => 
                    getFileTypeLabel(att.file_type, att.file_name)
                  ));
                  return types.size;
                })()}
              </div>
              <div className="text-sm text-gray-600">File Types</div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      <LibraryChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        document={selectedDocument}
        currentUser={currentUser}
        courseId={selectedCourseId}
        projectId={libraryProjectId}
      />
    </div>
  );
}