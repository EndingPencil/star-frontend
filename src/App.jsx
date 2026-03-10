import { useState, useEffect, useRef } from 'react';
import * as Astronomy from 'astronomy-engine';

function App() {
  const [starData, setStarData] = useState(null);
  const canvasRef = useRef(null);


  useEffect(() => {
    fetch('https://star-backend-zzxu.onrender.com') // engine url
      .then(res => res.json())
      .then(data => setStarData(data.stars))
      .catch(err => console.error("Connection failed:", err));
  }, []);

  useEffect(() => {
    if (!starData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2;
    const cx = width / 2;
    const cy = height / 2;

    // Set observer location to Dahmi Kalan, Rajasthan
    const observer = new Astronomy.Observer(26.84, 75.56, 0);

    let animationFrameId;

    const drawSky = () => {
      // Clear the previous frame
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw the boundary of the sky (The Horizon)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#333';
      ctx.stroke();

      const now = new Date();

      // Loop through every star
      starData.forEach(star => {
        // astronomy-engine needs RA in hours (0-24), Python sent degrees (0-360)
        const ra_hours = star.ra / 15; 
        
        // Calculate where the star is right NOW
        const horizonCoords = Astronomy.Horizon(now, observer, ra_hours, star.dec, 'normal');

        // Only draw it if it's above the horizon (Altitude > 0)
        if (horizonCoords.altitude > 0) {
          // Convert Altitude & Azimuth to X & Y coordinates on the circle
          // Altitude 90 (Zenith) is the center. Altitude 0 (Horizon) is the edge.
          const r = radius * (1 - horizonCoords.altitude / 90);
          
          // Azimuth 0 is North (top), 90 is East (right). 
          // We subtract 90 degrees (Math.PI/2) to rotate 0 to the top of the canvas.
          const theta = (horizonCoords.azimuth * Math.PI / 180) - (Math.PI / 2);

          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);

          // Brighter stars get bigger dots
          const dotSize = Math.max(0.5, (6 - star.mag) * 0.6);

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

      // Call the next frame (this creates the 60fps loop)
      animationFrameId = requestAnimationFrame(drawSky);
    };

    drawSky();

    // Cleanup the loop if the component unmounts
    return () => cancelAnimationFrame(animationFrameId);
  }, [starData]);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: '#fff' }}>
      <h2 style={{ marginBottom: '5px' }}>Live Celestial Engine</h2>
      <p style={{ color: '#888', marginBottom: '20px' }}>Location: Dahmi Kalan | Real-Time Rendering</p>
      
      {!starData ? (
        <p style={{ color: '#fbbf24' }}>Loading star database from Python...</p>
      ) : (
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={600} 
          style={{ borderRadius: '50%', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
        />
      )}
    </div>
  );
}

export default App;