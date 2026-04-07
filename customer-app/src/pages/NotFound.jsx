import React from 'react';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-anim">📱</div>
      <h1>Scan a QR Code</h1>
      <p>This page can only be accessed by scanning the QR code on your table.</p>
      <div className="not-found-steps">
        <div className="nf-step">
          <span className="nf-step-num">1</span>
          <span>Find the QR code on your table</span>
        </div>
        <div className="nf-step">
          <span className="nf-step-num">2</span>
          <span>Open your camera or QR scanner</span>
        </div>
        <div className="nf-step">
          <span className="nf-step-num">3</span>
          <span>Scan to view the menu &amp; order</span>
        </div>
      </div>
    </div>
  );
}
