import React from 'react';
import { PluginsPageProps } from '@/types/features';

const PluginsPage: React.FC<PluginsPageProps> = ({ plugins, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {plugins.map((plugin) => (
        <div key={plugin.id} className="plugin-card">
          <div className="plugin-header">
            <img src={plugin.icon} alt={plugin.name} className="plugin-icon" />
            <div className="plugin-info">
              <h3 className="plugin-title">{plugin.name}</h3>
              <p className="plugin-description">{plugin.description}</p>
            </div>
          </div>
          <div className="plugin-meta">
            <span className="plugin-category">{plugin.category}</span>
            <div className="plugin-stats">
              <span className="plugin-rating">⭐ {plugin.rating}</span>
              <span className="plugin-downloads">⬇️ {plugin.downloads}</span>
            </div>
          </div>
          <div className="plugin-tags">
            {plugin.tags.map((tag) => (
              <span key={tag} className="plugin-tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="plugin-version">
            <span>版本: {plugin.version}</span>
            <span>更新: {plugin.lastUpdated}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PluginsPage; 