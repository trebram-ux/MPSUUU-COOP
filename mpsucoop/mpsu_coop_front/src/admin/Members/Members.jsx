import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import styles from './Members.css';
import { IoIosPersonAdd } from "react-icons/io";
import { FaUserEdit, FaTrash, FaEye } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [newMember, setNewMember] = useState({});
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');  // State for search query
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/members/');
        setMembers(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const validateInput = (field, value) => {
    switch (field) {
      case 'email':
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
          return 'Invalid email address.';
        }
        break;
      case 'phone_number':
        if (!/^\d{11}$/.test(value)) {
          return 'Phone number must contain 11 digits total.';
        }
        break;
      case 'tin':
        if (!/^\d{9}$/.test(value)) {
          return 'TIN must be a 9-digit number.';
        }
        break;
      case 'in_dep':
        const depositValue = parseFloat(value);
        if (depositValue < 50000 || depositValue > 1000000) {
          return 'Initial deposit must be between 50,000 to 1,000,000.';
        }
        break;
      case 'first_name':
      case 'last_name':
        if (!value.trim()) {
          return 'This field is required.';
        }
        break;
      case 'middle_name':
      case 'birth_place':
      case 'zip_code':
      case 'gender':
      case 'pstatus':
      case 'religion':
      case 'address':
      case 'height':
      case 'weight':
      case 'ann_com':
      case 'mem_co':
      case 'addresss':
      case 'valid_id':
      case 'id_no':
      case 'co_maker':
      case 'relationship':
      case 'co_maker2':
      case 'relationship2':
      case 'co_maker3':
      case 'relationship3':
        // No specific validation for these fields
        break;
      default:
        return '';
    }
    return ''; // No error
  };

  // Filter members based on the search query
  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.middle_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.accountN && member.accountN.toString().includes(searchQuery)  // Account number search
  );

  const handleInputChange = (e, setter) => {
    const { name, value } = e.target;
    // Validate the input
    const error = validateInput(name, value);
    // Update state with the new value and any validation errors
    setter((prevState) => ({
      ...prevState,
      [name]: value, // Update the value
      [`${name}_error`]: error, // Update the error dynamically
    }));
  };

  // Function to open the modal
  const openDeleteModal = (member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  // Function to confirm deletion
  const confirmDeleteMember = async () => {
    try {
      await axios.delete(`http://localhost:8000/members/${memberToDelete.memId}/`);
      setMembers(members.filter(member => member.memId !== memberToDelete.memId));
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err) {
      setError('Error deleting member.');
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.first_name || !newMember.last_name) {
      setFormError('First and last names are required.');
      return;
    }
    const error = validateAddresses(newMember, { address: newMember.addresss });
    if (error) {
      setFormError(error);
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/members/', newMember);
      setMembers([...members, response.data]);
      setNewMember({});
      setShowAddForm(false);
      setFormError(null);
    } catch (err) {
      setFormError('Error adding member. Please try again.');
    }
  };

  const handleEditMember = async () => {
    if (!editingMember.first_name || !editingMember.last_name) {
      setFormError('First and last names are required.');
      return;
    }
    const error = validateAddresses(editingMember, { address: editingMember.addresss });
    if (error) {
      setFormError(error);
      return;
    }
    try {
      const response = await axios.put(
        `http://localhost:8000/members/${editingMember.memId}/`,
        editingMember
      );
      setMembers(
        members.map(member =>
          member.memId === editingMember.memId ? response.data : member
        )
      );
      setEditingMember(null);
      setShowAddForm(false);
      setFormError(null);
    } catch (err) {
      setFormError('Error updating member. Please try again.');
    }
  };

  const handleStartEdit = (member) => {
    setEditingMember({ ...member });
    setShowAddForm(true);
  };

  const validateAddresses = (member, cooperative) => {
    if (member.address === cooperative.address) {
      return 'The member\'s address must be different from the cooperative\'s address.';
    }
    return null;
  };

  const handleBirthDateChange = (e, fieldName) => {
    const selectedDate = new Date(e.target.value).toISOString().split('T')[0];
    const allDates = [
      editingMember?.birth_date || newMember.birth_date,
      editingMember?.birth_date1 || newMember.birth_date1,
      editingMember?.birth_date2 || newMember.birth_date2,
      editingMember?.birth_date3 || newMember.birth_date3,
    ];
    if (allDates.includes(selectedDate)) {
      alert("Birth date must be unique and different from other beneficiaries' birth dates.");
      return;
    }
    const updatedMember = editingMember
      ? { ...editingMember, [fieldName]: selectedDate }
      : { ...newMember, [fieldName]: selectedDate };
    editingMember ? setEditingMember(updatedMember) : setNewMember(updatedMember);
  };

  // Set the selected member when "View" button is clicked
  const handleViewMember = (member) => {
    setSelectedMember(member);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

return (
    <div className={styles.membersSection}>
      {showAddForm ? (
        <div className={styles.addMemberForm}>
        <h3 style={{ fontSize: '18px', marginTop: '-40px', marginBottom: '10px', textAlign: 'center' }}>{editingMember ? 'Edit Member' : 'Add Member'}</h3>
        {formError && <p className={styles.errorText}>{formError}</p>}

        <div style={{
          fontFamily: 'Arial, sans-serif',
          color: '#000',
          padding: '20px',
          width: '100%',
          boxShadow: '0px 0px 15px 0px rgb(154, 154, 154)',
          borderRadius: '5px',
          marginRight: '50px',
          marginLeft: '3px',
          boxSizing: 'border-box',
          height: '570px'
        }}>
          <div style={{ display: 'grid', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>First Name:</label>
                <input
                  type="text"
                  className="form-control"
                  id="first_name"
                  placeholder="First Name"
                  name="first_name"
                  value={editingMember?.first_name || newMember.first_name || ''}
                  onChange={(e) =>
                    handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                  }
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Middle Name:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Middle Name"
                  name="middle_name"
                  value={editingMember?.middle_name || newMember.middle_name || ''}
                  onChange={(e) =>
                    handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                  }
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Last Name:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="last Name"
                  name="last_name"
                  value={editingMember?.last_name || newMember.last_name || ''}
                  onChange={(e) =>
                    handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                  }
                />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Email Address:</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  name="email"
                  value={editingMember?.email || newMember.email || ''}
                  onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                />
                {editingMember?.email_error || newMember.email_error ? (
                  <span style={{ color: 'red', fontSize: '12px' }}>
                    {editingMember?.email_error || newMember.email_error}
                  </span>
                ) : null}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Date of Birth:</label>
                <input
                  type="date"
                  className="form-control"
                  placeholder="Birth Date"
                  name="birth_date"
                  min="1950-01-01"
                  max="2002-01-01"
                  value={editingMember?.birth_date || newMember.birth_date || ''}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    let age = today.getFullYear() - selectedDate.getFullYear();
                    const monthDiff = today.getMonth() - selectedDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
                      age -= 1;
                    }
                    const updatedMember = editingMember
                      ? { ...editingMember, birth_date: e.target.value, age: age > 0 ? age : '' }
                      : { ...newMember, birth_date: e.target.value, age: age > 0 ? age : '' };
                    editingMember ? setEditingMember(updatedMember) : setNewMember(updatedMember);
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '300px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Birth Place:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Birth Place"
                  name="birth_place"
                  value={editingMember?.birth_place || newMember.birth_place || ''}
                  onChange={(e) =>
                    handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                  }
                />
              </div>
              <div style={{ flex: '1', minWidth: '100px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Age:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Age"
                  name="age"
                  value={editingMember?.age || newMember.age || ''}
                  readOnly
                />
                {editingMember?.age < 21 || newMember.age < 21 ? (
                  <span style={{ color: 'red', fontSize: '12px' }}>
                    Applicants must be at least 21 years old to qualify for a loan.
                  </span>
                ) : null}
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Zip Code:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Zip Code"
                  name="zip_code"
                  value={editingMember?.zip_code || newMember.zip_code || '2616'}
                  onChange={(e) =>
                    handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                  }
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Gender:</label>
              <select
                className="form-control"
                name="gender"
                value={editingMember?.gender || newMember.gender || ''}
                onChange={(e) =>
                  handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                }
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Civil Status:</label>
              <select
                className="form-control"
                name="pstatus"
                value={editingMember?.pstatus || newMember.pstatus || ''}
                onChange={(e) =>
                  handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                }
              >
                <option value="" disabled>Select Relationship Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="In a relationship">In a relationship</option>
                <option value="Engaged">Engaged</option>
                <option value="Baak">Baak</option>
              </select>
            </div>
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Religion:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Religion"
                name="religion"
                value={editingMember?.religion || newMember.religion || ''}
                onChange={(e) =>
                  handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                }
              />
            </div>
            <div style={{ flex: '2' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Address:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Address"
                name="address"
                value={editingMember?.address || newMember.address || ''}
                onChange={(e) =>
                  handleInputChange(e, editingMember ? setEditingMember : setNewMember)
                }
              />
            </div>
            <div style={{ flex: '1', marginTop: '5px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Phone Number:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Phone Number"
                name="phone_number"
                value={editingMember?.phone_number || newMember.phone_number || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              />
              {editingMember?.phone_number_error || newMember.phone_number_error ? (
                <span style={{ color: 'red', fontSize: '12px' }}>
                  {editingMember?.phone_number_error || newMember.phone_number_error}
                </span>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', marginTop: '-3px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Height (cm)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Height"
                name="height"
                value={editingMember?.height || newMember.height || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              />
            </div>
            <div style={{ flex: '1 1 200px', marginTop: '-3px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Weight"
                name="weight"
                value={editingMember?.weight || newMember.weight || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              />
            </div>
            <div style={{ flex: '1 1 200px', marginTop: '-3px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Tax Identification Number:</label>
              <input
                type="number"
                className="form-control"
                placeholder="TIN"
                name="tin"
                value={editingMember?.tin || newMember.tin || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              />
              {editingMember?.tin_error || newMember.tin_error ? (
                <span style={{ color: 'red', fontSize: '12px' }}>
                  {editingMember?.tin_error || newMember.tin_error}
                </span>
              ) : null}
            </div>
            <div style={{ flex: '1 1 200px', marginTop: '-3px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Issued Government ID</label>
              <select
                className="form-control"
                name="valid_id"
                value={editingMember?.valid_id || newMember.valid_id || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              >
                <option value="" disabled>Select Valid ID</option>
                <option value="Philippine Passport">Philippine Passport</option>
                <option value="Driver's License">Driver's License</option>
                <option value="SSS ID">SSS ID</option>
                <option value="GSIS ID">GSIS ID</option>
                <option value="Postal ID">Postal ID</option>
                <option value="Voter's ID">Voter's ID</option>
                <option value="PhilHealth ID">PhilHealth ID</option>
                <option value="National ID">National ID</option>
              </select>
            </div>
            <div style={{ flex: '1 1 200px', marginTop: '-3px' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>ID Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="ID Number"
                name="id_no"
                value={editingMember?.id_no || newMember.id_no || ''}
                onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
              />
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {/* Annual Income */}
              <div style={{ flex: '1 1 30%', maxWidth: '300px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Annual Income
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Annual Income"
                  name="ann_com"
                  value={editingMember?.ann_com || newMember.ann_com || ''}
                  onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                />
              </div>
              {/* Membership in other Cooperatives */}
              <div style={{ flex: '1 1 30%', maxWidth: '300px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Membership in other Cooperatives
                </label>
                <input
                  className="form-control"
                  name="mem_co"
                  placeholder="Cooperatives"
                  value={editingMember?.mem_co || newMember.mem_co || ''}
                  onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                />
              </div>
              {/* Address of the Cooperative */}
              <div style={{ flex: '1 1 30%', maxWidth: '300px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Address of the Cooperative
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Address"
                  name="addresss"
                  value={editingMember?.addresss || newMember.addresss || ''}
                  onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                />
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 30%', maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                    Initial Deposit
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Deposit"
                    name="in_dep"
                    value={editingMember?.in_dep || newMember.in_dep || ''}
                    onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                  />
                  {/* Display error message if validation fails */}
                  {(editingMember?.in_dep_error || newMember?.in_dep_error) && (
                    <div style={{ color: 'red', fontSize: '12px' }}>
                      {editingMember?.in_dep_error || newMember?.in_dep_error}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* Beneficiaries Name 1 */}
                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginTop: '-20px' }}>
                      Beneficiaries Name
                    </label>
                    <input
                      className="form-control"
                      name="co_maker"
                      placeholder="Beneficiaries Name 1"
                      value={editingMember?.co_maker || newMember.co_maker || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginTop: '-20px' }}>
                      Relationship
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="relationship"
                      placeholder="Relationship"
                      value={editingMember?.relationship || newMember.relationship || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>

                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginTop: '-20px' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      placeholder="Birth Date"
                      name="birth_date1"
                      min="1950-01-01"
                      max="2003-12-31"
                      value={editingMember?.birth_date1 || newMember.birth_date1 || ''}
                      onChange={(e) => handleBirthDateChange(e, 'birth_date1')}
                    />
                  </div>
                </div>
                {/* Beneficiaries Name 2 */}
                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  <div style={{ flex: '1 1 200px', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      className="form-control"
                      name="co_maker2"
                      placeholder="Beneficiaries Name 2"
                      value={editingMember?.co_maker2 || newMember.co_maker2 || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      type="text"
                      className="form-control"
                      name="relationship2"
                      placeholder="Relationship"
                      value={editingMember?.relationship2 || newMember.relationship2 || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      type="date"
                      className="form-control"
                      placeholder="Birth Date"
                      name="birth_date2"
                      min="1950-01-01"
                      max="2003-12-31"
                      value={editingMember?.birth_date2 || newMember.birth_date2 || ''}
                      onChange={(e) => handleBirthDateChange(e, 'birth_date2')}
                    />
                  </div>
                </div>
                {/* Beneficiaries Name 3 */}
                <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  <div style={{ flex: '1 1 200px', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      className="form-control"
                      name="co_maker3"
                      placeholder="Beneficiaries Name 3"
                      value={editingMember?.co_maker3 || newMember.co_maker3 || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      type="text"
                      className="form-control"
                      name="relationship3"
                      placeholder="Relationship"
                      value={editingMember?.relationship3 || newMember.relationship3 || ''}
                      onChange={(e) => handleInputChange(e, editingMember ? setEditingMember : setNewMember)}
                    />
                  </div>
                  <div style={{ flex: '1', minWidth: '200px', marginTop: '-35px' }}>
                    <input
                      type="date"
                      className="form-control"
                      placeholder="Birth Date"
                      name="birth_date3"
                      min="1950-01-01"
                      max="2003-12-31"
                      value={editingMember?.birth_date3 || newMember.birth_date3 || ''}
                      onChange={(e) => handleBirthDateChange(e, 'birth_date3')}
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <button 
          onClick={editingMember ? handleEditMember : handleAddMember} 
          style={{ 
            backgroundColor: "#4CAF50", 
            color: "black", 
            border: "none", 
            borderRadius: "4px", 
            fontSize: "16px", 
            cursor: "pointer", 
            marginRight: "10px"
          }}
        >
          {editingMember ? 'Save Changes' : 'Submit'}
        </button>

        <button 
          onClick={() => setShowAddForm(false)} 
          style={{ 
            backgroundColor: "#f44336", 
            color: "black", 
            border: "none", 
            borderRadius: "4px", 
            fontSize: "16px", 
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    ) : (
      <>
        <div className={styles.tableHeader}>
          <h2 className="tableHeaderTitle">MEMBERS</h2>
          <div className="searchBar">
            <input
              type="text"
              placeholder="Search Members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="searchInput"
            />
          </div>
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'black',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              position: 'relative',
              marginRight: '1100px',
              marginTop: '-65px',
              position: 'fixed'
            }}
          >
            <IoIosPersonAdd style={{ marginRight: '0', fontSize: '25px', marginBottom: '-5px' }} /> Add Member
          </button>
        </div>
        <div className="tableContainer">
          <style>
            {`
            /* For WebKit-based browsers (Chrome, Safari, etc.) */
            div::-webkit-scrollbar {
              display: none;
            }
            `}
          </style>
          <table className="membersTable">
            <thead>
              <tr className="tableHeaderRow">
                <th className="tableHeaderCell">Account No.</th>
                <th className="tableHeaderCell">Full Name</th>
                <th className="tableHeaderCell">Email</th>
                <th className="tableHeaderCell">Phone Number</th>
                <th className="tableHeaderCell">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.memId} className="tableRow">
                  <td className="tableCell">{member.accountN || 'No Account'}</td>
                  <td className="tableCell">{`${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim()}</td>
                  <td className="tableCell">{member.email}</td>
                  <td className="tableCell">{member.phone_number}</td>

                  <td className="actionButtons">
                    <button
                      onClick={() => handleViewMember(member)}
                      className="actionButton actionButtonView"
                    >
                      <FaEye />
                      <span className="buttonText">View</span>
                    </button>
                    <button
                      onClick={() => handleStartEdit(member)}
                      className="actionButton actionButtonEdit"
                    >
                      <FaUserEdit />
                      <span className="buttonText">Edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="actionButton actionButtonDelete"
                    >
                      <FaTrash />
                      <span className="buttonText">Delete</span>
                    </button>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p>
                Are you sure you want to delete the member{' '}
                <strong>{memberToDelete?.first_name} {memberToDelete?.last_name}</strong>?
              </p>
              <div className="modal-actions">
                <button
                  onClick={confirmDeleteMember}
                  className="modalButtonConfirm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="modalButtonCancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Member Details Table */}
        {selectedMember && (
          <div className="memberDetailsPopup">
            <h3 className="memberDetailsTitle">Member Details</h3>
            <button
              onClick={() => setSelectedMember(null)}
              className="closePopupButton"
            >
              <IoMdCloseCircle className="closePopupIcon" /> Close
            </button>
              <div style={{
                backgroundColor: "#f9f2c8",
                padding: "5px",
              }}>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[
                    { label: "First Name", value: selectedMember.first_name },
                    { label: "Middle Name", value: selectedMember.middle_name || "N/A" },
                    { label: "Last Name", value: selectedMember.last_name },
                    { label: "Email Address", value: selectedMember.email }
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { label: "Date of Birth", value: selectedMember.birth_date },
                    { label: "Birth Place", value: selectedMember.birth_place },
                    { label: "Age", value: selectedMember.age },
                    { label: "Zip Code", value: selectedMember.zip_code }
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { label: "Gender", value: selectedMember.gender },
                    { label: "Civil Status", value: selectedMember.pstatus },
                    { label: "Religion", value: selectedMember.religion },
                    { label: "Address", value: selectedMember.address },
                    { label: "Phone Number", value: selectedMember.phone_number },
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { label: "Height (cm)", value: selectedMember.height },
                    { label: "Weight (kg)", value: selectedMember.weight },
                    { label: "Tax Identification Number", value: selectedMember.tin },
                    { label: "Issued Government ID", value: selectedMember.valid_id },
                    { label: "ID Number", value: selectedMember.id_no },
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { label: "Annual Income", value: selectedMember.ann_com },
                    { label: "Membership in other Cooperatives", value: selectedMember.mem_co },
                    { label: "Address of the Cooperative", value: selectedMember.addresss },
                    { label: "Initial Deposit", value: selectedMember.in_dep },
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { label: "Beneficiaries Name", value: selectedMember.co_maker },
                    { label: "Relationship", value: selectedMember.relationship },
                    { label: "Date of Birth", value: selectedMember.birth_date1 },
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <label style={{ display: "block", fontWeight: "bold", marginBottom: "1px" }}>{item.label}:</label>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  {[
                    { value: selectedMember.co_maker2 },
                    { value: selectedMember.relationship2 },
                    { value: selectedMember.birth_date2 }
                  ].map((item, index) => (
                    <div key={index} style={{ flex: 1 }}>
                      <input type="text" readOnly value={item.value || "N/A"} style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff"
                      }} />
                    </div>
                  ))}
              </div>

              <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                {[
                  {value: selectedMember.co_maker3 },
                  {value: selectedMember.relationship3 },
                  {value: selectedMember.birth_date3 }
                ].map((item, index) => (
                  <div key={index} style={{ flex: 1 }}>
                    <input type="text" readOnly value={item.value || "N/A"} style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff"
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div
          className="overlayBackground"
          onClick={() => setSelectedMember(null)}
          ></div>
        </>
      )}
    </div>
  );
}
export default Members;