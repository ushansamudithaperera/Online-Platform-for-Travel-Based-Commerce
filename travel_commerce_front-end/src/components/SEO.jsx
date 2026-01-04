import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, image, url }) {
    const siteTitle = "Travel Commerce Platform";
    const defaultDesc = "Plan your entire trip in one place. Book hotels, guides, and transport seamlessly.";
    const defaultImage = "/home-bg1.png"; // Make sure this image is in your /public folder
    const siteUrl = window.location.origin; 

    // Logic: Use provided data, otherwise fallback to defaults
    const metaTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const metaDesc = description ? description.substring(0, 160) : defaultDesc; // Google cuts off at 160 chars
    const metaImage = image || defaultImage;
    const metaUrl = url || siteUrl;

    return (
        <Helmet>
            {/* 1. Standard Search Engine Tags */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDesc} />

            {/* 2. Facebook / WhatsApp / LinkedIn (Open Graph) */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDesc} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />

            {/* 3. Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDesc} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
}


//Frontend Change: Your friend MUST use FormData in React when calling this endpoint, not standard JSON