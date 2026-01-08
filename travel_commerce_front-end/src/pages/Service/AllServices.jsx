import React, { useEffect, useState } from "react";
import { getAllServices } from "../../api/serviceApi"; // ✅ use servicesApi
import Navbar from "../../components/Navbar";
import ServiceCard from "../../components/ServiceCard";
import Footer from "../../components/Footer";

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
      <div className="d-flex flex-column min-vh-100">

        {/* Hero Section */}
        <div className="bg-dark text-white text-center py-5" style={{ background: "linear-gradient(to right, #2a004f, #5b2c6f)" }}>
          <div className="container py-4">
            <h1 className="display-4 fw-bold">Explore Our Services</h1>
            <p className="lead opacity-75 mx-auto" style={{ maxWidth: "600px" }}>
              From experienced tour guides to comfortable stays and reliable transport, find everything you need for your Sri Lankan journey.
            </p>
          </div>
        </div>

        <div className="container page flex-grow-1 py-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 text-secondary">Available Services</h2>
            <span className="badge bg-light text-dark border">{services.length} Services Found</span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Fetching services...</p>
            </div>
          ) : (
            <div className="grid-cards">
              {services.length ? services.map(s => <ServiceCard key={s._id} service={s} />)
                : (
                  <div className="text-center py-5 w-100">
                    <p className="text-muted fs-5">No services found at the moment.</p>
                  </div>
                )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
