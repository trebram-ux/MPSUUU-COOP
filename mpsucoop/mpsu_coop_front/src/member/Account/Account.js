import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Topbar from '../Topbar/Topbar';
import Payment from '../Payments/Payments';
import './Account.css';

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [initialDeposit, setInitialDeposit] = useState(null); // For Initial Deposit

  const formatNumber = (number) => {
    if (!number) return '0.00';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const accountNumber = localStorage.getItem('account_number');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    setIsAdmin(userRole === 'admin');

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!accountNumber || !token) {
          setError('Account number or token missing.');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:8000/api/account/${accountNumber}/transactions/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const transactionsData = response.data.transactions;

        // Extract Initial Deposit from transactions
        const depositTransaction = transactionsData.find(
          (transaction) => transaction.transaction_type === 'Initial Deposit'
        );
        setInitialDeposit(depositTransaction || null);

        setTransactions(transactionsData);
      } catch (err) {
        setError('Failed to fetch transactions. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountNumber, userRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="ledger-container">
      <div className="ledger-left">
        <Topbar />

        {!showPayments && (
          <>
            <h1>{isAdmin ? 'ALL TRANSACTIONS' : 'MY TRANSACTIONS'}</h1>
            <button
              onClick={() => window.history.back()}
              style={{
                fontSize: '16px',
                backgroundColor: '#37ff7d',
                color: 'rgb(0, 0, 0)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                marginBottom: '15px',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#ff00e1')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#37ff7d')}
            >
              Back
            </button>
          </>
        )}

        <button
          onClick={() => setShowPayments(!showPayments)}
          className="toggle-button"
          style={showPayments ? { marginTop: '50px' } : {}}
        >
          {showPayments ? 'Show Transactions' : 'View Payments'}
        </button>

        {!showPayments && (
          <>
            {/* Display Initial Deposit if available */}
            {initialDeposit && (
              <div style={{ margin: '20px 0', fontWeight: 'bold' }}>
                <span>Initial Deposit: </span>
                <span style={{ color: '#2d8a2d' }}>
                  {formatNumber(initialDeposit.amount)} ({initialDeposit.timestamp})
                </span>
              </div>
            )}

            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Transaction Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Balance</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td>{transaction.transaction_type}</td>
                    <td>{formatNumber(transaction.amount)}</td>
                    <td>{transaction.description}</td>
                    <td>{formatNumber(transaction.balance_after_transaction)}</td>
                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {showPayments && (
        <div className="ledger-right">
          <Payment />
        </div>
      )}
      
    </div>
  );
};

export default Ledger;
