import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy /profile route redirecting to the Phase 5 Settings Section.
 */
export const ProfilePage = () => {
  return <Navigate to="/settings/profile" replace />;
};

export default ProfilePage;
