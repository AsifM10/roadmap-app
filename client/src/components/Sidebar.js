import React from 'react';

function Sidebar({ mostImportant, bestStrategy }) {
  if (!mostImportant && !bestStrategy) return null;

  return (
    <aside className="sidebar">
      {mostImportant && mostImportant.length > 0 && (
        <div className="sidebar-section">
          <h3>Most Important Skills</h3>
          {mostImportant.map((tier, i) => (
            <div key={i} className="tier-block">
              <h4 className={`tier-label tier-${tier.tier}`}>
                Tier {tier.tier}: {tier.label}
              </h4>
              <ul className="tier-list">
                {tier.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {bestStrategy && bestStrategy.length > 0 && (
        <div className="sidebar-section">
          <h3>Best Learning Strategy</h3>
          <ol className="strategy-list">
            {bestStrategy.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
