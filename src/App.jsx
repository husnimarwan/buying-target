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
          // Ensure history items have timestamps for calculation
          const processedTargets = storedTargets.map(target => ({
            ...target,
            history: target.history.map(item => ({
              ...item,
              timestamp: item.timestamp || (new Date(item.date)).getTime() || target.id
            }))
          }));
          
          const sortedTargets = processedTargets.sort((a, b) => {
            const lastActivityA = a.history.length > 0 
              ? a.history[0].timestamp
              : a.id; // Use id (creation time) if no history
            const lastActivityB = b.history.length > 0 
              ? b.history[0].timestamp
              : b.id; // Use id (creation time) if no history
            return lastActivityB - lastActivityA; // Descending order (newest first)
          });
          if (isMounted) {
            setTargets(sortedTargets);
            // Initialize showHistory state for all targets to true by default (show history)
            const initialShowHistory = {};
            sortedTargets.forEach(target => {
              // Only initialize if target has history
              if (target.history && target.history.length > 0) {
                initialShowHistory[target.id] = true;
              }
            });
            setShowHistory(initialShowHistory);
            
            // Initialize collapsedTargets to false for all targets (not collapsed by default)
            const initialCollapsedTargets = {};
            sortedTargets.forEach(target => {
              initialCollapsedTargets[target.id] = false;
            });
            setCollapsedTargets(initialCollapsedTargets);
          }
        } else {
          // When user is authenticated, initialize showHistory to show all histories by default (only for targets with history)
          const initialShowHistory = {};
          targets.forEach(target => {
            // Only initialize if target has history
            if (target.history && target.history.length > 0) {
              initialShowHistory[target.id] = true;
            }
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
        // Ensure history items have timestamps for calculation and sort targets by the most recent activity
        const processedTargets = firebaseTargets.map(target => ({
          ...target,
          history: target.history.map(item => ({
            ...item,
            timestamp: item.timestamp || (new Date(item.date)).getTime() || target.id
          }))
        }));
        
        const sortedTargets = processedTargets.sort((a, b) => {
          const lastActivityA = a.history.length > 0 
            ? a.history[0].timestamp
            : a.id;
          const lastActivityB = b.history.length > 0 
            ? b.history[0].timestamp
            : b.id;
          return lastActivityB - lastActivityA;
        });
        setTargets(sortedTargets);
        
        // Initialize showHistory state for targets with history to true by default (show history)
        const initialShowHistory = {};
        sortedTargets.forEach(target => {
          // Only initialize if target has history
          if (target.history && target.history.length > 0) {
            initialShowHistory[target.id] = true;
          }
        });
        setShowHistory(initialShowHistory);
        
        // Initialize collapsedTargets to false for all targets (not collapsed by default)
        const initialCollapsedTargets = {};
        sortedTargets.forEach(target => {
          initialCollapsedTargets[target.id] = false;
        });
        setCollapsedTargets(initialCollapsedTargets);
        
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
        // Update showHistory state for the new target only if it has history
        if (newTarget.history && newTarget.history.length > 0) {
          setShowHistory(prev => ({
            ...prev,
            [newTarget.id]: true // Show history by default
          }));
        }
        // Initialize collapsed state for new target to false (not collapsed)
        setCollapsedTargets(prev => ({
          ...prev,
          [newTarget.id]: false
        }));
      }
      setName('');
      setPrice('');
    } catch (error) {
      console.error('Error adding target:', error);
    }
  };

  const [targetToDelete, setTargetToDelete] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        // Remove the target from collapsedTargets state as well
        setCollapsedTargets(prev => {
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

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await signOutUser();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const confirmLogout = () => {
    handleSignOut();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const [budgetInputs, setBudgetInputs] = useState({});
  const [showHistory, setShowHistory] = useState({}); // Track show/hide for each target
  const [collapsedTargets, setCollapsedTargets] = useState({}); // Track collapsed state for each target

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

  const toggleCollapsed = (id) => {
    setCollapsedTargets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Helper function to calculate days since date
  const getDaysSince = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    
    // Set both dates to midnight to compare based on days only
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = nowMidnight - dateMidnight;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1) return `${diffDays} days ago`;
    if (diffDays < 0) return 'Future'; // This shouldn't normally happen
    return '';
  };

  const addBudget = async (id) => {
    const amount = parseFloat(budgetInputs[id]);
    if (!amount || amount <= 0) return;
    
    try {
      if (currentUser) {
        // Update in Firebase - subscription will handle UI update
        const targetToUpdate = targets.find(target => target.id === id);
        if (!targetToUpdate) return;
        
        const now = new Date();
        const updatedTarget = {
          ...targetToUpdate,
          budget: targetToUpdate.budget + amount,
          history: [
            {  // Add new entry at the beginning of the history array
              amount,
              date: now.toLocaleString(),
              timestamp: now.getTime(), // Store timestamp for calculations
            },
            ...targetToUpdate.history
          ],
        };
        
        await updateTargetInFirebase(id, updatedTarget);
        // Also update local database
        await updateTargetInDB(updatedTarget);
        
        // If this target didn't have history before, initialize showHistory to true
        const hadHistoryBefore = targetToUpdate.history && targetToUpdate.history.length > 0;
        if (!hadHistoryBefore) {
          setShowHistory(prev => ({
            ...prev,
            [id]: true // Show history for target that now has history
          }));
        }
      } else {
        setTargets(prevTargets => {
          // Find the target to update
          const targetToUpdate = prevTargets.find(target => target.id === id);
          if (!targetToUpdate) return prevTargets;
          
          // Create updated target with new budget and history
          const now = new Date();
          const updatedTarget = {
            ...targetToUpdate,
            budget: targetToUpdate.budget + amount,
            history: [
              {  // Add new entry at the beginning of the history array
                amount,
                date: now.toLocaleString(),
                timestamp: now.getTime(), // Store timestamp for calculations
              },
              ...targetToUpdate.history
            ],
          };
          
          // Remove the target from its current position and add it to the beginning
          const filteredTargets = prevTargets.filter(target => target.id !== id);
          const newTargets = [updatedTarget, ...filteredTargets];
          
          // Update the target in the database
          updateTargetInDB(updatedTarget);
          
          // If this target didn't have history before, initialize showHistory to true
          const hadHistoryBefore = targetToUpdate.history && targetToUpdate.history.length > 0;
          if (!hadHistoryBefore) {
            setShowHistory(prev => ({
              ...prev,
              [id]: true // Show history for target that now has history
            }));
          }
          
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
        <h1>Loading Wishlist Tracker...</h1>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <h1>Wishlist Tracker</h1>
        {currentUser ? (
          <div className="auth-info">
            <div className="user-info">
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'User')}&background=0D8ABC&color=fff`} 
                alt="Profile" 
                className="profile-pic" 
                referrerPolicy="no-referrer"
                onClick={handleSignOutClick}
                style={{ cursor: 'pointer' }}
                onError={(e) => {
                  // If both Google profile pic and fallback fail, use a default avatar 
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || currentUser.email || 'User')}&background=0D8ABC&color=fff`;
                  e.target.referrerPolicy = "no-referrer";
                }}
              />
            </div>
          </div>
        ) : (
          <div className="auth-prompt">
            <button 
              onClick={handleGoogleSignIn} 
              disabled={authLoading}
              className="auth-btn google-signin"
            >
              {authLoading ? '...' : 'Sign in'}
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
          <div key={target.id} className={`target ${collapsedTargets[target.id] ? 'collapsed' : ''}`}>
            <div className="target-header">
              <h2 onClick={() => toggleCollapsed(target.id)} style={{ cursor: 'pointer' }}>{target.name}</h2>
              <button 
                className="delete-btn" 
                onClick={() => confirmDelete(target.id)}
                aria-label="Delete target"
              >
                ×
              </button>
            </div>
            <div className="target-content">
              <p>
                Price: ${target.price} | Budget: ${target.budget}
              </p>
              {target.budget < target.price && (
                <p className="remaining">
                  ${Math.max(0, target.price - target.budget).toFixed(2)} more needed
                </p>
              )}
              {target.budget >= target.price && (
                <p className="notification">
                  <span className="checkmark">✓</span> You've met your buying target!
                </p>
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
              {target.history && target.history.length > 0 && (
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
                          <div className="history-amount-date">
                            <span className="history-amount">${item.amount}</span>
                            <span className="history-date">{item.date}</span>
                          </div>
                          <span className="history-days">{getDaysSince(item.timestamp)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
      
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <p>Are you sure you want to log out?</p>
            <div className="confirmation-buttons">
              <button className="confirm-btn" onClick={confirmLogout}>Yes</button>
              <button className="cancel-btn" onClick={cancelLogout}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
