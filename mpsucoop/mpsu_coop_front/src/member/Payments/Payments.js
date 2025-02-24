import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = false;

const MemberPayments = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [regularLoanAmount, setRegularLoanAmount] = useState(0);
  const [emergencyLoanAmount, setEmergencyLoanAmount] = useState(0);

  const formatNumber = (number) => {
    if (!number) return "0.00";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fetchPaymentSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const accountNumber = localStorage.getItem('account_number');

      if (!accountNumber) {
        setError('Account number is missing. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://127.0.0.1:8000/payment-schedules/?account_number=${accountNumber}`,
        { withCredentials: true }
      );

      console.log('API Response: ', response.data);

      const paidSchedules = response.data.filter(
        (schedule) => schedule.is_paid || schedule.status === 'Paid'
      );

      const schedulesWithDetails = paidSchedules.map((schedule) => ({
        ...schedule,
        payment_date: schedule.payment_date
          ? new Date(schedule.payment_date).toLocaleDateString()
          : 'N/A',
        or_number: schedule.or_number || 'N/A',
      }));

      setSchedules(schedulesWithDetails);

      // Kunin ang latest loan amount sa bawat loan type
      const latestRegularLoan = paidSchedules
        .filter((schedule) => schedule.loan_type === 'Regular')
        .slice(-1)[0]?.loan_amount || 0;

      const latestEmergencyLoan = paidSchedules
        .filter((schedule) => schedule.loan_type === 'Emergency')
        .slice(-1)[0]?.loan_amount || 0;

      setRegularLoanAmount(latestRegularLoan);
      setEmergencyLoanAmount(latestEmergencyLoan);
      
    } catch (err) {
      console.error('Error fetching payment schedules:', err);
      setError('Failed to fetch payment schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSchedules();
  }, []);

  const filteredSchedules = schedules.filter((schedule) =>
    schedule.payment_date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ textAlign: 'center', color: '#000000', fontSize: '24px', marginBottom: '50px', marginTop: '120px' }}>
        My Paid Payments
      </h2>

      {/* Loan Amount Summary (Latest Loan Per Type) */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Regular Loan Amount: ₱ {formatNumber(parseFloat(regularLoanAmount).toFixed(2))}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Emergency Loan Amount: ₱ {formatNumber(parseFloat(emergencyLoanAmount).toFixed(2))}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px', marginTop: '-50px' }}>
        <input
          type="text"
          placeholder="Search by Date"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '11px',
            borderRadius: '4px',
            width: '300px',
            marginLeft: '1200px',
          }}
        />
      </div>

      {filteredSchedules.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px', fontSize: '14px' }}>
          <thead>
            <tr>
              <th>Approval Date</th>
              <th>Loan Type</th>
              <th>Principal Amount</th>
              <th>Payment Amount</th>
              <th>Advance Payment</th>
              <th>Previous Balance</th>
              <th>Penalty</th>
              <th>Received Amount</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>OR NO</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((schedule, index) => (
              <tr key={index}>
                <td>{schedule.loan_date || 'No Date Available'}</td>
                <td>{schedule.loan_type || 'N/A'}</td>
                <td>₱ {formatNumber(parseFloat(schedule.principal_amount || 0).toFixed(2))}</td>
                <td>₱ {formatNumber(parseFloat(schedule.payment_amount || 0).toFixed(2))}</td>
                <td>₱ {formatNumber((parseFloat(schedule.advance_pay) || 0).toFixed(2))}</td>
                <td>₱ {formatNumber((parseFloat(schedule.under_pay) || 0).toFixed(2))}</td>
                <td>₱ {formatNumber((parseFloat(schedule.penalty) || 0).toFixed(2))}</td>
                <td>₱ {formatNumber((parseFloat(schedule.receied_amnt) || 0).toFixed(2))}</td>
                <td>₱ {formatNumber((parseFloat(schedule.balance) || 0).toFixed(2))}</td>
                <td>
                  {schedule.payment_date
                    ? new Date(schedule.due_date).toLocaleDateString()
                    : 'No Date Available'}
                </td>
                <td>{schedule.or_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#000000', marginTop: '20px' }}>
          No paid payments found.
        </p>
      )}
    </div>
  );
};

export default MemberPayments;
