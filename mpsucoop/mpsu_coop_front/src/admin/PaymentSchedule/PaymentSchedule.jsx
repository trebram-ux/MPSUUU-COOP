import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IoArrowBackCircle } from "react-icons/io5";

axios.defaults.withCredentials = false;

const PaymentSchedule = () => {
  const [accountSummaries, setAccountSummaries] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);
  const [paying, setPaying] = useState(false);
  const [loanType, setLoanType] = useState('Regular'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [isEditBreakDown, setIsEditBreakDown] = useState(false);
  const [breakdownAmount, setBreakDownAmount] = useState(0);

  const [loanTerm, setLoanTerm] = useState(null);//allen
  const [updatedSchedules, setUpdatedSchedules] = useState([]);//allen

  const update_breakdown = async () => {
    if(breakdownAmount <= 0){
      alert("invalid amount");
      return;
    }
    const update_breakdown_request = async (schedules_id) => {
      try {
        if (schedules_id.length === 0) {
          console.log("No unpaid schedules to update.");
          return;
        }
        const response = await axios.post('http://127.0.0.1:8000/update-breakdown/', {
          schedules_id: schedules_id, 
          new_amount: breakdownAmount, 
        });
        return response;
      } catch (error) {
        console.error("Error updating breakdown:", error);
      }
    };
  
    const schedules_id = schedules
      .filter((e) => !e.is_paid) 
      .map((e) => e.id); 
  
    const res = await update_breakdown_request(schedules_id);
    console.log(res);

    //allen
    const remainingBalance = parseFloat(calculateRemainingBalance());
    if (remainingBalance && breakdownAmount > 0) {
      const newTerm = Math.ceil(remainingBalance / breakdownAmount); 
      setLoanTerm(newTerm); 

      const updatedScheduleList = generateUpdatedSchedule(newTerm);
      setUpdatedSchedules(updatedScheduleList); // allen/
      }
  
    setIsEditBreakDown(!isEditBreakDown);
    fetchPaymentSchedules(selectedAccount, loanType);
  };

  //   //allen
  // //  Function to generate updated schedules with new due dates
  // const generateUpdatedSchedule = (newTerm) => {
  //   const newSchedules = [];
  //   let currentDate = new Date(); // Start from today

  //   for (let i = 0; i < newTerm; i++) {
  //       currentDate.setDate(currentDate.getDate() + 15); 
  //       newSchedules.push({
  //           id: i + 1, // Temporary ID
  //           due_date: currentDate.toISOString().split("T")[0], // Format YYYY-MM-DD
  //           amount_due: breakdownAmount, 
  //           is_paid: false, 
  //       });
  //   }
  //   return newSchedules;
  // };//allen/

  //allen
  const generateUpdatedSchedule = (newTerm) => {
    const newSchedules = [];
    let baseDate = new Date(); 
  
    for (let i = 0; i < newTerm; i++) {
      let dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + 15 * (i + 1)); 
      newSchedules.push({
        id: i + 1,
        due_date: dueDate.toISOString().split("T")[0], 
        amount_due: breakdownAmount, 
        is_paid: false, 
      });
    }
    return newSchedules;
  };//allen/

  const revertToOriginalSchedule = async () => {
    const schedules_id = schedules.map((e) => e.id);
    try {
        const response = await axios.post('http://127.0.0.1:8000/revert-to-original/', {
            schedules_id: schedules_id,
        });
        console.log(response);
        fetchPaymentSchedules(selectedAccount, loanType, remainingBalance);

        setLoanTerm(null);
        setUpdatedSchedules([]);
    } catch (error) {
        console.error("Error reverting schedule:", error);
      }
  };

  const formatNumber = (number) => {
    if (number == null || isNaN(number)) return "N/A";
    return new Intl.NumberFormat('en-US').format(number);
  };
  
  const fetchAccountSummaries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://127.0.0.1:8000/payment-schedules/summaries/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const uniqueSummaries = response.data.reduce((acc, summary) => {
        if (!acc[summary.account_number]) {
          acc[summary.account_number] = { 
            ...summary, 
            total_balance: summary.total_balance || 0 
          };
        } else {
          acc[summary.account_number].total_balance += summary.total_balance || 0;
        }
        return acc;
      }, {});

      const accountNumbers = Object.keys(uniqueSummaries);
      const namePromises = accountNumbers.map((accountNumber) =>
        axios.get(`http://127.0.0.1:8000/members/?account_number=${accountNumber}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })
      );
      const nameResponses = await Promise.all(namePromises);

      accountNumbers.forEach((accountNumber, index) => {
        const memberData = nameResponses[index].data[0];
        if (memberData) {
          uniqueSummaries[accountNumber].account_holder = `${memberData.first_name} ${memberData.middle_name} ${memberData.last_name}`;
        }
      });

      setAccountSummaries(Object.values(uniqueSummaries));
    } catch (err) {
      console.error('Error fetching account summaries:', err);
      setError('Failed to fetch account summaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSummaries = accountSummaries.filter(summary =>
    summary.account_number.toString().includes(searchQuery) ||
    summary.account_holder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPaymentSchedules = async (accountNumber, loanType) => {
    setSchedules([]);
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/payment-schedules/?account_number=${accountNumber}&loan_type=${loanType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      setSchedules(response.data);
      setSelectedAccount(accountNumber);

      const memberResponse = await axios.get(
        `http://127.0.0.1:8000/members/?account_number=${accountNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      setAccountDetails(memberResponse.data[0]);
    } catch (err) {
      console.error('Error fetching schedules or account details:', err);
      setError('Failed to fetch payment schedules or account details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id, totalPayment) => {
    setPaying(true);
    console.log(`Marking schedule ID ${id} as paid with total payment: ₱${totalPayment.toFixed(2)}`);
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/payment-schedules/${id}/mark-paid/`,
        { received_amount: totalPayment, account_number: selectedAccount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Payment schedule marked as paid:', response.data);

      fetchPaymentSchedules(selectedAccount, loanType);
    } catch (err) {
      console.error('Error while marking as paid:', err.response ? err.response.data : err.message);
    } finally {
      setPaying(false);
    }
  };
  
  const arePreviousPaymentsPaid = (scheduleId) => {
    const index = schedules.findIndex((schedule) => schedule.id === scheduleId);
    if (index > 0) {
      return schedules[index - 1].is_paid;
    }
    return true;
  };
  
  const calculateRemainingBalance = () => {
    return schedules
      .filter(schedule => !selectedYear || new Date(schedule.due_date).getFullYear().toString() === selectedYear)
      .reduce((total, schedule) => {
        if (!schedule.is_paid || schedule.status === 'Ongoing') {
          return total + parseFloat(schedule.payment_amount || 0);
        }
        return total;
      }, 0)
      .toFixed(2);
  };

  const handleLoanTypeChange = (type) => {
    setLoanType(type);
    if (selectedAccount) {
      fetchPaymentSchedules(selectedAccount, type);
    }
  };
  
  useEffect(() => {
    fetchAccountSummaries();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ marginTop: '20px' }} className="payments-container">
      {!selectedAccount ? (
        <>
          <h2
            style={{
              width: '98%',
              marginTop: '-25px',
              padding: '20px',
              textAlign: 'center',
              color: 'black',
              fontSize: '30px',
            }}
          >
            Ongoing Payment Schedules
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', display: 'inline-block', width: '30%' }}>
              <input
                type="text"
                placeholder="Search Payments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 40px 10px 10px',
                  fontSize: '16px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  width: '270px',
                  marginLeft: '980px',
                  marginBottom: '10px',
                  marginTop: '-10px',
                }}
              />
            </div>
            </div>

          {filteredSummaries.length > 0 ? (
            <div
              style={{
                maxHeight: '410px',
                overflowY: 'auto',
                boxShadow: '0px 0px 15px 0px rgb(154, 154, 154)',
                marginTop: '-30px',
                padding: '5px',
                borderRadius: '5px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                fontSize: '20px' 
              }}
            >
              <table
                className="account-summary-table"
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                }}
              >
                <thead>
                  <tr
                    style={{
                      position: 'sticky',
                      top: '-5px',
                      backgroundColor: '#fff',
                      zIndex: 1,
                      fontSize: '20px' 
                    }}
                  >
                    <th>Account Number</th>
                    <th>Account Holder</th>
                    <th>Next Due Date</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSummaries.map((summary) => (
                    <tr
                      key={summary.account_number}
                      onClick={() => fetchPaymentSchedules(summary.account_number, loanType)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ color: 'blue' }}>{summary.account_number || 'N/A'}</td>
                      <td>{summary.account_holder || 'N/A'}</td>
                      <td>{summary.next_due_date ? new Date(summary.next_due_date).toLocaleDateString() : 'No Due Date'}</td>
                      <td>₱ {summary.total_balance?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No ongoing schedules found.</p>
          )}
        </>
      ) : (
        <>
          {accountDetails && (
            <div style={{ width: '390px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'black', fontSize: '20px', marginTop: '-50px' }}>Payment History For:</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid rgba(218, 218, 218, 0.68)' }}>Name:</td>
                    <td style={{ padding: '5px', fontSize: '18px', borderBottom: '1px solid rgba(218, 218, 218, 0.68)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{accountDetails.first_name}</span>
                      <span style={{ paddingLeft: '5px' }}>{accountDetails.middle_name}</span>
                      <span style={{ paddingLeft: '5px' }}>{accountDetails.last_name}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold', fontSize: '18px' }}>Account Number:</td>
                    <td style={{ padding: '5px', fontSize: '18px' }}>{selectedAccount}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px', fontWeight: 'bold', fontSize: '18px' }}>Remaining Balance:</td>
                    <td style={{ padding: '5px', fontSize: '18px', fontWeight: 'bold' }}>₱ {formatNumber(calculateRemainingBalance())}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div
            className="button"
            style={{
              display: 'inline-flex',
              marginTop: '20px',
            }}
          >
            <div>
              <button onClick={() => setSelectedAccount(null)}>
                <IoArrowBackCircle /> Back
              </button>

              <button
                onClick={() => handleLoanTypeChange('Regular')}
                style={{
                  backgroundColor: 'transparent',
                  color: loanType === 'Regular' ? 'rgb(4, 202, 93)' : 'black',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '5px 10px',
                  textDecoration: loanType === 'Regular' ? 'underline' : 'none',
                  marginLeft: '50px',
                }}
              >
                Regular Loans
              </button>

              <button
                onClick={() => handleLoanTypeChange('Emergency')}
                style={{
                  backgroundColor: 'transparent',
                  color: loanType === 'Emergency' ? 'rgb(4, 202, 93)' : 'black',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '5px 10px',
                  textDecoration: loanType === 'Emergency' ? 'underline' : 'none',
                }}
              >
                Emergency Loans
              </button>

              <select onChange={(e) => setSelectedYear(e.target.value)} style={{ marginTop: '10px', padding: '5px' }}>
                <option value="">All Years</option>
                {[...new Set(schedules.map(schedule => new Date(schedule.due_date).getFullYear()))].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {isEditBreakDown && (
                <>
                  <input type="number" placeholder='Principal Amount' className='edit-input' value={breakdownAmount} onChange={(e) => setBreakDownAmount(e.target.value)}
                    style={{ maxWidth:"200px" }}/>
                {/* allen  */}
                    <button onClick={revertToOriginalSchedule}>Revert to Original</button>
                </>
              )}
          
              <button onClick={isEditBreakDown ? update_breakdown : () => setIsEditBreakDown(true)} style={{ marginLeft: '20px' }}>
                {isEditBreakDown ? 'Save' : 'Edit Breakdown'}
              </button>
              {isEditBreakDown && (<button onClick={() => setIsEditBreakDown(false)}>Cancel</button>)}
            </div>
          </div>
          <div>
          {/* <p>Updated Loan Term: {loanTerm ? `${loanTerm} months` : "Not updated yet"}</p> */}
          </div>
          {schedules.length > 0 ? (
            <div
              style={{
                maxHeight: '365px',
                overflowY: 'auto',
                boxShadow: '0px 0px 15px 0px rgb(154, 154, 154)',
                marginTop: '20px',
                padding: '5px',
                borderRadius: '5px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                width: '100%',
              }}
            >
              <style>
                {`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              <table
                className="payment-schedule-table"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'center',
                  fontSize: '16px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'red',
                      color: 'black',
                      position: 'sticky',
                      top: '-10px',
                      zIndex: '1',
                    }}
                  >
                    <th>Principal Amount</th>
                    <th>Payment Amount</th>
                    <th>Penalty</th>
                    <th>Due Date</th>
                    <th>Received Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                {schedules.filter(schedule => !selectedYear || new Date(schedule.due_date).getFullYear().toString() === selectedYear).map((schedule) => (
                    <tr key={schedule.id}>
                      <td>₱ {formatNumber((parseFloat(schedule.principal_amount) || 0).toFixed(2))}</td>
                      <td>₱ {formatNumber((parseFloat(schedule.payment_amount) || 0).toFixed(2))}</td>
                      <td>₱ {formatNumber((parseFloat(schedule.penalty) || 0).toFixed(2))}</td>
                      <td>{new Date(schedule.due_date).toLocaleDateString()}</td>
                      <td>₱ {formatNumber((parseFloat(schedule.received_amnt) || 0).toFixed(2))}</td>
                      <td>₱ {formatNumber((parseFloat(schedule.balance) || 0).toFixed(2))}</td>
                      <td style={{ color: schedule.is_paid ? 'green' : 'red' }}>{schedule.is_paid ? 'Paid!' : 'Ongoing'}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          {!schedule.is_paid && (
                            <button
                              style={{
                                backgroundColor: arePreviousPaymentsPaid(schedule.id) ? 'green' : 'gray',
                                color: 'black',
                                border: '0px',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                cursor: arePreviousPaymentsPaid(schedule.id) ? 'pointer' : 'not-allowed',
                                fontSize: '14px',
                                flex: '1',
                              }}
                              onClick={(e) => {
                              
                                if (!arePreviousPaymentsPaid(schedule.id)) {
                                  e.preventDefault();
                                  alert('Previous payments must be paid first.');
                                  return; 
                                }
                                const totalPayment = parseFloat(schedule.payment_amount) || 0;
                                markAsPaid(schedule.id, totalPayment);
                              }}
                              disabled={!arePreviousPaymentsPaid(schedule.id)}
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No payment schedules found for this account.</p>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentSchedule;