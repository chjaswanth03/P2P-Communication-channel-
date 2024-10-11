import React from 'react';

const UserSettings = ({ username, setUsername }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">User Settings</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded-lg w-full mt-2"
        placeholder="Update your Username"
      />
    </div>
  );
};

export default UserSettings;
