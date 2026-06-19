export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const url = req.query.url;
  if (!url) return res.json({ error: 'No URL provided' });

  try {
    // Follow redirects to get final URL
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' }
    });

    const finalUrl = response.url;

    // Extract coordinates from final URL
    const patterns = [
      /@(-?[\d]{1,3}\.[\d]+),(-?[\d]{1,3}\.[\d]+)/,
      /!3d(-?[\d]{1,3}\.[\d]+)!4d(-?[\d]{1,3}\.[\d]+)/,
      /[?&]q=(-?[\d]{1,3}\.[\d]+),(-?[\d]{1,3}\.[\d]+)/,
      /ll=(-?[\d]{1,3}\.[\d]+),(-?[\d]{1,3}\.[\d]+)/
    ];

    let lat = null, lng = null;
    for (const p of patterns) {
      const m = finalUrl.match(p);
      if (m) {
        lat = parseFloat(m[1]);
        lng = parseFloat(m[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) break;
        else { lat = null; lng = null; }
      }
    }

    if (lat && lng) {
      // Get address from coordinates using Nominatim
      let label = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      try {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
          { headers: { 'User-Agent': 'OptiRoute/1.0' } }
        );
        const geoData = await geo.json();
        if (geoData.display_name) {
          label = geoData.display_name.split(',').slice(0, 3).join(', ');
        }
      } catch(e) {}

      return res.json({ success: true, lat, lng, label, finalUrl });
    }

    return res.json({ success: false, finalUrl, message: 'Coordonnees non trouvees dans le lien' });

  } catch (e) {
    return res.json({ error: e.message });
  }
}