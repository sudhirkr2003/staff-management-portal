import React, { useState } from 'react';
import { Building2, Briefcase, Mail, Phone, Globe, Loader2, AlertCircle, CheckCircle2, Users, LogOut } from 'lucide-react';
import { createCompany } from '../services/companyService';

const CreateCompanyPage = ({ onCompanyCreated, onSignOut }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    businessEmail: '',
    contactPhone: '',
    website: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 2 || formData.companyName.trim().length > 150) {
      errors.companyName = 'Company name must be between 2 and 150 characters';
    }

    if (formData.businessEmail && formData.businessEmail.trim() && !emailRegex.test(formData.businessEmail.trim())) {
      errors.businessEmail = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        industry: formData.industry.trim() || undefined,
        businessEmail: formData.businessEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        website: formData.website.trim() || undefined
      };

      const response = await createCompany(payload);
      if (response && response.success && response.data) {
        setServerSuccess('Company workspace registered successfully. Redirecting to dashboard...');
        setTimeout(() => {
          onCompanyCreated(response.data);
        }, 1200);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError('Unable to create company. Please check your network connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page-container">
      <header className="onboarding-header">
        <div className="onboarding-brand">
          <div className="dashboard-brand-icon">
            <Users size={20} />
          </div>
          <span className="dashboard-brand-title">Staff Management Portal</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="btn-onboarding-signout"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="onboarding-main">
        <div className="onboarding-card">
          <div className="onboarding-card-header">
            <div className="onboarding-icon-wrap">
              <Building2 size={28} />
            </div>
            <h1 className="onboarding-title">Create Your Company</h1>
            <p className="onboarding-subtitle">
              Every Administrator must set up a company workspace before adding or managing employees.
            </p>
          </div>

          {serverSuccess && (
            <div className="alert alert-success compact-alert">
              <CheckCircle2 size={18} />
              <span>{serverSuccess}</span>
            </div>
          )}

          {serverError && (
            <div className="alert alert-error compact-alert">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="onboarding-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                Company Name <span className="text-danger">*</span>
              </label>
              <div className="input-wrapper">
                <Building2 size={16} className="input-icon" />
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Technologies Private Limited"
                  className={`form-input ${fieldErrors.companyName ? 'input-error' : ''}`}
                />
              </div>
              {fieldErrors.companyName && (
                <span className="field-error-text">{fieldErrors.companyName}</span>
              )}
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="industry">
                  Industry (Optional)
                </label>
                <div className="input-wrapper">
                  <Briefcase size={16} className="input-icon" />
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g. Information Technology"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="businessEmail">
                  Business Email (Optional)
                </label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    id="businessEmail"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="e.g. contact@acme.com"
                    className={`form-input ${fieldErrors.businessEmail ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.businessEmail && (
                  <span className="field-error-text">{fieldErrors.businessEmail}</span>
                )}
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="contactPhone">
                  Contact Phone (Optional)
                </label>
                <div className="input-wrapper">
                  <Phone size={16} className="input-icon" />
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="website">
                  Website (Optional)
                </label>
                <div className="input-wrapper">
                  <Globe size={16} className="input-icon" />
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="e.g. https://www.acme.com"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="onboarding-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-onboarding-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Saving Company...</span>
                  </>
                ) : (
                  <>
                    <Building2 size={16} />
                    <span>Save Company &amp; Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateCompanyPage;

