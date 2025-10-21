import { useState, useEffect } from 'react';
import { getAllTargets, addTargetToDB, updateTargetInDB, deleteTargetFromDB } from './utils/db';
import './App.css';

function App() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Load targets from database when component mounts
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const storedTargets = await getAllTargets();
        // Sort targets by the most recent activity (last history item or creation time)
        const sortedTargets = storedTargets.sort((a, b) => {
          const lastActivityA = a.history.length > 0 
            ? new Date(a.history[0].date).getTime() 
            : a.id; // Use id (creation time) if no history
          const lastActivityB = b.history.length > 0 
            ? new Date(b.history[0].date).getTime() 
            : b.id; // Use id (creation time) if no history
          return lastActivityB - lastActivityA; // Descending order (newest first)
        });
        setTargets(sortedTargets);
      } catch (error) {
        console.error('Error loading targets from database:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTargets();
  }, []);

  const addTarget = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    
    const newTarget = {
      id: Date.now(),
      name,
      price: parseFloat(price),
      budget: 0,
      history: [],
    };
    
    try {
      await addTargetToDB(newTarget);
      setTargets(prevTargets => [newTarget, ...prevTargets]); // Add to the beginning of the array
      setName('');
      setPrice('');
    } catch (error) {
      console.error('Error adding target to database:', error);
    }
  };

  const [targetToDelete, setTargetToDelete] = useState(null);

  const deleteTarget = async (id) => {
    try {
      await deleteTargetFromDB(id);
      setTargets(prevTargets => prevTargets.filter(target => target.id !== id));
      setTargetToDelete(null); // Close the confirmation dialog
    } catch (error) {
      console.error('Error deleting target from database:', error);
      setTargetToDelete(null); // Close the confirmation dialog
    }
  };

  const confirmDelete = (id) => {
    setTargetToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (targetToDelete) {
      deleteTarget(targetToDelete);
    }
  };

  const handleDeleteCancel = () => {
    setTargetToDelete(null);
  };

  const [budgetInputs, setBudgetInputs] = useState({});

  const handleBudgetInputChange = (id, value) => {
    setBudgetInputs({
      ...budgetInputs,
      [id]: value,
    });
  };

  const addBudget = async (id) => {
    const amount = parseFloat(budgetInputs[id]);
    if (!amount || amount <= 0) return;
    
    try {
      setTargets(prevTargets => {
        // Find the target to update
        const targetToUpdate = prevTargets.find(target => target.id === id);
        if (!targetToUpdate) return prevTargets;
        
        // Create updated target with new budget and history
        const updatedTarget = {
          ...targetToUpdate,
          budget: targetToUpdate.budget + amount,
          history: [
            {  // Add new entry at the beginning of the history array
              amount,
              date: new Date().toLocaleString(),
            },
            ...targetToUpdate.history
          ],
        };
        
        // Remove the target from its current position and add it to the beginning
        const filteredTargets = prevTargets.filter(target => target.id !== id);
        const newTargets = [updatedTarget, ...filteredTargets];
        
        // Update the target in the database
        updateTargetInDB(updatedTarget);
        
        return newTargets;
      });
      handleBudgetInputChange(id, '');
    } catch (error) {
      console.error('Error updating target in database:', error);
    }
  };

  if (loading) {
    return <div className="App"><h1>Loading Buying Target Tracker...</h1></div>;
  }

  return (
    <div className="App">
      <h1>Buying Target Tracker</h1>
      <form onSubmit={addTarget}>
        <input
          type="text"
          placeholder="Target Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Target Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit">Add Target</button>
      </form>
      <div className="targets">
        {targets.map((target) => (
          <div key={target.id} className="target">
            <div className="target-header">
              <h2>{target.name}</h2>
              <button 
                className="delete-btn" 
                onClick={() => confirmDelete(target.id)}
                aria-label="Delete target"
              >
                ×
              </button>
            </div>
            <p>
              Price: ${target.price} | Budget: ${target.budget}
            </p>
            {target.budget < target.price && (
              <p className="remaining">
                ${Math.max(0, target.price - target.budget).toFixed(2)} more needed
              </p>
            )}
            {target.budget >= target.price && (
              <p className="notification">You've met your buying target!</p>
            )}
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${Math.min(
                    100,
                    (target.budget / target.price) * 100
                  )}%`,
                }}
              >
                {`${Math.round((target.budget / target.price) * 100)}%`}
              </div>
            </div>
            {target.budget < target.price && (
              <div className="add-budget">
                <input
                  type="number"
                  placeholder="Add Budget"
                  value={budgetInputs[target.id] || ''}
                  onChange={(e) =>
                    handleBudgetInputChange(target.id, e.target.value)
                  }
                />
                <button onClick={() => addBudget(target.id)}>Add</button>
              </div>
            )}
            <div className="history">
              <h3>History</h3>
              <ul>
                {target.history.map((item, index) => (
                  <li key={index}>
                    <span>${item.amount}</span>
                    <span>{item.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      {/* Confirmation Dialog */}
      {targetToDelete !== null && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <p>Are you sure you want to delete this target?</p>
            <div className="confirmation-buttons">
              <button className="confirm-btn" onClick={handleDeleteConfirm}>Yes</button>
              <button className="cancel-btn" onClick={handleDeleteCancel}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
