import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServiceById } from "../../api/serviceApi"; // ✅ use servicesApi
import Navbar from "../../components/Navbar";

function buildWhatsappUrl(rawNumber) {
  const raw = String(rawNumber || "").trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = "94" + digits.slice(1);
  }
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

function formatPrice(service) {
  const currency = service.currency || "LKR";
  const price = service.priceFrom;
  if (!price) return null;

  const unit = service.priceUnit ? ` ${service.priceUnit}` : "";
  return `From ${Number(price).toLocaleString()} ${currency}${unit}`;
}

export default function ServiceDetails() {
  const { id } = useParams();
  const [service, setService] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getServiceById(id);  // ✅ use servicesApi
        setService(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [id]);

  if (!service) return (
    <>
      <Navbar />
      <div className="container page">Loading...</div>
    </>
  );

  const priceDisplay = formatPrice(service);
  const whatsappUrl = buildWhatsappUrl(service.whatsappNumber);

  return (
    <>
      <Navbar />
      <div className="container page">
        <h2>{service.title}</h2>
        <p>{service.description}</p>
        <p><strong>Location:</strong> {service.location}</p>
        {priceDisplay && <p><strong>Price:</strong> {priceDisplay}</p>}

        {whatsappUrl && (
          <p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-secondary"
            >
              WhatsApp Chat
            </a>
          </p>
        )}
      </div>
    </>
  );
}
