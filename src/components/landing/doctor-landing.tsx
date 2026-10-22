"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, FileText, HeartPulse, LockKeyhole, Menu, ShieldCheck, Sparkles, Stethoscope, Video, X } from "lucide-react";
import styles from "./landing.module.css";

const previews = [
  { label: "Patient records", icon: FileText, title: "The story behind the symptoms.", description: "Bring shared reports, medications and health history into one patient timeline.", image: "records", heading: "Patient timeline", rows: ["Lab report shared", "Medication history", "Previous consultation"], tag: "Shared with patient consent" },
  { label: "Ekaay summaries", icon: Sparkles, title: "More context. A clearer starting point.", description: "Let Ekaay bring the details together, so you can review the context and make the clinical decisions.", image: "medicines", heading: "Ekaay · patient summary", rows: ["Health history at a glance", "Recent results to review", "Current medications"], tag: "AI-assisted · doctor reviewed" },
  { label: "Consultations", icon: Video, title: "Be there, wherever care happens.", description: "Move from your schedule to a video consultation, then review and sign the prescription in the same workspace.", image: "consult", heading: "Your consultation workspace", rows: ["Review patient context", "Start video consultation", "Review and sign prescription"], tag: "From conversation to care" },
];
const questions = [
  ["How do I get started?", "Register with your mobile number, verify it with a one-time password, and complete your doctor profile and registration details."],
  ["How do I access a patient’s records?", "Patient records are opened with the patient’s OTP. Access is time-limited, and the patient stays in control of sharing their health information."],
  ["Does Ekaay make clinical decisions?", "Ekaay helps summarize patient information. You review the information and remain responsible for clinical decisions and prescriptions."],
  ["Can I use the console on my phone?", "Yes. The doctor console adapts to your phone, tablet and desktop, so you can use the workspace on the screen that suits your day."],
];

function Brand() {
  return <span className={styles.brand}><Image src="/logo-mark.png" width={38} height={38} alt="" /><span>health<span>matrix</span><small>FOR DOCTORS</small></span></span>;
}

export function DoctorLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const welcomeSlides = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const preview = previews[active];
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add(styles.visible); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    root.current?.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <div className={styles.landing} ref={root} id="main">
    <a href="#main" className={styles.skip}>Skip to content</a>
    <div className={styles.mobileWelcome}>
      <header className={styles.welcomeHeader}><Brand /><Link href="/login">Sign in <ArrowUpRight size={15} /></Link></header>
      <main className={styles.welcomeBody} aria-label="Welcome to HealthMatrix for doctors">
        <div className={styles.welcomeVisual} aria-hidden="true"><div className={styles.welcomeHalo} /><span className={styles.welcomeOrb} /><Image src="/landing/doctors.png" width={500} height={500} alt="" priority /><div className={styles.welcomeFloat}><span><ShieldCheck size={18} /></span><div><strong>Connected by care</strong><small>Built around you and your patients</small></div></div><span className={styles.welcomeSpark}><Sparkles size={21} /></span></div>
        <div className={styles.welcomeIntro}><span>YOUR PRACTICE, CONNECTED</span><h1>Good care begins<br />with the <em>whole picture.</em></h1><p>A calmer space for patient stories,<br />clearer decisions and meaningful care.</p></div>
        <div className={styles.welcomeCarousel} ref={welcomeSlides} aria-label="Discover your workspace" onScroll={(event) => { const el = event.currentTarget; setWelcomeStep(Math.round(el.scrollLeft / el.clientWidth)); }}>{previews.map(({ label, description, icon: Icon, image }, index) => <article className={styles.welcomeSlide} key={label} aria-label={`${index + 1} of 3: ${label}`}><div className={styles.welcomeFeature}><span className={styles.welcomeFeatureImage}><Image src={`/landing/${image}.png`} width={62} height={62} alt="" /></span><div><span className={styles.welcomeFeatureLabel}><Icon size={12} />{["THE CONTEXT", "THE CLARITY", "THE CONNECTION"][index]}</span><h2>{label}</h2><p>{description}</p></div></div></article>)}</div>
        <div className={styles.welcomePagination} aria-label="Choose a feature">{previews.map(({ label }, index) => <button key={label} type="button" aria-label={`Show ${label}`} aria-pressed={welcomeStep === index} className={welcomeStep === index ? styles.currentDot : ""} onClick={() => { const el = welcomeSlides.current; if (el) el.scrollTo({ left: index * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }} />)}</div>
      </main>
      <section className={styles.mobileDetails} aria-label="Get to know HealthMatrix">
        <div className={styles.mobileSectionTitle}><span>MADE FOR YOUR EVERYDAY</span><h2>From the first hello<br />to the follow-up.</h2></div>
        <div className={styles.mobileJourney}>{[{ icon: Stethoscope, title: "Your practice, in one place", text: "Keep your consultations, patient context and prescriptions together." }, { icon: Sparkles, title: "A clearer starting point", text: "Review Ekaay’s summaries and shared health history before your consultation." }, { icon: ShieldCheck, title: "Consent comes first", text: "Patient records open with their OTP, with time-limited access." }].map(({ icon: Icon, title, text }, index) => <article key={title}><span><Icon size={21} /></span><div><small>0{index + 1}</small><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        <div className={styles.mobileTrust}><LockKeyhole size={24} /><h2>Their story.<br />Shared on their terms.</h2><p>Patient-authorized records. Doctor-reviewed decisions. Care built on trust.</p><span><Check size={13} /> You stay in charge of clinical decisions</span></div>
        <div className={styles.mobileQuestions}><div className={styles.mobileSectionTitle}><span>A LITTLE MORE CLARITY</span><h2>Before you begin.</h2></div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div>
      </section>
      <footer className={styles.welcomeBottom}><Link href="/register" className={styles.welcomeStart}>Start your journey <ArrowRight size={19} /></Link><p>Already on HealthMatrix? <Link href="/login">Sign in</Link></p><span><LockKeyhole size={11} /> Patient consent. Always.</span></footer>
    </div>
    <header className={styles.header}>
      <Link href="/welcome" aria-label="HealthMatrix home"><Brand /></Link>
      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Main navigation">
        <a href="#workspace" onClick={() => setMenuOpen(false)}>Your workspace</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#questions" onClick={() => setMenuOpen(false)}>FAQs</a>
        <Link href="/login" className={styles.mobileLogin}>Doctor sign in <ArrowUpRight size={16} /></Link>
      </nav>
      <Link href="/login" className={styles.signIn}>Doctor sign in <ArrowUpRight size={16} /></Link>
      <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <X /> : <Menu />}</button>
    </header>
    <main className={styles.desktopContent}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><span /> CONNECTED CARE. HUMAN AT HEART.</span>
          <h1>More time for<br />the person.<br /><span>More clarity<br className={styles.smallBreak} /> for you.</span></h1>
          <p>All the context you need. One thoughtful workspace.<br className={styles.desktopBreak} /> Bring your patients’ stories together, and focus on what you do best — care.</p>
          <div className={styles.actions}><Link className={styles.primary} href="/register">Join as a doctor <ArrowRight size={19} /></Link><a className={styles.secondary} href="#workspace">Explore your workspace <ArrowDown size={17} /></a></div>
          <div className={styles.heroNote}><ShieldCheck size={17} /> Patient consent at every step <span>·</span> Built for doctors</div>
        </div>
        <div className={styles.heroArt}>
          <div className={styles.orbit} /><span className={styles.orbPeach} /><span className={styles.orbBlue} />
          <div className={styles.artLabel}><span /><span>GOOD CARE STARTS WITH CONNECTION</span></div>
          <div className={styles.doctorBackdrop} />
          <Image className={styles.doctors} src="/landing/doctors.png" alt="Two doctors in white coats, ready to care" width={650} height={650} priority />
          <div className={styles.floatingSummary}><span className={styles.iconBubble}><Sparkles size={20} /></span><div><strong>A little clarity, from Ekaay</strong><small>The patient story, brought together.</small></div><span className={styles.check}><Check size={14} /></span></div>
          <div className={styles.floatingConsent}><span className={styles.consentIcon}><LockKeyhole size={18} /></span><div><strong>Shared with consent</strong><small>The patient stays in control.</small></div></div>
          <span className={styles.artFootnote}>A connected health journey. A human touch.</span>
        </div>
      </section>
      <div className={styles.promiseStrip}><span>Thoughtfully connected.<br /><strong>From the first hello to the follow-up.</strong></span><span><FileText /> Patient timelines</span><span><Sparkles /> Ekaay insights</span><span><Video /> Video consultations</span><span><Stethoscope /> Digital prescriptions</span></div>
      <section id="workspace" className={styles.workspace} data-reveal>
        <div className={styles.sectionHeading}><span className={styles.eyebrow}>LESS FRICTION. MORE FOCUS.</span><h2>Your day, a little lighter.</h2><p>The details come together. You stay close to your patients.</p></div>
        <div className={styles.workspaceGrid}>
          <div className={styles.featureCopy}>
            <div className={styles.tabs} role="tablist" aria-label="Explore workspace features">{previews.map(({ label, icon: Icon }, index) => <button key={label} id={`feature-tab-${index}`} role="tab" aria-selected={active === index} aria-controls="feature-panel" tabIndex={active === index ? 0 : -1} className={active === index ? styles.activeTab : ""} onClick={() => setActive(index)} onKeyDown={(event) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? previews.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + previews.length) % previews.length; setActive(next); document.getElementById(`feature-tab-${next}`)?.focus(); } }}><Icon size={17} />{label}</button>)}</div>
            <div id="feature-panel" role="tabpanel" aria-labelledby={`feature-tab-${active}`} tabIndex={0} className={styles.featurePanel}><Image src={`/landing/${preview.image}.png`} width={100} height={100} alt="" /><h3>{preview.title}</h3><p>{preview.description}</p><Link href="/register">Make room for better care <ArrowRight size={17} /></Link></div>
          </div>
          <div className={styles.demo} aria-label="Illustrative workspace preview"><div className={styles.demoBar}><Brand /><span>WORKSPACE PREVIEW</span></div><div className={styles.demoInner} key={active}><div className={styles.demoGreeting}><span className={styles.patientAvatar}>P</span><div><strong>A patient. A whole story.</strong><small>Illustrative patient · no real health data</small></div><HeartPulse size={23} /></div><div className={styles.demoSummary}><Sparkles size={19} /><span>Connected information.<br /><strong>More informed conversations.</strong></span></div><h4>{preview.heading}</h4>{preview.rows.map((row, index) => <div className={styles.demoRow} key={row}><span className={styles.rowIcon}>{index === 0 ? <FileText size={18} /> : index === 1 ? <HeartPulse size={18} /> : <Stethoscope size={18} />}</span><span>{row}<small>{["Together in one place", "Ready for your review", "Part of the patient story"][index]}</small></span><Check size={15} /></div>)}<div className={styles.demoTag}><ShieldCheck size={14} />{preview.tag}</div></div></div>
        </div>
      </section>
      <section className={styles.stepsSection} id="how-it-works" data-reveal><div className={styles.sectionHeading}><span className={styles.eyebrow}>A SIMPLE START</span><h2>From hello to better care.</h2><p>A familiar flow. A more connected way to practise.</p></div><div className={styles.steps}>{[{ title: "Make yourself at home", text: "Verify your mobile number and complete your doctor profile.", icon: Stethoscope }, { title: "See the whole picture", text: "Open patient-shared records with their OTP and review the context.", icon: FileText }, { title: "Let care flow", text: "Consult, review and prescribe — from one connected workspace.", icon: HeartPulse }].map(({ title, text, icon: Icon }, index) => <article key={title}><div className={styles.stepTop}><span className={styles.iconBubble}><Icon size={25} /></span><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className={styles.consentSection} data-reveal><div className={styles.largeShield}><ShieldCheck size={65} /><span><Check size={18} /></span></div><div><span className={styles.eyebrow}>TRUST IS PART OF THE TREATMENT</span><h2>Their health story.<br />Shared on their terms.</h2><p>Patient records open with the patient’s OTP, with time-limited access. A simple, intentional step that keeps consent at the heart of your care.</p></div><div className={styles.consentPoints}><span><Check /> Patient-authorized access</span><span><Check /> Time-limited record sharing</span><span><Check /> Clinical decisions stay with you</span></div></section>
      <section className={styles.faq} id="questions" data-reveal><div><span className={styles.eyebrow}>A LITTLE MORE CLARITY</span><h2>Good questions.<br />Clear answers.</h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></section>
      <section className={styles.finalCta} data-reveal><span className={styles.eyebrow}>YOUR NEXT CHAPTER IN CARE</span><h2>A connected workspace.<br />A more human day.</h2><p>Bring your expertise. We’ll help bring the picture together.</p><Link className={styles.primary} href="/register">Join HealthMatrix <ArrowRight size={18} /></Link><span className={styles.ctaLogin}>Already part of the network? <Link href="/login">Sign in</Link></span></section>
    </main>
    <footer className={styles.footer}><Link href="/welcome" aria-label="HealthMatrix home"><Brand /></Link><p>Connected care. Human at heart.</p><span>For registered medical practitioners.</span><a href="#main">Back to top ↑</a></footer>
  </div>;
}
