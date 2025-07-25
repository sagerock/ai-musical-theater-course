import React, { useState, useEffect } from 'react';
import { attachmentApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  FolderIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function FileManagement({ selectedCourseId, selectedCourse, currentUser }) {
  const [attachments, setAttachments] = useState([]);
  const [filteredAttachments, setFilteredAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (selectedCourseId) {
      loadAttachments();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    applyFilters();
  }, [attachments, searchTerm, sortBy]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const attachmentsData = await attachmentApi.getCourseAttachments(selectedCourseId, currentUser.id);
      
      // Map the data structure to match what the component expects
      const mappedAttachments = attachmentsData.map(attachment => ({
        ...attachment,
        student_name: attachment.chats?.users?.name || 'Unknown Student',
        project_title: attachment.chats?.projects?.title || 'Unknown Project'
      }));
      
      setAttachments(mappedAttachments);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Failed to load attachments');
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
        attachment.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attachment.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.uploaded_at ? new Date(a.uploaded_at) : new Date(0);
          const dateB = b.uploaded_at ? new Date(b.uploaded_at) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.uploaded_at ? new Date(a.uploaded_at) : new Date(0);
          const dateB = b.uploaded_at ? new Date(b.uploaded_at) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'filename':
        filtered.sort((a, b) => a.file_name.localeCompare(b.file_name));
        break;
      case 'student':
        filtered.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
        break;
      case 'size':
        filtered.sort((a, b) => b.file_size - a.file_size);
        break;
      default:
        break;
    }

    setFilteredAttachments(filtered);
  };

  const handleDownloadPDF = async (attachment) => {
    try {
      console.log('📎 Downloading PDF:', attachment.file_name);
      const downloadUrl = await attachmentApi.getAttachmentDownloadUrl(attachment.storage_path);
      
      // Open in new tab for download
      window.open(downloadUrl, '_blank');
      toast.success('PDF download started');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
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
          <h2 className="text-lg font-semibold text-gray-900">File Management</h2>
          <p className="text-sm text-gray-600">
            {filteredAttachments.length} of {attachments.length} files
          </p>
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
                placeholder="Search files, students, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="filename">File Name</option>
              <option value="student">Student Name</option>
              <option value="size">File Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredAttachments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No files have been uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAttachments.map((attachment) => (
              <div key={attachment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* File Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getFileIcon(attachment.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {attachment.file_name}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {formatFileSize(attachment.file_size)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="h-4 w-4" />
                          <span className="truncate">
                            {attachment.student_name || 'Unknown Student'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FolderIcon className="h-4 w-4" />
                          <span className="truncate">
                            {attachment.project_title || 'Unknown Project'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>
                            {attachment.uploaded_at 
                              ? format(new Date(attachment.uploaded_at), 'MMM dd, yyyy')
                              : 'Unknown date'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleDownloadPDF(attachment)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">File Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{attachments.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(attachments.reduce((sum, att) => sum + att.file_size, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(attachments.map(att => att.student_name)).size}
            </div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
        </div>
      </div>
    </div>
  );
}