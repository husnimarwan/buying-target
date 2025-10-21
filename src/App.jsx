import { useState, useEffect } from 'react';
import { getAllTargets, addTargetToDB, updateTargetInDB, deleteTargetFromDB } from './utils/db';
import { signInWithGoogle, signOutUser, onAuthChange } from './utils/auth';
import { getAllTargetsFirebase, addTargetToFirebase, updateTargetInFirebase, deleteTargetFromFirebase, subscribeToTargets } from './utils/firebaseDb';
import './App.css';

function App() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Synced'); // 'Synced', 'Syncing', 'Offline'
  let unsubscribeTargets = null;

  // Set up auth state listener
  useEffect(() => {
    setLoading(true); // Start with loading state
    
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Load targets from database when component mounts or auth state changes
  useEffect(() => {
    let isMounted = true; // To prevent state updates on unmounted components
    
    const loadTargets = async () => {
      try {
        if (!currentUser) {
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
          if (isMounted) {
            setTargets(sortedTargets);
            // Initialize showHistory state for all targets to true by default
            const initialShowHistory = {};
            sortedTargets.forEach(target => {
              initialShowHistory[target.id] = true;
            });
            setShowHistory(initialShowHistory);
          }
        } else {
          // When user is authenticated, initialize showHistory to show all histories by default
          const initialShowHistory = {};
          targets.forEach(target => {
            initialShowHistory[target.id] = true;
          });
          setShowHistory(initialShowHistory);
        }
      } catch (error) {
        console.error('Error loading targets from database:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only load local targets if user is not authenticated
    if (!currentUser) {
      loadTargets();
    }
  }, [currentUser]);

  // Set up real-time listener for Firebase targets when user is authenticated
  useEffect(() => {
    if (currentUser) {
      setSyncStatus('Syncing');
      
      const unsubscribe = subscribeToTargets(currentUser.uid, (firebaseTargets) => {
        // Sort targets by the most recent activity
        const sortedTargets = firebaseTargets.sort((a, b) => {
          const lastActivityA = a.history.length > 0 
            ? new Date(a.history[0].date).getTime() 
            : a.id;
          const lastActivityB = b.history.length > 0 
            ? new Date(b.history[0].date).getTime() 
            : b.id;
          return lastActivityB - lastActivityA;
        });
        setTargets(sortedTargets);
        
        // Initialize showHistory state for all targets to true by default
        const initialShowHistory = {};
        sortedTargets.forEach(target => {
          initialShowHistory[target.id] = true;
        });
        setShowHistory(initialShowHistory);
        
        setSyncStatus('Synced');
      });

      // Clean up subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

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
      if (currentUser) {
        // Add to Firebase - the subscription will update the UI
        await addTargetToFirebase(currentUser.uid, newTarget);
        // Also save locally as backup/cached
        await addTargetToDB(newTarget);
      } else {
        // Add to local database only and update UI directly
        await addTargetToDB(newTarget);
        setTargets(prevTargets => [newTarget, ...prevTargets]); // Add to the beginning of the array
        // Update showHistory state for the new target
        setShowHistory(prev => ({
          ...prev,
          [newTarget.id]: true // Show history by default for new targets
        }));
      }
      setName('');
      setPrice('');
    } catch (error) {
      console.error('Error adding target:', error);
    }
  };

  const [targetToDelete, setTargetToDelete] = useState(null);

  const deleteTarget = async (id) => {
    try {
      if (currentUser) {
        // Delete from Firebase - the subscription will update the UI
        await deleteTargetFromFirebase(id);
        // Also delete from local database
        await deleteTargetFromDB(id);
      } else {
        // Delete from local database only and update UI directly
        await deleteTargetFromDB(id);
        setTargets(prevTargets => prevTargets.filter(target => target.id !== id));
        // Remove the target from showHistory state as well
        setShowHistory(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
      setTargetToDelete(null); // Close the confirmation dialog
    } catch (error) {
      console.error('Error deleting target:', error);
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

  // Authentication functions
  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const [budgetInputs, setBudgetInputs] = useState({});
  const [showHistory, setShowHistory] = useState({}); // Track show/hide for each target

  const handleBudgetInputChange = (id, value) => {
    setBudgetInputs({
      ...budgetInputs,
      [id]: value,
    });
  };

  const toggleHistory = (id) => {
    setShowHistory(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const addBudget = async (id) => {
    const amount = parseFloat(budgetInputs[id]);
    if (!amount || amount <= 0) return;
    
    try {
      if (currentUser) {
        // Update in Firebase - subscription will handle UI update
        const targetToUpdate = targets.find(target => target.id === id);
        if (!targetToUpdate) return;
        
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
        
        await updateTargetInFirebase(id, updatedTarget);
        // Also update local database
        await updateTargetInDB(updatedTarget);
      } else {
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
      }
      handleBudgetInputChange(id, '');
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <h1>Loading Buying Target Tracker...</h1>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <h1>Buying Target Tracker</h1>
        {currentUser ? (
          <div className="auth-info">
            <div className="user-info">
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'User')}&background=0D8ABC&color=fff`} 
                alt="Profile" 
                className="profile-pic" 
                onError={(e) => {
                  // If both Google profile pic and fallback fail, use a default avatar 
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'User')}&background=0D8ABC&color=fff`;
                }}
              />
              <span>{currentUser.displayName || currentUser.email}</span>
            </div>
            <div className="sync-status">Status: {syncStatus}</div>
            <button 
              onClick={handleSignOut} 
              disabled={authLoading}
              className="auth-btn signout-btn"
            >
              {authLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <div className="auth-prompt">
            <p>Sign in to sync your targets across devices</p>
            <button 
              onClick={handleGoogleSignIn} 
              disabled={authLoading}
              className="auth-btn google-signin"
            >
              {authLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        )}
      </div>
      
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
              <div className="history-header">
                <h3>History</h3>
                <button 
                  className="toggle-history-btn"
                  onClick={() => toggleHistory(target.id)}
                  aria-label={showHistory[target.id] ? "Hide history" : "Show history"}
                >
                  {showHistory[target.id] ? "Hide" : "Show"}
                </button>
              </div>
              {showHistory[target.id] && (
                <ul>
                  {target.history.map((item, index) => (
                    <li key={index}>
                      <span>${item.amount}</span>
                      <span>{item.date}</span>
                    </li>
                  ))}
                </ul>
              )}
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
