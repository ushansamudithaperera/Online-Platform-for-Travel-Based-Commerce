import React, { useEffect, useState } from "react";
import { getAllServices } from "../../api/serviceApi"; // ✅ use servicesApi
import Navbar from "../../components/Navbar";
import ServiceCard from "../../components/ServiceCard";

export default function AllServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getAllServices();  // ✅ use servicesApi
        setServices(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container page">
        <h2>All Services</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid-cards">
            {services.length ? services.map(s => <ServiceCard key={s._id} service={s} />)
              : <p>No services found.</p>}
          </div>
        )}
      </div>
    </>
  );
}
