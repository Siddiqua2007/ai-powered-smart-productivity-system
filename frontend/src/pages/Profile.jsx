import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, changePassword } from "../services/userService";
import { getProductivityScore } from "../services/aiService";

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);

  // Edit profile state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Productivity score state
  const [score, setScore] = useState(null);
  const [scoreSummary, setScoreSummary] = useState('');
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState('');

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setProfileSubmitting(true);
    try {
      const data = await updateProfile(profileForm);
      updateUser(data.user);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError("New passwords don't match");
    }
    if (pwForm.newPassword.length < 6) {
      return setPwError('New password must be at least 6 characters');
    }

    setPwSubmitting(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleGetScore = async () => {
    setScoreLoading(true);
    setScoreError('');
    try {
      const data = await getProductivityScore();
      setScore(data.score);
      setScoreSummary(data.summary);
    } catch (err) {
      setScoreError('Could not load your productivity score right now. Try again in a moment.');
    } finally {
      setScoreLoading(false);
    }
  };

  const scoreClass = score === null ? '' : score >= 70 ? 'good' : score >= 40 ? 'okay' : 'low';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* AI PRODUCTIVITY SCORE */}
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-label">AI Productivity Score</div>
          <button onClick={handleGetScore} disabled={scoreLoading} className="btn btn-primary btn-sm">
            {scoreLoading ? 'Calculating...' : 'Get My Score'}
          </button>
        </div>
        {scoreError && <p style={{ color: 'var(--color-danger)', margin: '12px 0 0 0', fontSize: '14px' }}>{scoreError}</p>}
        {score !== null && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className={`score-display ${scoreClass}`}>{score}</div>
            <p style={{ margin: 0, color: 'var(--color-ink-muted)', fontSize: '14px', lineHeight: '1.5' }}>{scoreSummary}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* UPDATE PROFILE */}
        <div className="card">
          <h2 style={{ marginBottom: '18px' }}>Update Profile</h2>
          {profileError && <p className="error-text">{profileError}</p>}
          {profileMsg && <p className="success-text">{profileMsg}</p>}
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>Name</label>
              <input className="input" type="text" name="name" value={profileForm.name} onChange={handleProfileChange} required />
            </div>
            <div>
              <label className="stat-label" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
              <input className="input" type="email" name="email" value={profileForm.email} onChange={handleProfileChange} required />
            </div>
            <button type="submit" disabled={profileSubmitting} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {profileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="card">
          <h2 style={{ marginBottom: '18px' }}>Change Password</h2>
          {pwError && <p className="error-text">{pwError}</p>}
          {pwMsg && <p className="success-text">{pwMsg}</p>}
          <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input className="input" type="password" name="currentPassword" placeholder="Current Password" value={pwForm.currentPassword} onChange={handlePwChange} required />
            <input className="input" type="password" name="newPassword" placeholder="New Password" value={pwForm.newPassword} onChange={handlePwChange} required />
            <input className="input" type="password" name="confirmPassword" placeholder="Confirm New Password" value={pwForm.confirmPassword} onChange={handlePwChange} required />
            <button type="submit" disabled={pwSubmitting} className="btn btn-amber" style={{ alignSelf: 'flex-start' }}>
              {pwSubmitting ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}