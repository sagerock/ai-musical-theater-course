import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attachmentApi, projectApi, chatApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  BookOpenIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  TagIcon,
  UsersIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function InstructorLibrary({ selectedCourseId, selectedCourse, currentUser }) {
  const navigate = useNavigate();
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const fileInputRef = React.useRef();

  const MATERIAL_CATEGORIES = [
    { value: 'syllabus', label: 'Syllabus', icon: AcademicCapIcon },
    { value: 'required', label: 'Required Reading', icon: DocumentTextIcon },
    { value: 'supplemental', label: 'Supplemental', icon: BookOpenIcon },
    { value: 'template', label: 'Templates', icon: DocumentIcon },
    { value: 'assignment', label: 'Assignments', icon: PencilIcon },
    { value: 'resource', label: 'Resources', icon: FolderIcon }
  ];

  useEffect(() => {
    if (selectedCourseId && currentUser) {
      loadCourseMaterials();
    }
  }, [selectedCourseId, currentUser]);

  useEffect(() => {
    applyFilters();
  }, [courseMaterials, searchTerm, sortBy, selectedCategory]);

  const loadCourseMaterials = async () => {
    try {
      setLoading(true);
      console.log('📚 InstructorLibrary: Starting to load materials for course:', selectedCourseId);
      const materials = await attachmentApi.getCourseMaterials(selectedCourseId);

      console.log(`📚 InstructorLibrary: Loaded ${materials.length} course materials for course ${selectedCourseId}`);
      console.log('📚 InstructorLibrary: Materials detail:', materials);
      setCourseMaterials(materials);
    } catch (error) {
      console.error('❌ InstructorLibrary: Error loading course materials:', error);
      toast.error('Failed to load course materials');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courseMaterials];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
        filtered.sort((a, b) => (a.file_name || '').localeCompare(b.file_name || ''));
        break;
      case 'category':
        filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      default:
        break;
    }

    setFilteredMaterials(filtered);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['pdf', 'txt', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some(type => fileName.endsWith(`.${type}`));
    
    if (!isValidType) {
      toast.error('Supported formats: PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX');
      return;
    }

    // Validate file size (max 25MB for course materials)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 25MB');
      return;
    }

    setUploading(true);

    try {
      // Upload as course material
      const materialData = {
        file,
        courseId: selectedCourseId,
        uploadedBy: currentUser.id,
        category: 'resource', // Default category
        visibility: 'visible', // Default visibility
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
        description: ''
      };
      
      // Upload course material
      const result = await attachmentApi.uploadCourseMaterial(materialData);

      console.log('📚 InstructorLibrary: Upload result:', result);
      toast.success('Course material uploaded successfully!');

      // Reload materials after upload
      console.log('📚 InstructorLibrary: Reloading materials after upload...');
      await loadCourseMaterials();
      
    } catch (error) {
      console.error('Error uploading course material:', error);
      toast.error('Failed to upload course material');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this course material?')) {
      return;
    }

    try {
      await attachmentApi.deleteCourseMaterial(materialId);
      toast.success('Material deleted successfully');
      loadCourseMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleUpdateMaterial = async (materialId, updates) => {
    try {
      await attachmentApi.updateCourseMaterial(materialId, updates);
      toast.success('Material updated successfully');
      setEditingMaterial(null);
      loadCourseMaterials();
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
    }
  };

  const handleToggleVisibility = async (material) => {
    const newVisibility = material.visibility === 'visible' ? 'hidden' : 'visible';
    await handleUpdateMaterial(material.id, { visibility: newVisibility });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    
    if (fileType.includes('pdf')) {
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('presentation') || fileType.includes('ppt')) {
      return <DocumentTextIcon className="h-5 w-5 text-orange-500" />;
    } else if (fileType.includes('sheet') || fileType.includes('xls')) {
      return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  };

  const getCategoryIcon = (category) => {
    const cat = MATERIAL_CATEGORIES.find(c => c.value === category);
    const IconComponent = cat?.icon || DocumentIcon;
    return <IconComponent className="h-4 w-4" />;
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
            Course Library Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage shared materials for {selectedCourse?.name || 'this course'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{courseMaterials.length}</div>
            <div className="text-sm text-gray-600">Total Materials</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
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
                Upload Material
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document Capabilities Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
        <div className="flex items-start">
          <CloudArrowUpIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Supported formats:</span> PDF (with OCR for scanned docs), Word (.doc/.docx), 
            Text (.txt), PowerPoint (.ppt/.pptx), Excel (.xls/.xlsx) up to 25MB • 
            <span className="font-semibold">Text extraction:</span> Automatic for PDF/Word/TXT - students can search & chat with content • 
            <span className="font-semibold">Visibility:</span> Control what students see with the eye icon
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {MATERIAL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
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
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No materials found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Upload course materials to share with students'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getFileIcon(material.file_type)}
                    <div className="flex-1 min-w-0">
                      {editingMaterial === material.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            defaultValue={material.title || material.file_name}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Title"
                            id={`title-${material.id}`}
                          />
                          <textarea
                            defaultValue={material.description || ''}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Description (optional)"
                            rows="2"
                            id={`desc-${material.id}`}
                          />
                          <select
                            defaultValue={material.category || 'resource'}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            id={`cat-${material.id}`}
                          >
                            {MATERIAL_CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const title = document.getElementById(`title-${material.id}`).value;
                                const description = document.getElementById(`desc-${material.id}`).value;
                                const category = document.getElementById(`cat-${material.id}`).value;
                                handleUpdateMaterial(material.id, { title, description, category });
                              }}
                              className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMaterial(null)}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium text-gray-900">
                            {material.title || material.file_name}
                          </h3>
                          {material.description && (
                            <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center">
                              {getCategoryIcon(material.category)}
                              <span className="ml-1">
                                {MATERIAL_CATEGORIES.find(c => c.value === material.category)?.label || 'Resource'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {material.uploaded_at ? format(new Date(material.uploaded_at), 'MMM dd, yyyy') : 'Unknown date'}
                            </div>
                            <div>{formatFileSize(material.file_size)}</div>
                            <div className="flex items-center">
                              {material.visibility === 'visible' ? (
                                <>
                                  <EyeIcon className="h-3 w-3 mr-1 text-green-600" />
                                  <span className="text-green-600">Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeSlashIcon className="h-3 w-3 mr-1 text-gray-400" />
                                  <span className="text-gray-400">Hidden</span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleVisibility(material)}
                      className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                      title={material.visibility === 'visible' ? 'Hide from students' : 'Show to students'}
                    >
                      {material.visibility === 'visible' ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingMaterial(material.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => window.open(material.downloadURL, '_blank')}
                      className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {courseMaterials.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Library Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{courseMaterials.length}</div>
              <div className="text-sm text-gray-600">Total Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {courseMaterials.filter(m => m.visibility === 'visible').length}
              </div>
              <div className="text-sm text-gray-600">Visible to Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(courseMaterials.map(m => m.category)).size}
              </div>
              <div className="text-sm text-gray-600">Categories Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatFileSize(courseMaterials.reduce((sum, m) => sum + (m.file_size || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}