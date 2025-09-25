import React from 'react';
import DriverSelectionModal from './DriverSelectionModal';
import { UserProfile } from '../../contexts/AuthContext';
import { Child } from '../../pages/parent/ParentDashboard';
import { SiblingGroup } from '../../interfaces/personalization';

interface SiblingGroupDriverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  siblingGroup: SiblingGroup;
  children: { id: string; name: string; school: string }[];
  onDriverSelect: (driver: UserProfile) => void;
}

const SiblingGroupDriverSelectionModal: React.FC<SiblingGroupDriverSelectionModalProps> = ({
  isOpen,
  onClose,
  siblingGroup,
  children,
  onDriverSelect
}) => {
  // For sibling groups, we'll use the first child as a reference for driver selection
  // but show all children in the group
  const firstChild = siblingGroup.childIds.length > 0 
    ? children.find(child => child.id === siblingGroup.childIds[0])
    : null;

  if (!firstChild) {
    return null;
  }

  // Convert to the expected Child format for DriverSelectionModal
  const childForDriverSelection: Child = {
    id: firstChild.id,
    fullName: firstChild.name,
    firstName: firstChild.name.split(' ')[0] || '',
    lastName: firstChild.name.split(' ').slice(1).join(' ') || '',
    schoolName: firstChild.school,
    schoolLocation: { lat: 0, lng: 0, address: firstChild.school },
    tripStartLocation: { lat: 0, lng: 0, address: siblingGroup.defaultPickupLocation }
  };

  return (
    <DriverSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      child={childForDriverSelection}
      onDriverSelect={onDriverSelect}
    />
  );
};

export default SiblingGroupDriverSelectionModal;