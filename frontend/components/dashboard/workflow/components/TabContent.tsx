import React from 'react';
import { FileText, Clock } from 'lucide-react';

interface TabContentProps {
  type: 'templates' | 'history';
}

export const TabContent: React.FC<TabContentProps> = ({ type }) => {
  const content = {
    templates: {
      icon: FileText,
      title: 'Templates Coming Soon',
      description: 'Pre-built workflow templates will be available here'
    },
    history: {
      icon: Clock,
      title: 'Generation History',
      description: 'Your workflow generation history will appear here'
    }
  };

  const { icon: Icon, title, description } = content[type];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-gray-400">
        <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="font-medium mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
};
