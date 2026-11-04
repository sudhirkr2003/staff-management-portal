import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { updateCompany, getMyCompany } from '../services/companyService';

const ManageCompanyModal = ({ company: initialCompany, onClose, onCompanyUpdated, currentUser }) => {
  const [company, setCompany] = useState(initialCompany);
  const [isLoading, setIsLoading] = useState(!initialCompany);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: initialCompany?.companyName || initialCompany?.name || '',
    industry: initialCompany?.industry || '',
    businessEmail: initialCompany?.businessEmail || '',
    contactPhone: initialCompany?.contactPhone || '',
    website: initialCompany?.website || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialCompany) {
      setCompany(initialCompany);
      setFormData({
        companyName: initialCompany.companyName || initialCompany.name || '',
        industry: initialCompany.industry || '',
        businessEmail: initialCompany.businessEmail || '',
        contactPhone: initialCompany.contactPhone || '',
        website: initialCompany.website || ''
      });
    }
  }, [initialCompany]);

  useEffect(() => {
    let isMounted = true;
    getMyCompany()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setCompany(res.data);
          setFormData({
            companyName: res.data.companyName || res.data.name || '',
            industry: res.data.industry || '',
            businessEmail: res.data.businessEmail || '',
            contactPhone: res.data.contactPhone || '',
            website: res.data.website || ''
          });
          if (onCompanyUpdated) {
            onCompanyUpdated(res.data);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [onCompanyUpdated]);

  if (isLoading && !company) {
    return (
      <div className="employee-modal-overlay">
        <div className="company-clean-modal-card">
          <div className="company-clean-modal-header">
            <h2 className="company-modal-heading">Company Information</h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-close"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div className="company-clean-modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '160px' }}>
            <Loader2 size={24} className="spinner" style={{ color: 'var(--primary-color)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const handleStartEditing = () => {
    setFormData({
      companyName: company.companyName || company.name || '',
      industry: company.industry || '',
      businessEmail: company.businessEmail || '',
      contactPhone: company.contactPhone || '',
      website: company.website || ''
    });
    setError('');
    setSuccess('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      companyName: company.companyName || company.name || '',
      industry: company.industry || '',
      businessEmail: company.businessEmail || '',
      contactPhone: company.contactPhone || '',
      website: company.website || ''
    });
    setError('');
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (formData.businessEmail && formData.businessEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.businessEmail.trim())) {
        setError('Please enter a valid business email address');
        return;
      }
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        industry: formData.industry.trim(),
        businessEmail: formData.businessEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        website: formData.website.trim()
      };
      const response = await updateCompany(payload);
      if (response && response.success && response.data) {
        setCompany(response.data);
        if (onCompanyUpdated) {
          onCompanyUpdated(response.data);
        }
        setSuccess('Company details updated successfully');
        setIsEditing(false);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update company information';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="employee-modal-overlay">
      <div className="company-clean-modal-card">
        <div className="company-clean-modal-header">
          <h2 className="company-modal-heading">Company Information</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="company-clean-modal-body">
          {success && (
            <div className="company-clean-alert success">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="company-clean-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="company-edit-form">
              <div className="company-edit-field">
                <label htmlFor="companyName" className="company-edit-label">
                  Company Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="company-edit-input"
                  required
                />
              </div>

              <div className="company-edit-field">
                <label htmlFor="industry" className="company-edit-label">Industry</label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="company-edit-input"
                  placeholder="e.g. Technology"
                />
              </div>

              <div className="company-edit-field">
                <label htmlFor="businessEmail" className="company-edit-label">Business Email</label>
                <input
                  type="email"
                  id="businessEmail"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  className="company-edit-input"
                  placeholder="e.g. info@company.com"
                />
              </div>

              <div className="company-edit-field">
                <label htmlFor="contactPhone" className="company-edit-label">Contact Phone</label>
                <input
                  type="text"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="company-edit-input"
                  placeholder="e.g. +91 XXXXX XXXXX"
                />
              </div>

              <div className="company-edit-field">
                <label htmlFor="website" className="company-edit-label">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="company-edit-input"
                  placeholder="e.g. www.example.com"
                />
              </div>

              <div className="company-clean-modal-footer">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-company-cancel"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-company-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="company-clean-title">
                {company.companyName || company.name}
              </h1>

              <div className="company-clean-rows">
                <div className="company-clean-row">
                  <span className="company-row-label">Industry:</span>
                  <span className="company-row-value">{company.industry || 'Not specified'}</span>
                </div>

                <div className="company-clean-row">
                  <span className="company-row-label">Business Email:</span>
                  <span className="company-row-value">
                    {company.businessEmail ? (
                      <a href={`mailto:${company.businessEmail}`} className="company-text-link">
                        {company.businessEmail}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </span>
                </div>

                <div className="company-clean-row">
                  <span className="company-row-label">Contact Phone:</span>
                  <span className="company-row-value">{company.contactPhone || 'Not specified'}</span>
                </div>

                <div className="company-clean-row">
                  <span className="company-row-label">Website:</span>
                  <span className="company-row-value">
                    {company.website ? (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="company-text-link"
                      >
                        {company.website}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </span>
                </div>

                <div className="company-clean-row">
                  <span className="company-row-label">Account Owner:</span>
                  <span className="company-row-value">
                    {company.ownerName || currentUser?.fullName || 'Administrator'}
                  </span>
                </div>
              </div>

              <div className="company-clean-modal-footer">
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="btn-company-edit"
                >
                  Edit Company
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-company-close"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCompanyModal;
