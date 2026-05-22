// frontend/src/components/forms/TransactionForm.js

import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaComment, FaMoneyBillWave, FaCoins } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_URL, apiUrl } from '../../config/api';

// Accept transactionToEdit (for PUT) and onCancelEdit (for closing the form)
const TransactionForm = ({ onTransactionAdded, transactionToEdit, onCancelEdit }) => {
    const { token } = useAuth();
    const isEditMode = !!transactionToEdit;

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const { description, amount, type } = formData;

    // 🚨 useEffect to load data when in Edit Mode
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                description: transactionToEdit.description,
                // Ensure amount is a string for input field value
                amount: transactionToEdit.amount.toString(), 
                type: transactionToEdit.type 
            });
        } else {
            // Reset form for Add mode
            setFormData({ description: '', amount: '', type: 'expense' });
        }
        setError(null);
        setSuccessMsg(null);
    }, [transactionToEdit, isEditMode]); // Re-run when editing transaction changes

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setSuccessMsg(null); 
        setError(null);
    };

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);

        if (!description || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError("Please enter a valid description and a positive amount.");
            setLoading(false);
            return;
        }

        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode 
            ? `${API_URL}/api/v1/transactions/${transactionToEdit._id}`
            : `${API_URL}/api/v1/transactions`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    description, 
                    amount: parseFloat(amount),
                    type 
                })
            });

            const json = await res.json();

            if (json.success) {
                const action = isEditMode ? 'updated' : 'added';
                setSuccessMsg(`Successfully ${action}: $${parseFloat(amount).toFixed(2)}`);
                
                // Clear and reset form after successful operation
                if (!isEditMode) {
                    setFormData({ description: '', amount: '', type: 'expense' });
                }
                
                // Notify the parent component to refresh data
                onTransactionAdded(); 

                // If in edit mode, close the edit form after a brief delay
                if (isEditMode) {
                    setTimeout(() => onCancelEdit(), 500);
                }

            } else {
                setError(json.error || 'Operation failed.');
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMsg(null), 3000); 
        }
    };

    return (
        <form className="transaction-form" onSubmit={onSubmit}>
            <h3>{isEditMode ? 'Edit Transaction' : 'Add New Transaction'}</h3>
            {successMsg && <p className="alert alert-success">{successMsg}</p>}
            {error && <p className="alert alert-error">{error}</p>}
            
            {/* Type Selector (Income/Expense) */}
            <div className="form-group-radio">
                <label>Type:</label>
                <div className="radio-options">
                    <label className={type === 'income' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="type"
                            value="income"
                            checked={type === 'income'}
                            onChange={onChange}
                        />
                        <FaMoneyBillWave /> Income
                    </label>
                    <label className={type === 'expense' ? 'active' : ''}>
                        <input
                            type="radio"
                            name="type"
                            value="expense"
                            checked={type === 'expense'}
                            onChange={onChange}
                        />
                        <FaCoins /> Expense
                    </label>
                </div>
            </div>

            {/* Description Input */}
            <div className="form-group">
                <FaComment className="form-icon" />
                <input
                    type="text"
                    placeholder="Description (e.g., Groceries, Rent)"
                    name="description"
                    value={description}
                    onChange={onChange}
                    required
                />
            </div>

            {/* Amount Input */}
            <div className="form-group">
                <FaDollarSign className="form-icon" />
                <input
                    type="number"
                    placeholder="Amount (e.g., 50.00)"
                    name="amount"
                    value={amount}
                    onChange={onChange}
                    step="0.01"
                    required
                />
            </div>

            <button type="submit" className={`btn btn-${type}`} disabled={loading}>
                {loading 
                    ? 'Processing...' 
                    : isEditMode ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`
                }
            </button>
            
            {/* Cancel button only visible in Edit Mode */}
            {isEditMode && (
                <button 
                    type="button" 
                    className="btn btn-cancel" 
                    onClick={onCancelEdit}
                    disabled={loading}
                >
                    Cancel
                </button>
            )}
        </form>
    );
};

export default TransactionForm;