import React from 'react';
import { HODCollegeSelection } from '@/components/HODCollegeSelection';
import { useNavigate } from 'react-router-dom';

export const HODCollegeSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCollegeSelected = () => {
    // Redirect to pending approval page after college selection
    navigate('/pending-approval');
  };

  return <HODCollegeSelection onCollegeSelected={handleCollegeSelected} />;
};