import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import screenshot from "./assets/status-splitter.png";

const appUrl = "/app";

function Logo() {
  return (
    <a className="logo" href="#">
      <span className="logo-mark" aria-hidden="true"><i></i><i></i></span>
      <span>Status Splitter</span>
    </a>
  );
}

function App() {
  return (
    <div className="site">
      <header className="nav">
        <div className="container nav-inner">
          <Logo />
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#how">How it works</a>
            <a href="#privacy">Local processing</a>
            <a href="#features">Features</a>
          </nav>
          <a className="nav-cta" href={appUrl}>Try it free <span>→</span></a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span></span> VIDEO CHUNKING, WITHOUT THE HASSLE</p>
              <h1>Stop trimming videos <em>manually.</em></h1>
              <p className="hero-text">
                Turn one long video into perfectly sized clips for WhatsApp,
                social media and more. Pick a duration, split it, and move on.
              </p>
              <div className="hero-actions">
                <a className="button primary" href={appUrl}>Split a video <span>→</span></a>
                <a className="text-link" href="#how">See how it works <span>↓</span></a>
              </div>

              <div className="hero-local-badge">
                <span className="local-icon">⌁</span>
                <div>
                  <strong>100% local processing</strong>
                  <span>Your video stays on your device. No upload. No data burned.</span>
                </div>
              </div>
            </div>

            <div className="hero-product">
              <div className="browser-bar">
                <span></span><span></span><span></span>
                <small>status-splitter</small>
              </div>
              <img src={screenshot} alt="Status Splitter interface showing a video split into five clips" />
            </div>
          </div>
        </section>

        <section id="privacy" className="local-first">
          <div className="container local-first-inner">
            <div className="local-first-heading">
              <p className="section-kicker">THE BIG DIFFERENCE</p>
              <h2>Your video doesn't leave your device.</h2>
            </div>
            <div className="local-first-copy">
              <div className="local-hero-line">
                <span className="signal-icon">◎</span>
                <strong>Split locally. Save your data.</strong>
              </div>
              <p>
                Status Splitter does the actual video processing right in your
                browser. Your file isn't sent to a remote server just to be cut
                into pieces.
              </p>
              <div className="local-points">
                <div><b>01</b><span>No video uploads</span></div>
                <div><b>02</b><span>No upload bandwidth wasted</span></div>
                <div><b>03</b><span>Your files stay on your machine</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="problem">
          <div className="container problem-grid">
            <div>
              <p className="section-kicker">THE PROBLEM</p>
              <h2>A simple limitation shouldn't become a tedious editing job.</h2>
            </div>
            <div className="problem-copy">
              <p>
                You have a 7-minute video. WhatsApp needs it in 90-second pieces.
                Suddenly you're scrubbing a timeline, exporting, checking durations,
                trimming again, and repeating the whole thing.
              </p>
              <p className="accent-copy">Status Splitter handles the boring part.</p>
            </div>
          </div>

          <div className="container split-demo">
            <div className="source-card">
              <span className="label">ONE VIDEO</span>
              <strong>7:19</strong>
              <span>Original video</span>
            </div>
            <div className="arrow">→</div>
            <div className="chunks">
              {["01 · 90s", "02 · 90s", "03 · 90s", "04 · 90s", "05 · 79s"].map((x) =>
                <div className="chunk" key={x}>
                  <span>{x.split(" · ")[0]}</span>
                  <b>{x.split(" · ")[1]}</b>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="container">
            <div className="section-heading">
              <p className="section-kicker">HOW IT WORKS</p>
              <h2>Three steps. No editing timeline.</h2>
              <p>Designed for the moment when you just need the video split and done.</p>
            </div>
            <div className="steps">
              <article>
                <span className="number">01</span>
                <h3>Drop your video</h3>
                <p>Drag and drop a video or choose it from your device. No upload queue.</p>
              </article>
              <article>
                <span className="number">02</span>
                <h3>Choose the length</h3>
                <p>Pick 30s, 60s, 90s or enter the exact clip duration you need.</p>
              </article>
              <article>
                <span className="number">03</span>
                <h3>Get your clips</h3>
                <p>Your browser handles the split. Download the clips individually or together.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="features" className="features-highlight">
          <div className="container">
            <div className="section-heading feature-heading">
              <p className="section-kicker">THE COOL PARTS</p>
              <h2>Simple on the surface.<br /><span>Smart under the hood.</span></h2>
              <p>Two cutting modes, local processing and platform-ready chunks — without turning video splitting into a full editing project.</p>
            </div>

            <div className="feature-cards">
              <article className="feature-card feature-local">
                <div className="feature-top">
                  <span className="feature-number">01</span>
                  <span className="feature-pill">LOCAL</span>
                </div>
                <div className="feature-symbol">◎</div>
                <h3>Your data stays yours.</h3>
                <p>
                  Video processing happens locally in your browser. That means
                  you're not uploading a 200 MB, 500 MB or 1 GB video just to split it.
                </p>
                <strong>No upload. No upload bandwidth. No cloud processing.</strong>
              </article>

              <article className="feature-card feature-fast">
                <div className="feature-top">
                  <span className="feature-number">02</span>
                  <span className="feature-pill">FAST MODE</span>
                </div>
                <div className="feature-symbol">ϟ</div>
                <h3>Fast means actually fast.</h3>
                <p>
                  Fast mode avoids full re-encoding and cuts around the nearest
                  keyframe. It's built for getting status-ready clips out quickly.
                </p>
                <strong>Bonus: fast cuts can also result in a minor file-size reduction.</strong>
              </article>

              <article className="feature-card">
                <div className="feature-top">
                  <span className="feature-number">03</span>
                  <span className="feature-pill">PRECISE MODE</span>
                </div>
                <div className="feature-symbol">⌖</div>
                <h3>Exact when exact matters.</h3>
                <p>
                  Need every clip to be exactly the duration you specified?
                  Precise mode re-encodes the video for accurate boundaries.
                </p>
                <strong>Choose control when precision matters more than speed.</strong>
              </article>

              <article className="feature-card">
                <div className="feature-top">
                  <span className="feature-number">04</span>
                  <span className="feature-pill">OFFLINE READY</span>
                </div>
                <div className="feature-symbol">⌁</div>
                <h3>One engine download. Then keep going.</h3>
                <p>
                  The first split downloads the video engine. After it's cached,
                  subsequent splitting can run fully offline.
                </p>
                <strong>Do the heavy network work once — not for every video.</strong>
              </article>
            </div>
          </div>
        </section>

        <section id="use-cases" className="use-cases">
          <div className="container">
            <div className="section-heading">
              <p className="section-kicker">BUILT FOR REAL WORK</p>
              <h2>Useful anywhere video has a limit.</h2>
            </div>
            <div className="case-grid">
              <article className="case-card featured">
                <span className="case-icon">◫</span>
                <p>01</p>
                <h3>WhatsApp status</h3>
                <span>Split a long video into status-ready 90-second clips.</span>
              </article>
              <article className="case-card">
                <span className="case-icon">▶</span>
                <p>02</p>
                <h3>Content creators</h3>
                <span>Turn one recording into several clips ready to share.</span>
              </article>
              <article className="case-card">
                <span className="case-icon">✦</span>
                <p>03</p>
                <h3>Cinema & filmmakers</h3>
                <span>Break trailers, promos and behind-the-scenes footage into chunks.</span>
              </article>
              <article className="case-card">
                <span className="case-icon">↗</span>
                <p>04</p>
                <h3>Social teams</h3>
                <span>Prepare long-form footage for platforms with strict duration limits.</span>
              </article>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container cta-box">
            <div>
              <p className="section-kicker">NO UPLOADS. NO MANUAL TRIMMING.</p>
              <h2>Split your video.<br /><span>Keep your data.</span></h2>
              <p>Fast, local, platform-ready video chunking.</p>
            </div>
            <a className="button primary" href={appUrl}>Split my video <span>→</span></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <Logo />
          <p>Simple video chunking, right in your browser.</p>
          <span>© {new Date().getFullYear()} Status Splitter</span>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
