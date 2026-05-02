import React, { useState } from 'react';
import { generatePassword } from '../services/crypto';

const AdminAllowDownload: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [mobileNo, setMobileNo] = useState('');
  const [txnHash, setTxnHash] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && adminPass === 'pdek') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin credentials');
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo || !txnHash) return;
    const pwd = generatePassword(mobileNo, txnHash);
    setGeneratedPassword(pwd);
  };

  if (!isAuthenticated) {
    return (
      <div className="container p-6 flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="glass p-8 w-full" style={{ maxWidth: '400px', borderRadius: '1rem' }}>
          <h2 className="font-bold text-center mb-6 text-xl">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="input-field" required />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6">
      <div className="glass p-8 w-full mx-auto" style={{ maxWidth: '600px', borderRadius: '1rem' }}>
        <h2 className="font-bold text-center mb-6 text-xl">Generate Download Password</h2>
        <form onSubmit={handleGenerate}>
          <div className="input-group">
            <label className="input-label">User Mobile Number</label>
            <input 
              type="text" 
              value={mobileNo} 
              onChange={e => setMobileNo(e.target.value)} 
              className="input-field" 
              placeholder="e.g. 9876543210"
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Transaction Hash / Ref Key</label>
            <input 
              type="text" 
              value={txnHash} 
              onChange={e => setTxnHash(e.target.value)} 
              className="input-field" 
              placeholder="Enter hash from WhatsApp message"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4">Generate Password</button>
        </form>

        {generatedPassword && (
          <div className="mt-8 p-6 text-center" style={{ background: 'var(--success)', color: 'white', borderRadius: '0.5rem' }}>
            <p className="mb-2">Password generated successfully!</p>
            <h3 style={{ fontSize: '2rem', letterSpacing: '2px' }}>{generatedPassword}</h3>
            <p className="mt-2 text-sm">Send this password to the user on WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAllowDownload;
