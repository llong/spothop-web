import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website'
}: SEOProps) => {
  const siteTitle = 'SpotHop';
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} | Find & Share Skate Spots`;
  const defaultDescription = 'SpotHop - The ultimate social network for finding, sharing, and discussing the best skate spots in your community.';
  const defaultImage = 'https://spothop.app/spothopIcon.png';
  const siteUrl = 'https://spothop.app';

  const seoData = {
    title: fullTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url ? `${siteUrl}${url}` : siteUrl,
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoData.url} />
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:image" content={seoData.image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoData.url} />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={seoData.image} />
    </Helmet>
  );
};

export default SEO;
