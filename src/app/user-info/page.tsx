"use client";

import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, updateUserProfile } from './user-info-backend';
import { UserSecurityProfile } from '@/types/firebase';

// interface OAuthToken {
//   accessToken: string;
//   refreshToken: string;
//   expiryDate: number;
// }

// interface User {
//   id: string;
//   fullName: string;
//   preferredName: string;
//   loginEmail: string;
//   communicationEmail: string;
//   tokens: OAuthToken[];
// }

const UserInfoPage = () => {
  const [user, setUser] = useState<UserSecurityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // TODO: Implement fetching user data based on login email
  useEffect(() => {
    const fetchUser = async () => {
      // Placeholder for fetching user data
      // In a real application, you would get the user's email
      // from the authenticated session and call a backend API or function
      // to get the user data from Firestore.
      // // For now, we'll use a mock user.
      // const mockUser: User = {
      //   id: '123',
      //   fullName: 'John Doe',
      //   preferredName: 'Johnny',
      //   loginEmail: 'john.doe@example.com',
      //   communicationEmail: 'john.doe.comm@example.com',
      //   tokens: [
      //     { accessToken: 'abc', refreshToken: 'def', expiryDate: Date.now() + 3600000 },
      //     { accessToken: 'ghi', refreshToken: 'jkl', expiryDate: Date.now() + 7200000 },
      //   ],
      // };
      // setUser(mockUser);

      // Suggested code may be subject to a license. Learn more: ~LicenseLog:3301030935.
      try {
        const userData = await getCurrentUserProfile();
        setUser(userData);
      } catch (error) {
        console.error("**UserInfoPage** Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSave = async () => {
    console.log("Saving user data:", user);
    if (user) {

      try {
        await updateUserProfile(user);
      } catch (error) {
        console.error("**handleSave** Error saving user data:", error);
      }
      finally {
        setLoading(false);
      }
      
    };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prevUser => prevUser ? { ...prevUser, [name]: value } : null);
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>Error loading user data.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name:</label>
          {editing ? (
            <input
              type="text"
              name="full_name"
              value={user.full_name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : (
            <p className="mt-1 text-gray-900">{user.full_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Preferred Name:</label>
          {editing ? (
            <input
              type="text"
              name="preferred_name"
              value={user.preferred_name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : (
            <p className="mt-1 text-gray-900">{user.preferred_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Login Email:</label>
          <p className="mt-1 text-gray-900">{user.login_email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Communication Email:</label>
          {editing ? (
            <input
              type="text"
              name="communication_email"
              value={user.communication_email}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : (
            <p className="mt-1 text-gray-900">{user.communication_email}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Tokens</h2>
        {user.tokens && user.tokens?.length > 0 ? (
          <ul>
            {user.tokens.map((token, index) => (
              <li key={index} className="mb-2 border p-2 rounded">
                <p><strong>Access Token:</strong> {token.access_token}</p>
                <p><strong>Refresh Token:</strong> {token.refresh_token}</p>
                <p><strong>Expiry In:</strong> {token.expires_in}</p>
                <p><strong>Expiry Date:</strong> {new Date(token.payload.exp * 1000).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tokens available.</p>
        )}
      </div>

      <div className="mt-6">
        {editing ? (
          <button
            onClick={handleSave}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        ) : (
          <button
            onClick={handleEditToggle}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default UserInfoPage;