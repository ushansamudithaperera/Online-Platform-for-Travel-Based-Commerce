import React from "react";
import { Link } from "react-router-dom";

function formatPrice(service) {
  const currency = service.currency || "LKR";
  const price = service.priceFrom;
  if (!price) return null;

  const unit = service.priceUnit ? ` ${service.priceUnit}` : "";
  return `From ${Number(price).toLocaleString()} ${currency}${unit}`;
}

export default function ServiceCard({ service }) {
  const priceDisplay = formatPrice(service);

  return (
    <div className="card">
      <img src={service.images?.[0] || "/placeholder.png"} alt={service.title} className="card-img" />
      <div className="card-body">
        <h4>{service.title}</h4>
        <p className="muted">{service.location} • {service.category}</p>
        {priceDisplay && <p className="price">{priceDisplay}</p>}
        <div className="card-actions">
          <Link to={`/services/${service._id}`} className="btn small">View</Link>
        </div>
      </div>
    </div>
  );
}
