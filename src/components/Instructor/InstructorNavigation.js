import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CogIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  {
    name: 'Overview',
    href: '/instructor/overview',
    icon: ChartBarIcon,
    description: 'Course statistics and quick metrics'
  },
  {
    name: 'Student Activity',
    href: '/instructor/activity',
    icon: UsersIcon,
    description: 'View and filter student AI interactions'
  },
  {
    name: 'Students',
    href: '/instructor/students',
    icon: UserGroupIcon,
    description: 'Manage students and course membership'
  },
  {
    name: 'Messaging',
    href: '/instructor/messaging',
    icon: EnvelopeIcon,
    description: 'Send messages to students'
  },
  {
    name: 'Files',
    href: '/instructor/files',
    icon: DocumentTextIcon,
    description: 'Manage PDF attachments and downloads'
  },
  {
    name: 'Course Settings',
    href: '/instructor/course-settings',
    icon: CogIcon,
    description: 'Manage tags and course configuration'
  },
  {
    name: 'AI Assistant',
    href: '/instructor/ai-assistant',
    icon: ChatBubbleLeftRightIcon,
    description: 'Chat with AI about teaching strategies'
  }
];

export default function InstructorNavigation() {
  const location = useLocation();

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-gray-700 focus:z-10 whitespace-nowrap
                ${isActive
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                {item.description}
              </div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}