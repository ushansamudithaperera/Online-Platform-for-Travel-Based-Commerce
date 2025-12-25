


import React, { useEffect, useState } from "react";
import { getAllServices, searchServices } from "../../api/serviceApi";
import Navbar from "../../components/Navbar";
import ServiceCard from "../../components/ServiceCard";
import SEO from "../../components/SEO";

export default function AllServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await getAllServices();
      setServices(res.data || []);
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await searchServices(category, district);
      setServices(res.data || []);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCategory("");
    setDistrict("");
    loadAll();
  };

  // --- INLINE STYLES FOR LAYOUT ---
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
    },
    header: {
      marginBottom: "20px",
      fontSize: "2rem",
      color: "#333",
    },
    searchCard: {
      backgroundColor: "#f8f9fa",
      padding: "20px",
      borderRadius: "8px",
      marginBottom: "30px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    formRow: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap",
      alignItems: "flex-end",
    },
    formGroup: {
      flex: "1 1 250px", // Grow to fill space, min-width 250px
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontWeight: "bold",
      marginBottom: "5px",
      fontSize: "0.9rem",
    },
    input: {
      padding: "10px",
      borderRadius: "4px",
      border: "1px solid #ced4da",
      fontSize: "1rem",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      flex: "1 1 150px",
    },
    btnPrimary: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      flex: 1,
    },
    btnSecondary: {
      backgroundColor: "#6c757d",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      flex: 1,
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", // 🚨 MAGIC FIX: Responsive Grid
      gap: "25px",
      width: "100%",
    },
    noResults: {
      textAlign: "center",
      padding: "40px",
      backgroundColor: "#fff3cd",
      borderRadius: "8px",
      color: "#856404",
    },
  };

  return (
    <>
      <SEO title="All Services | Travel Commerce" description="Search for hotels, drivers, and guides." />
      <Navbar />
      
      <div style={styles.container}>
        <h2 style={styles.header}>Find Your Perfect Service</h2>

        {/* 🔍 SEARCH BAR SECTION */}
        <div style={styles.searchCard}>
          <form onSubmit={handleSearch} style={styles.formRow}>
            
            {/* Category */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select 
                style={styles.input} 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Hotel">Hotels</option>
                <option value="Driver">Drivers</option>
                <option value="Guide">Tour Guides</option>
                <option value="Experience">Experiences</option>
              </select>
            </div>

            {/* District */}
            <div style={styles.formGroup}>
              <label style={styles.label}>District / City</label>
              <input 
                type="text" 
                style={styles.input} 
                placeholder="e.g. Kandy, Galle..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.btnPrimary}>Search</button>
              <button type="button" style={styles.btnSecondary} onClick={handleClear}>Clear</button>
            </div>
          </form>
        </div>

        {/* 📋 SERVICE LIST GRID */}
        {loading ? (
          <p style={{textAlign: "center"}}>Loading services...</p>
        ) : services.length === 0 ? (
          <div style={styles.noResults}>
            <h4>No services found.</h4>
            <p>Try searching for something else or click Clear.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {services.map((s) => (
              <ServiceCard key={s.id || s._id} service={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}























// import React, { useEffect, useState } from "react";
// import { getAllServices } from "../../api/serviceApi"; // ✅ use servicesApi
// import Navbar from "../../components/Navbar";
// import ServiceCard from "../../components/ServiceCard";

// export default function AllServices() {
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await getAllServices();  // ✅ use servicesApi
//         setServices(res.data || []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <>
//       <Navbar />
//       <div className="container page">
//         <h2>All Services</h2>
//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <div className="grid-cards">
//             {services.length ? services.map(s => <ServiceCard key={s._id} service={s} />)
//               : <p>No services found.</p>}
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
