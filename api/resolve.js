module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  if (!url) return res.json({ error: 'No URL provided' });

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });

    const finalUrl = response.url;

    // Extract coordinates - priority order matters
    // !3d = lat, !4d = lng (most precise - from place data)
    // @ = lat,lng (from map center - less precise)
    const patterns = [
      { re: /!3d(-?[0-9]{1,3}\.[0-9]{4,})!4d(-?[0-9]{1,3}\.[0-9]{4,})/, latIdx: 1, lngIdx: 2 },
      { re: /@(-?[0-9]{1,3}\.[0-9]{4,}),(-?[0-9]{1,3}\.[0-9]{4,})/, latIdx: 1, lngIdx: 2 },
      { re: /[?&]q=(-?[0-9]{1,3}\.[0-9]{4,}),(-?[0-9]{1,3}\.[0-9]{4,})/, latIdx: 1, lngIdx: 2 },
      { re: /ll=(-?[0-9]{1,3}\.[0-9]{4,}),(-?[0-9]{1,3}\.[0-9]{4,})/, latIdx: 1, lngIdx: 2 },
    ];

    let lat = null, lng = null;
    
    for (const p of patterns) {
      const m = finalUrl.match(p.re);
      if (m) {
        const tlat = parseFloat(m[p.latIdx]);
        const tlng = parseFloat(m[p.lngIdx]);
        // Validate: lat must be -90 to 90, lng must be -180 to 180
        if (tlat >= -90 && tlat <= 90 && tlng >= -180 && tlng <= 180) {
          lat = tlat;
          lng = tlng;
          break;
        }
      }
    }

    if (lat === null || lng === null) {
      return res.json({ success: false, finalUrl, message: 'Coordonnees non trouvees dans le lien' });
    }

    // Get human-readable address via Nominatim
    let label = lat.toFixed(5) + ', ' + lng.toFixed(5);
    try {
      const geoResp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr&zoom=18`,
        { 
          headers: { 
            'User-Agent': 'OptiRoute/2.0 contact@optiroute.ma',
            'Accept': 'application/json'
          } 
        }
      );
      if (geoResp.ok) {
        const geoData = await geoResp.json();
        if (geoData.display_name) {
          // Build clean label: shop/building name + street + city
          const addr = geoData.address || {};
          const parts = [
            addr.shop || addr.amenity || addr.building || addr.mall || addr.leisure,
            addr.road || addr.pedestrian || addr.footway,
            addr.suburb || addr.neighbourhood || addr.city_district,
            addr.city || addr.town || addr.village
          ].filter(Boolean);
          
          label = parts.length >= 2 
            ? parts.slice(0, 3).join(', ')
            : geoData.display_name.split(',').slice(0, 3).join(', ');
        }
      }
    } catch(e) {
      // Keep coordinate label as fallback
    }

    return res.json({ 
      success: true, 
      lat, 
      lng, 
      label,
      finalUrl 
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
