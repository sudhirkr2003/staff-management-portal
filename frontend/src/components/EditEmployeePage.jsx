import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building2, Briefcase,
  IndianRupee, Calendar, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { getEmployeeById, updateEmployee } from '../services/employeeService';

const EditEmployeePage = ({ employeeId, onNavigate }) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    salary: '',
    joiningDate: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (!employeeId) {
      setLoadError('No employee ID provided.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError('');
    getEmployeeById(employeeId)
      .then((res) => {
        if (res && res.success && res.data) {
          const emp = res.data;
          setForm({
            fullName: emp.fullName || '',
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || '',
            designation: emp.designation || '',
            salary: emp.salary != null ? String(emp.salary) : '',
            joiningDate: emp.joiningDate
              ? String(emp.joiningDate).split('T')[0]
              : ''
          });
        } else {
          setLoadError('Employee not found.');
        }
      })
      .catch(() => {
        setLoadError('Failed to load employee details. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveError('');
    setSaveSuccess('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (form.fullName.trim().length < 2 || form.fullName.trim().length > 150) {
      errors.fullName = 'Full name must be between 2 and 150 characters';
    }

    if (!form.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (form.phone.trim().length < 5) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!form.department.trim()) {
      errors.department = 'Department is required';
    }

    if (!form.designation.trim()) {
      errors.designation = 'Designation is required';
    }

    if (!form.salary.toString().trim()) {
      errors.salary = 'Salary is required';
    } else {
      const parsed = parseFloat(form.salary);
      if (isNaN(parsed) || parsed <= 0) {
        errors.salary = 'Salary must be greater than zero';
      }
    }

    if (!form.joiningDate) {
      errors.joiningDate = 'Joining date is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        salary: parseFloat(form.salary),
        joiningDate: form.joiningDate
      };

      const res = await updateEmployee(employeeId, payload);
      if (res && res.success) {
        setSaveSuccess('Employee updated successfully');
        setTimeout(() => {
          onNavigate(`/employees/${employeeId}`);
        }, 1000);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.data && typeof err.response.data.data === 'object') {
          setFieldErrors(err.response.data.data);
        }
        setSaveError(err.response.data.message || 'Failed to update employee');
      } else {
        setSaveError('Network error while updating employee. Please check your connection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onNavigate(`/employees/${employeeId}`);
  };

  return (
    <div className="edit-employee-page-wrapper">
      <div className="edit-employee-card">
        <div className="employee-modal-header">
          <div className="employee-modal-title-group">
            <h2 className="employee-modal-title">Edit Employee</h2>
            <p className="employee-modal-subtitle">Update employee information</p>
          </div>
        </div>

        {isLoading && (
          <div className="table-loading-state">
            <Loader2 size={18} className="spinner" />
            <span>Loading employee details...</span>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="alert alert-error compact-alert">
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            {saveSuccess && (
              <div className="alert alert-success compact-alert">
                <CheckCircle2 size={16} />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="alert alert-error compact-alert">
                <AlertCircle size={16} />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="employee-modal-form" noValidate>
              <div className="employee-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-fullName">Full Name</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      id="edit-emp-fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className={`form-input ${fieldErrors.fullName ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <span className="field-error-text">{fieldErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      id="edit-emp-email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. john.doe@example.com"
                      className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span className="field-error-text">{fieldErrors.email}</span>
                  )}
                </div>
              </div>

              <div className="employee-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-phone">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={16} className="input-icon" />
                    <input
                      type="tel"
                      id="edit-emp-phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 9876543210"
                      className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <span className="field-error-text">{fieldErrors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-department">Department</label>
                  <div className="input-wrapper">
                    <Building2 size={16} className="input-icon" />
                    <input
                      type="text"
                      id="edit-emp-department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering"
                      className={`form-input ${fieldErrors.department ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.department && (
                    <span className="field-error-text">{fieldErrors.department}</span>
                  )}
                </div>
              </div>

              <div className="employee-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-designation">Designation</label>
                  <div className="input-wrapper">
                    <Briefcase size={16} className="input-icon" />
                    <input
                      type="text"
                      id="edit-emp-designation"
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer"
                      className={`form-input ${fieldErrors.designation ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.designation && (
                    <span className="field-error-text">{fieldErrors.designation}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-salary">Salary (₹)</label>
                  <div className="input-wrapper">
                    <IndianRupee size={16} className="input-icon" />
                    <input
                      type="number"
                      id="edit-emp-salary"
                      name="salary"
                      step="0.01"
                      min="0.01"
                      value={form.salary}
                      onChange={handleChange}
                      placeholder="e.g. 75000"
                      className={`form-input ${fieldErrors.salary ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.salary && (
                    <span className="field-error-text">{fieldErrors.salary}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-emp-joiningDate">Joining Date</label>
                  <div className="input-wrapper">
                    <Calendar size={16} className="input-icon" />
                    <input
                      type="date"
                      id="edit-emp-joiningDate"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                      className={`form-input ${fieldErrors.joiningDate ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.joiningDate && (
                    <span className="field-error-text">{fieldErrors.joiningDate}</span>
                  )}
                </div>
              </div>

              <div className="employee-modal-footer">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-profile-cancel"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-profile-save"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EditEmployeePage;
