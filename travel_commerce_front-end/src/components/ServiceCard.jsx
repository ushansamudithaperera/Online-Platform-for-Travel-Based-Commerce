import React from "react";
import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  return (
    <div className="card">
      <img src={service.images?.[0] || "/placeholder.png"} alt={service.title} className="card-img" />
      <div className="card-body">
        <h4>{service.title}</h4>
        <p className="muted">{service.location} • {service.category}</p>
        <p className="price">LKR {service.price}</p>
        <div className="card-actions">
          <Link to={`/services/${service._id}`} className="btn small">View</Link>
        </div>
      </div>
    </div>
  );
}
