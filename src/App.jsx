import { useState } from 'react';
import './App.css';

function App() {
  const [targets, setTargets] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const addTarget = (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setTargets([
      ...targets,
      {
        id: Date.now(),
        name,
        price: parseFloat(price),
        budget: 0,
        history: [],
      },
    ]);
    setName('');
    setPrice('');
  };

  const [budgetInputs, setBudgetInputs] = useState({});

  const handleBudgetInputChange = (id, value) => {
    setBudgetInputs({
      ...budgetInputs,
      [id]: value,
    });
  };

  const addBudget = (id) => {
    const amount = parseFloat(budgetInputs[id]);
    if (!amount || amount <= 0) return;
    setTargets(
      targets.map((target) =>
        target.id === id
          ? {
              ...target,
              budget: target.budget + amount,
              history: [
                ...target.history,
                {
                  amount,
                  date: new Date().toLocaleString(),
                },
              ],
            }
          : target
      )
    );
    handleBudgetInputChange(id, '');
  };

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
            <h2>{target.name}</h2>
            <p>
              Price: ${target.price} | Budget: ${target.budget}
            </p>
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
            <div className="history">
              <h3>History</h3>
              <ul>
                {target.history.map((item, index) => (
                  <li key={index}>
                    ${item.amount} - {item.date}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
