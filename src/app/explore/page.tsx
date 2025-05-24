<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {explores.map((explore) => (
    <div key={explore.id} className="explore-card">
      <div className="explore-header">
        <img src={explore.icon} alt={explore.name} className="explore-icon" />
        <div className="explore-info">
          <h3 className="explore-title">{explore.name}</h3>
          <p className="explore-description">{explore.description}</p>
        </div>
      </div>
      <div className="explore-meta">
        <span className="explore-category">{explore.category}</span>
        <div className="explore-stats">
          <span className="explore-rating">⭐ {explore.rating}</span>
          <span className="explore-downloads">⬇️ {explore.downloads}</span>
        </div>
      </div>
      <div className="explore-tags">
        {explore.tags.map((tag) => (
          <span key={tag} className="explore-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  ))}
</div> 