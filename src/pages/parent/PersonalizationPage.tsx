import React from 'react';
import { PersonalizationDashboard } from '../../components/parent/PersonalizationDashboard';

export const PersonalizationPage: React.FC = () => {
  // Mock data - in real app, this would come from AuthContext and API
  const mockParentId = 'parent-123';
  const mockChildren = [
    {
      id: 'child-1',
      name: 'Emma Silva',
      school: 'Royal College Colombo'
    },
    {
      id: 'child-2', 
      name: 'Liam Silva',
      school: 'Ladies College Colombo'
    },
    {
      id: 'child-3',
      name: 'Ava Silva', 
      school: 'Trinity College Kandy'
    }
  ];

  return (
    <PersonalizationDashboard 
      parentId={mockParentId}
      children={mockChildren}
    />
  );
};