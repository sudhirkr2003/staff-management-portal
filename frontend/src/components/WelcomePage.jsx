import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User, Mail, Settings, CheckCircle2, AlertCircle,
  Loader2, X, Users, Lock, ArrowLeft,
  UserPlus, Building2, Briefcase, Calendar, Phone,
  LayoutDashboard, TrendingUp, Plus, ArrowRight, Menu, LogOut,
  Search, Eye, IndianRupee, Edit2, Trash2
} from 'lucide-react';
import { updateProfile } from '../services/authService';
import { createEmployee, getEmployees, deleteEmployee } from '../services/employeeService';
import { getMyCompany } from '../services/companyService';
import ChangePasswordModal from './ChangePasswordModal';
import ManageCompanyModal from './ManageCompanyModal';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import EmployeeDetailPage from './EmployeeDetailPage';
import EditEmployeePage from './EditEmployeePage';
import DeleteEmployeeModal from './DeleteEmployeeModal';
import DepartmentsPage from './DepartmentsPage';

const matchEmployeeId = (path) => {
  const m = path ? path.match(/^\/employees\/(\d+)$/) : null;
  return m ? m[1] : null;
};

const matchEmployeeEdit = (path) => {
  const m = path ? path.match(/^\/employees\/(\d+)\/edit$/) : null;
  return m ? m[1] : null;
};

const formatINR = (amount, decimals = 0) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

const WelcomePage = ({
  user,
  company: initialCompany,
  currentPath = '/dashboard',
  onNavigate,
  onUserUpdate,
  onCompanyUpdate,
  onSignOut,
  onBackToHome,
  onForgotPassword,
  backendConnectionError,
  onRetryConnection
}) => {
  const [localTab, setLocalTab] = useState(currentPath === '/employees' ? 'employees' : 'dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(currentPath === '/company');
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState(null);

  const empDetailId = matchEmployeeId(currentPath);
  const empEditId = matchEmployeeEdit(currentPath);
  const isAddEmployee = currentPath === '/employees/new';
  const isDepartmentsPage = currentPath === '/departments';
  const isEmployeeSection =
    currentPath === '/employees' ||
    isAddEmployee ||
    Boolean(empDetailId) ||
    Boolean(empEditId);

  const activeTab = isEmployeeSection ? 'employees' : 'dashboard';

  const handleTabChange = (tab) => {
    setLocalTab(tab);
    setIsMobileSidebarOpen(false);
    if (onNavigate) {
      onNavigate(tab === 'employees' ? '/employees' : '/dashboard');
    }
  };

  const [company, setCompany] = useState(initialCompany || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    salary: '',
    joiningDate: ''
  });
  const [employeeFieldErrors, setEmployeeFieldErrors] = useState({});
  const [employeeSuccess, setEmployeeSuccess] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.fullName) {
      setFullNameInput(user.fullName);
    }
  }, [user]);

  useEffect(() => {
    if (!initialCompany) {
      getMyCompany()
        .then((res) => {
          if (res && res.success && res.data) {
            setCompany(res.data);
          }
        })
        .catch(() => {});
    }
  }, [initialCompany]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentPath === '/company') {
      setIsCompanyModalOpen(true);
    }
  }, [currentPath]);

  const fetchStaff = async () => {
    setIsLoadingEmployees(true);
    setFetchError('');
    try {
      const response = await getEmployees();
      if (response && response.success && Array.isArray(response.data)) {
        setEmployees(response.data);
      }
    } catch (err) {
      setFetchError('Unable to load employee records. Please check your connection.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInitiateDelete = (emp) => {
    setDeleteError('');
    setEmployeeToDelete(emp);
  };

  const handleCancelDelete = () => {
    if (isDeletingEmployee) return;
    setEmployeeToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete || isDeletingEmployee) return;
    setIsDeletingEmployee(true);
    setDeleteError('');
    try {
      const response = await deleteEmployee(employeeToDelete.id);
      if (response && response.success) {
        const deletedName = employeeToDelete.fullName;
        const deletedId = employeeToDelete.id;
        setEmployees((prev) => prev.filter((e) => e.id !== deletedId));
        setDeleteSuccess(`Employee "${deletedName}" was successfully deleted.`);
        setEmployeeToDelete(null);
        fetchStaff();
        if (empDetailId && String(empDetailId) === String(deletedId)) {
          if (onNavigate) onNavigate('/employees');
        }
      } else {
        setDeleteError(response?.message || 'Failed to delete employee.');
      }
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete employee. Please try again.');
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => setDeleteSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  const analytics = useMemo(() => {
    const totalEmployees = employees.length;
    const uniqueDepartments = new Set(
      employees.map((emp) => emp.department?.trim()).filter(Boolean)
    );
    const totalDepartments = uniqueDepartments.size;
    const totalPayroll = employees.reduce(
      (sum, emp) => sum + (Number(emp.salary) || 0),
      0
    );
    const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;

    const departmentDistribution = Object.entries(
      employees.reduce((acc, emp) => {
        const dept = emp.department?.trim() || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEmployees,
      totalDepartments,
      totalPayroll,
      averageSalary,
      departmentDistribution
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.fullName?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query) ||
        emp.designation?.toLowerCase().includes(query) ||
        emp.phone?.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const handleOpenProfile = () => {
    setFullNameInput(user?.fullName || '');
    setProfileError('');
    setProfileSuccess('');
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleOpenManageCompany = () => {
    setIsDropdownOpen(false);
    if (!company) {
      if (onNavigate) {
        onNavigate('/company/create');
      }
      return;
    }
    setIsCompanyModalOpen(true);
    if (onNavigate) {
      onNavigate('/company');
    }
  };

  const handleCloseManageCompany = () => {
    setIsCompanyModalOpen(false);
    if (currentPath === '/company' && onNavigate) {
      onNavigate('/dashboard');
    }
  };

  const handleOpenChangePassword = () => {
    setIsProfileModalOpen(false);
    setIsChangePasswordModalOpen(true);
  };

  const handleBackToProfileFromChangePassword = () => {
    setIsChangePasswordModalOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullNameInput.trim()) {
      setProfileError('Full name cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await updateProfile({ fullName: fullNameInput.trim() });
      if (response && response.success) {
        onUserUpdate({ fullName: fullNameInput.trim() });
        const stored = localStorage.getItem('auth_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.fullName = fullNameInput.trim();
          localStorage.setItem('auth_user', JSON.stringify(parsed));
        }
        setProfileSuccess('Profile updated successfully');
        setTimeout(() => {
          setIsProfileModalOpen(false);
          setProfileSuccess('');
        }, 1200);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setProfileError(err.response.data.message || 'Failed to update profile');
      } else {
        setProfileError('Network error while updating profile');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenAddEmployee = () => {
    setEmployeeError('');
    setEmployeeSuccess('');
    setEmployeeFieldErrors({});
    if (onNavigate) {
      onNavigate('/employees/new');
    } else {
      setIsAddEmployeeModalOpen(true);
    }
  };

  const handleEmployeeInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
    setEmployeeError('');
    setEmployeeSuccess('');
    if (employeeFieldErrors[name]) {
      setEmployeeFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmployeeForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!employeeForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (employeeForm.fullName.trim().length < 2 || employeeForm.fullName.trim().length > 150) {
      errors.fullName = 'Full name must be between 2 and 150 characters';
    }

    if (!employeeForm.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(employeeForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!employeeForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (employeeForm.phone.trim().length < 5) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!employeeForm.department.trim()) {
      errors.department = 'Department is required';
    }

    if (!employeeForm.designation.trim()) {
      errors.designation = 'Designation is required';
    }

    if (!employeeForm.salary.toString().trim()) {
      errors.salary = 'Salary is required';
    } else {
      const parsedSalary = parseFloat(employeeForm.salary);
      if (isNaN(parsedSalary) || parsedSalary <= 0) {
        errors.salary = 'Salary must be greater than zero';
      }
    }

    if (!employeeForm.joiningDate) {
      errors.joiningDate = 'Joining date is required';
    }

    setEmployeeFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setEmployeeSuccess('');
    setEmployeeError('');

    if (!validateEmployeeForm()) {
      return;
    }

    setIsSubmittingEmployee(true);
    try {
      const payload = {
        fullName: employeeForm.fullName.trim(),
        email: employeeForm.email.trim(),
        phone: employeeForm.phone.trim(),
        department: employeeForm.department.trim(),
        designation: employeeForm.designation.trim(),
        salary: parseFloat(employeeForm.salary),
        joiningDate: employeeForm.joiningDate
      };

      const response = await createEmployee(payload);
      if (response && response.success && response.data) {
        setEmployeeSuccess('Employee created successfully');
        setEmployees((prev) => [response.data, ...prev]);
        setEmployeeForm({
          fullName: '',
          email: '',
          phone: '',
          department: '',
          designation: '',
          salary: '',
          joiningDate: ''
        });
        setEmployeeFieldErrors({});
        setTimeout(() => {
          setIsAddEmployeeModalOpen(false);
          setEmployeeSuccess('');
          if (onNavigate) {
            onNavigate('/employees');
          }
        }, 1200);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.data && typeof err.response.data.data === 'object') {
          setEmployeeFieldErrors(err.response.data.data);
        }
        setEmployeeError(err.response.data.message || 'Failed to create employee');
      } else {
        setEmployeeError('Network error while creating employee. Please check your connection.');
      }
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-layout-container full-viewport">
      <header className="dashboard-top-header">
        <div className="dashboard-top-header-inner">
          <div className="dashboard-header-left">
            <img
              src="/staff-management-mark.png"
              alt="Staff Management Portal"
              className="dashboard-brand-logo"
            />
            <span className="dashboard-brand-title">
              Staff Management Portal
            </span>
          </div>

          <div className="dashboard-user-area" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="dashboard-profile-trigger"
              aria-expanded={isDropdownOpen}
            >
              <div className="dashboard-avatar">{getInitials(user?.fullName)}</div>
              <span className="dashboard-user-name">{user?.fullName || 'User'}</span>
            </button>

            {isDropdownOpen && (
              <div className="dashboard-dropdown">
                <div className="dropdown-user-summary">
                  <div className="dropdown-avatar">{getInitials(user?.fullName)}</div>
                  <div className="dropdown-user-details">
                    <div className="dropdown-name">{user?.fullName}</div>
                    <div className="dropdown-email">{user?.email}</div>
                    <span className="badge-role admin dropdown-role">
                      Administrator
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleOpenAddEmployee();
                  }}
                  className="dropdown-action-btn"
                >
                  <UserPlus size={16} />
                  <span>Add Employee</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleTabChange('employees');
                  }}
                  className="dropdown-action-btn"
                >
                  <Users size={16} />
                  <span>Manage Employees</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenManageCompany}
                  className="dropdown-action-btn"
                  aria-label="Manage Organization"
                >
                  <Building2 size={16} />
                  <span>Manage Organization</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  onClick={handleOpenProfile}
                  className="dropdown-action-btn"
                >
                  <Settings size={16} />
                  <span>Manage Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePasswordModalOpen(true);
                  }}
                  className="dropdown-action-btn"
                >
                  <Lock size={16} />
                  <span>Change Password</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  onClick={onSignOut}
                  className="dropdown-action-btn btn-signout"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-sub-header">
        <div className="dashboard-sub-header-inner">
          <div className="sub-header-left">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="btn-sub-hamburger"
              aria-label="Toggle navigation menu"
              title="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            {empEditId ? (
              <button
                type="button"
                onClick={() => onNavigate(`/employees/${empEditId}`)}
                className="link-sub-home"
                aria-label="Back to Employee Details"
              >
                <ArrowLeft size={15} />
                <span>Back to Employee Details</span>
              </button>
            ) : empDetailId || isAddEmployee ? (
              <button
                type="button"
                onClick={() => onNavigate('/employees')}
                className="link-sub-home"
                aria-label="Back to Employees"
              >
                <ArrowLeft size={15} />
                <span>Back to Employees</span>
              </button>
            ) : isDepartmentsPage ? (
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="link-sub-home"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            ) : activeTab === 'employees' && currentPath !== '/dashboard' ? (
              <button
                type="button"
                onClick={() => handleTabChange('dashboard')}
                className="link-sub-home"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToHome}
                className="link-sub-home"
                aria-label="Back to Home"
              >
                <ArrowLeft size={15} />
                <span>Home</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {backendConnectionError && (
        <div className="connection-banner">
          <div className="connection-banner-content">
            <Loader2 size={16} className="spinner" />
            <span>Connecting to server... Waiting for backend to become available.</span>
          </div>
          <button
            type="button"
            onClick={onRetryConnection}
            className="btn-connection-retry"
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="dashboard-layout-body">
        <aside
          className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${
            isMobileSidebarOpen ? 'mobile-open' : ''
          }`}
        >
          <nav className="sidebar-nav">
            <button
              type="button"
              onClick={() => handleTabChange('dashboard')}
              className={`sidebar-nav-item ${activeTab === 'dashboard' && !isDepartmentsPage ? 'active' : ''}`}
              title="Dashboard"
            >
              <div className="sidebar-item-icon">
                <LayoutDashboard size={18} />
              </div>
              <span className="sidebar-item-text">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('employees')}
              className={`sidebar-nav-item ${activeTab === 'employees' ? 'active' : ''}`}
              title="Manage Employees"
            >
              <div className="sidebar-item-icon">
                <Users size={18} />
              </div>
              <span className="sidebar-item-text">Manage Employees</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                if (onNavigate) onNavigate('/departments');
              }}
              className={`sidebar-nav-item ${isDepartmentsPage ? 'active' : ''}`}
              title="Departments"
            >
              <div className="sidebar-item-icon">
                <Building2 size={18} />
              </div>
              <span className="sidebar-item-text">Departments</span>
            </button>
          </nav>
        </aside>

        {isMobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <main className={`dashboard-main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
          {empEditId ? (
            <EditEmployeePage employeeId={empEditId} onNavigate={onNavigate} />
          ) : empDetailId ? (
            <EmployeeDetailPage employeeId={empDetailId} onNavigate={onNavigate} onDelete={handleInitiateDelete} />
          ) : isAddEmployee ? (
            <div className="edit-employee-page-wrapper">
              <div className="edit-employee-card">
                <div className="employee-modal-header">
                  <div className="employee-modal-title-group">
                    <h2 className="employee-modal-title">Add New Employee</h2>
                    <p className="employee-modal-subtitle">Enter employee information to register them</p>
                  </div>
                </div>

                {employeeSuccess && (
                  <div className="alert alert-success compact-alert">
                    <CheckCircle2 size={16} />
                    <span>{employeeSuccess}</span>
                  </div>
                )}

                {employeeError && (
                  <div className="alert alert-error compact-alert">
                    <AlertCircle size={16} />
                    <span>{employeeError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateEmployee} className="employee-modal-form" noValidate>
                  <div className="employee-form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-fullName-view">Full Name</label>
                      <div className="input-wrapper">
                        <User size={16} className="input-icon" />
                        <input
                          type="text"
                          id="emp-fullName-view"
                          name="fullName"
                          value={employeeForm.fullName}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. John Doe"
                          className={`form-input ${employeeFieldErrors.fullName ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.fullName && (
                        <span className="field-error-text">{employeeFieldErrors.fullName}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-email-view">Email Address</label>
                      <div className="input-wrapper">
                        <Mail size={16} className="input-icon" />
                        <input
                          type="email"
                          id="emp-email-view"
                          name="email"
                          value={employeeForm.email}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. john.doe@example.com"
                          className={`form-input ${employeeFieldErrors.email ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.email && (
                        <span className="field-error-text">{employeeFieldErrors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="employee-form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-phone-view">Phone Number</label>
                      <div className="input-wrapper">
                        <Phone size={16} className="input-icon" />
                        <input
                          type="tel"
                          id="emp-phone-view"
                          name="phone"
                          value={employeeForm.phone}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. +91 9876543210"
                          className={`form-input ${employeeFieldErrors.phone ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.phone && (
                        <span className="field-error-text">{employeeFieldErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-department-view">Department</label>
                      <div className="input-wrapper">
                        <Building2 size={16} className="input-icon" />
                        <input
                          type="text"
                          id="emp-department-view"
                          name="department"
                          value={employeeForm.department}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. Engineering"
                          className={`form-input ${employeeFieldErrors.department ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.department && (
                        <span className="field-error-text">{employeeFieldErrors.department}</span>
                      )}
                    </div>
                  </div>

                  <div className="employee-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-designation-view">Designation</label>
                      <div className="input-wrapper">
                        <Briefcase size={16} className="input-icon" />
                        <input
                          type="text"
                          id="emp-designation-view"
                          name="designation"
                          value={employeeForm.designation}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. Software Engineer"
                          className={`form-input ${employeeFieldErrors.designation ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.designation && (
                        <span className="field-error-text">{employeeFieldErrors.designation}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-salary-view">Salary (₹)</label>
                      <div className="input-wrapper">
                        <IndianRupee size={16} className="input-icon" />
                        <input
                          type="number"
                          id="emp-salary-view"
                          name="salary"
                          step="0.01"
                          min="0.01"
                          value={employeeForm.salary}
                          onChange={handleEmployeeInputChange}
                          placeholder="e.g. 75000"
                          className={`form-input ${employeeFieldErrors.salary ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.salary && (
                        <span className="field-error-text">{employeeFieldErrors.salary}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="emp-joiningDate-view">Joining Date</label>
                      <div className="input-wrapper">
                        <Calendar size={16} className="input-icon" />
                        <input
                          type="date"
                          id="emp-joiningDate-view"
                          name="joiningDate"
                          value={employeeForm.joiningDate}
                          onChange={handleEmployeeInputChange}
                          className={`form-input ${employeeFieldErrors.joiningDate ? 'input-error' : ''}`}
                        />
                      </div>
                      {employeeFieldErrors.joiningDate && (
                        <span className="field-error-text">{employeeFieldErrors.joiningDate}</span>
                      )}
                    </div>
                  </div>

                  <div className="employee-modal-footer">
                    <button
                      type="button"
                      onClick={() => onNavigate('/employees')}
                      className="btn-profile-cancel"
                      disabled={isSubmittingEmployee}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEmployee}
                      className="btn-profile-save"
                    >
                      {isSubmittingEmployee ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          <span>Saving Employee...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Save Employee</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : isDepartmentsPage ? (
            <DepartmentsPage
              employees={employees}
              isLoading={isLoadingEmployees}
              error={fetchError}
              onRetry={fetchStaff}
              onNavigate={onNavigate}
              companyName={company?.companyName || company?.name}
            />
          ) : activeTab === 'dashboard' ? (
            <>
              <div className="dashboard-content-header">
                <h1 className="content-title">
                  {company?.companyName || company?.name
                    ? `${company.companyName || company.name} Staff Dashboard`
                    : 'Staff Dashboard'}
                </h1>
                <button
                  type="button"
                  onClick={handleOpenAddEmployee}
                  className="btn-new-employee"
                >
                  <Plus size={16} />
                  <span>New Employee</span>
                </button>
              </div>

              {fetchError && (
                <div className="alert alert-error compact-alert">
                  <AlertCircle size={16} />
                  <span>{fetchError}</span>
                  <button
                    type="button"
                    onClick={fetchStaff}
                    className="btn-alert-retry"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="analytics-grid">
                <div
                  className="analytics-card interactive"
                  onClick={() => handleTabChange('employees')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTabChange('employees');
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="View Manage Employees page"
                  title="View all employees"
                >
                  <div className="analytics-card-header">
                    <span className="analytics-card-title">Total Employees</span>
                    <div className="analytics-icon blue">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="analytics-value">
                    {isLoadingEmployees ? (
                      <Loader2 size={22} className="spinner" />
                    ) : (
                      analytics.totalEmployees
                    )}
                  </div>
                </div>

                <div
                  className="analytics-card interactive"
                  onClick={() => onNavigate && onNavigate('/departments')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onNavigate) onNavigate('/departments');
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="View All Departments"
                  title="View All Departments"
                >
                  <div className="analytics-card-header">
                    <span className="analytics-card-title">Total Departments</span>
                    <div className="analytics-icon emerald">
                      <Building2 size={18} />
                    </div>
                  </div>
                  <div className="analytics-value">
                    {isLoadingEmployees ? (
                      <Loader2 size={22} className="spinner" />
                    ) : (
                      analytics.totalDepartments
                    )}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="analytics-card-header">
                    <span className="analytics-card-title">Average Salary</span>
                    <div className="analytics-icon purple">
                      <IndianRupee size={18} />
                    </div>
                  </div>
                  <div className="analytics-value">
                    {isLoadingEmployees ? (
                      <Loader2 size={22} className="spinner" />
                    ) : (
                      formatINR(analytics.averageSalary, 0)
                    )}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="analytics-card-header">
                    <span className="analytics-card-title">Total Annual Payroll</span>
                    <div className="analytics-icon amber">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="analytics-value">
                    {isLoadingEmployees ? (
                      <Loader2 size={22} className="spinner" />
                    ) : (
                      formatINR(analytics.totalPayroll, 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-middle-section">
                <div className="analytics-chart-card" id="department-distribution-section">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title">Department Distribution</h3>
                  </div>

                  {isLoadingEmployees ? (
                    <div className="table-loading-state">
                      <Loader2 size={18} className="spinner" />
                      <span>Loading department data...</span>
                    </div>
                  ) : analytics.departmentDistribution.length === 0 ? (
                    <p className="analytics-subtext">No department data recorded yet.</p>
                  ) : (
                    <div className="dept-distribution-list">
                      {analytics.departmentDistribution.map((dept) => (
                        <div key={dept.name} className="dept-dist-item">
                          <div className="dept-dist-header">
                            <span className="dept-dist-name">{dept.name}</span>
                            <span className="dept-dist-meta">
                              {dept.count} {dept.count === 1 ? 'employee' : 'employees'} ({dept.percentage}%)
                            </span>
                          </div>
                          <div className="dept-dist-bar-track">
                            <div
                              className="dept-dist-bar-fill"
                              style={{ width: `${dept.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="quick-actions-card">
                  <div className="chart-card-header">
                    <h3 className="chart-card-title">Quick Actions</h3>
                  </div>
                  <div className="quick-actions-grid">
                    <div className="quick-action-tile" onClick={handleOpenAddEmployee}>
                      <div className="quick-action-icon blue">
                        <UserPlus size={20} />
                      </div>
                      <div className="quick-action-content">
                        <div className="quick-action-title">Add New Employee</div>
                        <div className="quick-action-desc">
                          Register a new employee into your company workspace.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddEmployee();
                        }}
                        className="quick-action-btn"
                      >
                        <span>Add Employee</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="quick-action-tile" onClick={() => handleTabChange('employees')}>
                      <div className="quick-action-icon emerald">
                        <Users size={20} />
                      </div>
                      <div className="quick-action-content">
                        <div className="quick-action-title">View All Employees</div>
                        <div className="quick-action-desc">
                          Access and search the workforce directory and employee profiles.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabChange('employees');
                        }}
                        className="quick-action-btn"
                      >
                        <span>View All{employees.length > 0 ? ` (${employees.length})` : ''}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="manage-employees-view">
              <div className="dashboard-content-header manage-employees-header">
                <div className="content-title-wrapper">
                  <h1 className="content-title">Manage Employees</h1>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddEmployee}
                  className="btn-new-employee"
                >
                  <Plus size={16} />
                  <span>New Employee</span>
                </button>
              </div>

              <div className="directory-control-bar">
                <div className="directory-search-wrapper">
                  <Search size={16} className="directory-search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, department, designation..."
                    className="directory-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="btn-clear-search"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="directory-summary-stat">
                  Showing {filteredEmployees.length} of {employees.length} records
                </div>
              </div>

              {deleteSuccess && (
                <div className="alert alert-success compact-alert" style={{ marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{deleteSuccess}</span>
                </div>
              )}

              {fetchError && (
                <div className="alert alert-error compact-alert">
                  <AlertCircle size={16} />
                  <span>{fetchError}</span>
                  <button
                    type="button"
                    onClick={fetchStaff}
                    className="btn-alert-retry"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoadingEmployees ? (
                <div className="table-loading-state">
                  <Loader2 size={18} className="spinner" />
                  <span>Loading workforce records...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="table-empty-notice">
                  <Users size={32} className="empty-state-icon" />
                  <div className="empty-state-title">
                    {searchQuery ? 'No matching employees found' : 'No employees registered yet'}
                  </div>
                  <div className="empty-state-desc">
                    {searchQuery
                      ? 'Try adjusting your search criteria.'
                      : 'Add your first employee to populate your directory.'}
                  </div>
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="btn-sub-home"
                      style={{ marginTop: '0.75rem' }}
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenAddEmployee}
                      className="btn-new-employee"
                      style={{ marginTop: '0.75rem' }}
                    >
                      <Plus size={15} />
                      <span>New Employee</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="saas-table-wrapper">
                  <table className="saas-table">
                    <thead>
                      <tr>
                        <th>Full Name</th>
                        <th>Email Address</th>
                        <th>Phone</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Salary</th>
                        <th>Joining Date</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id}>
                          <td className="emp-name">{emp.fullName}</td>
                          <td className="emp-email">{emp.email}</td>
                          <td>{emp.phone}</td>
                          <td><span className="dept-tag">{emp.department}</span></td>
                          <td>{emp.designation}</td>
                          <td className="salary-cell">
                            {formatINR(emp.salary, 2)}
                          </td>
                          <td>{emp.joiningDate}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="table-action-group">
                              <button
                                type="button"
                                onClick={() => onNavigate(`/employees/${emp.id}`)}
                                className="btn-table-action-details"
                                title="View Details"
                                aria-label="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigate(`/employees/${emp.id}/edit`)}
                                className="btn-table-action-edit"
                                title="Edit Employee"
                                aria-label="Edit Employee"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInitiateDelete(emp)}
                                className="btn-table-action-delete"
                                title="Delete Employee"
                                aria-label="Delete Employee"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedEmployeeForDetails && (
        <EmployeeDetailsModal
          employee={selectedEmployeeForDetails}
          onClose={() => setSelectedEmployeeForDetails(null)}
        />
      )}

      {isCompanyModalOpen && (
        <ManageCompanyModal
          company={company}
          currentUser={user}
          onClose={handleCloseManageCompany}
          onCompanyUpdated={(updatedCompany) => {
            setCompany(updatedCompany);
            if (onCompanyUpdate) {
              onCompanyUpdate(updatedCompany);
            }
          }}
        />
      )}

      {isAddEmployeeModalOpen && (
        <div className="employee-modal-overlay">
          <div className="employee-modal-card">
            <div className="employee-modal-header">
              <div className="employee-modal-title-group">
                <h2 className="employee-modal-title">Add New Employee</h2>
                <p className="employee-modal-subtitle">Enter employee information to register them</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="btn-modal-close"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {employeeSuccess && (
              <div className="alert alert-success compact-alert">
                <CheckCircle2 size={16} />
                <span>{employeeSuccess}</span>
              </div>
            )}

            {employeeError && (
              <div className="alert alert-error compact-alert">
                <AlertCircle size={16} />
                <span>{employeeError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="employee-modal-form" noValidate>
              <div className="employee-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-fullName">Full Name</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      id="emp-fullName"
                      name="fullName"
                      value={employeeForm.fullName}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. John Doe"
                      className={`form-input ${employeeFieldErrors.fullName ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.fullName && (
                    <span className="field-error-text">{employeeFieldErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      id="emp-email"
                      name="email"
                      value={employeeForm.email}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. john.doe@example.com"
                      className={`form-input ${employeeFieldErrors.email ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.email && (
                    <span className="field-error-text">{employeeFieldErrors.email}</span>
                  )}
                </div>
              </div>

              <div className="employee-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-phone">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={16} className="input-icon" />
                    <input
                      type="tel"
                      id="emp-phone"
                      name="phone"
                      value={employeeForm.phone}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. +91 9876543210"
                      className={`form-input ${employeeFieldErrors.phone ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.phone && (
                    <span className="field-error-text">{employeeFieldErrors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-department">Department</label>
                  <div className="input-wrapper">
                    <Building2 size={16} className="input-icon" />
                    <input
                      type="text"
                      id="emp-department"
                      name="department"
                      value={employeeForm.department}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. Engineering"
                      className={`form-input ${employeeFieldErrors.department ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.department && (
                    <span className="field-error-text">{employeeFieldErrors.department}</span>
                  )}
                </div>
              </div>

              <div className="employee-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="emp-designation">Designation</label>
                  <div className="input-wrapper">
                    <Briefcase size={16} className="input-icon" />
                    <input
                      type="text"
                      id="emp-designation"
                      name="designation"
                      value={employeeForm.designation}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. Software Engineer"
                      className={`form-input ${employeeFieldErrors.designation ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.designation && (
                    <span className="field-error-text">{employeeFieldErrors.designation}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-salary">Salary (₹)</label>
                  <div className="input-wrapper">
                    <IndianRupee size={16} className="input-icon" />
                    <input
                      type="number"
                      id="emp-salary"
                      name="salary"
                      step="0.01"
                      min="0.01"
                      value={employeeForm.salary}
                      onChange={handleEmployeeInputChange}
                      placeholder="e.g. 75000"
                      className={`form-input ${employeeFieldErrors.salary ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.salary && (
                    <span className="field-error-text">{employeeFieldErrors.salary}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emp-joiningDate">Joining Date</label>
                  <div className="input-wrapper">
                    <Calendar size={16} className="input-icon" />
                    <input
                      type="date"
                      id="emp-joiningDate"
                      name="joiningDate"
                      value={employeeForm.joiningDate}
                      onChange={handleEmployeeInputChange}
                      className={`form-input ${employeeFieldErrors.joiningDate ? 'input-error' : ''}`}
                    />
                  </div>
                  {employeeFieldErrors.joiningDate && (
                    <span className="field-error-text">{employeeFieldErrors.joiningDate}</span>
                  )}
                </div>
              </div>

              <div className="employee-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="btn-profile-cancel"
                  disabled={isSubmittingEmployee}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="btn-profile-save"
                >
                  {isSubmittingEmployee ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Saving Employee...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Save Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card profile-modal-card">
            <div className="profile-modal-header">
              <div className="profile-modal-title-wrap">
                <div className="profile-modal-icon-badge">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="profile-modal-title">Manage Profile</h2>
                  <p className="profile-modal-subtitle">Update your personal account details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="profile-modal-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {profileSuccess && (
              <div className="alert alert-success compact-alert">
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="alert alert-error compact-alert">
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="profile-modal-form">
              <div className="form-group compact-group">
                <label className="form-label compact-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input compact-input input-disabled"
                  />
                </div>
                <p className="input-hint subtle-hint">Email address cannot be changed in this release.</p>
              </div>

              <div className="form-group compact-group">
                <label htmlFor="edit-fullname" className="form-label compact-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    id="edit-fullname"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Enter full name"
                    className="form-input compact-input"
                  />
                </div>
              </div>

              <div className="profile-security-card">
                <div className="security-card-left">
                  <div className="security-icon-badge">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="security-card-title">Password &amp; Security</h4>
                    <p className="security-card-desc">Manage your account password and security.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="btn-profile-change-pass"
                >
                  Change Password
                </button>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn-profile-cancel"
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-profile-save"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={15} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeeToDelete && (
        <DeleteEmployeeModal
          employee={employeeToDelete}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingEmployee}
          error={deleteError}
        />
      )}

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
          onBackToProfile={handleBackToProfileFromChangePassword}
          onForgotPassword={onForgotPassword}
        />
      )}
    </div>
  );
};

export default WelcomePage;
