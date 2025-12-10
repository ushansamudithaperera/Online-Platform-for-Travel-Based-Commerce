import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServiceById } from "../../api/serviceApi"; // ✅ use servicesApi
import Navbar from "../../components/Navbar";

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

  return (
    <>
      <Navbar />
      <div className="container page">
        <h2>{service.title}</h2>
        <p>{service.description}</p>
        <p><strong>Location:</strong> {service.location}</p>
        <p><strong>Price:</strong> LKR {service.price}</p>
      </div>
    </>
  );
}
