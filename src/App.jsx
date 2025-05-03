import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Shield, Bell, FileText, PieChart, AlertCircle, ChevronDown, ArrowRight } from "lucide-react";

export default function ChainGuardLandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);

      // Update active section based on scroll position
      const sections = ["home", "about", "features", "demo", "cta"];
      const sectionPositions = sections.map(id => {
        const element = document.getElementById(id);
        return element ? { id, top: element.offsetTop - 100 } : null;
      }).filter(Boolean);

      const currentPosition = window.scrollY;

      const active = sectionPositions.reduce((acc, section) => {
        return currentPosition >= section.top ? section.id : acc;
      }, "home");

      setActiveSection(active);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // In a real implementation, you would redirect to a thank you page
    // navigate("/danke");
  };

  const navigateToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      title: "Risikobewertung",
      description: "Automatische Bewertung deiner Lieferanten mit KI-basiertem Risikoscoring"
    },
    {
      icon: <Bell className="h-6 w-6 text-blue-500" />,
      title: "Frühwarnsystem",
      description: "Proaktive Benachrichtigungen bei potentiellen Risiken in deiner Lieferkette"
    },
    {
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      title: "Dokumentation",
      description: "Automatisierte Dokumentationserstellung für Audits und Behörden"
    },
    {
      icon: <PieChart className="h-6 w-6 text-blue-500" />,
      title: "Reports",
      description: "Detaillierte Management-Reports auf Knopfdruck für deine Stakeholder"
    },
    {
      icon: <AlertCircle className="h-6 w-6 text-blue-500" />,
      title: "Whistleblower",
      description: "Integriertes System für anonyme Hinweise gemäß gesetzlicher Vorgaben"
    },
    {
      icon: <Check className="h-6 w-6 text-blue-500" />,
      title: "Compliance",
      description: "Vollständige Einhaltung aller LkSG-Anforderungen ohne juristisches Fachwissen"
    }
  ];

  const testimonials = [
    {
      quote: "ChainGuard hat uns den Einstieg in die LkSG-Compliance enorm erleichtert. Wir konnten unsere Prozesse in wenigen Wochen umstellen.",
      author: "Marie Schmidt",
      position: "Compliance Manager, TechGmbH"
    },
    {
      quote: "Das beste Tool für mittelständische Unternehmen! Die automatische Risikobewertung spart uns Hunderte Arbeitsstunden.",
      author: "Thomas Weber",
      position: "CEO, Weber Logistics"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isSticky ? "bg-white dark:bg-gray-900 shadow-md py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">ChainGuard</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center">
              <button
                onClick={() => navigateToSection("home")}
                className={`font-medium hover:text-blue-600 transition ${activeSection === "home" ? "text-blue-600" : ""}`}
              >
                Home
              </button>
              <button
                onClick={() => navigateToSection("about")}
                className={`font-medium hover:text-blue-600 transition ${activeSection === "about" ? "text-blue-600" : ""}`}
              >
                Über LkSG
              </button>
              <button
                onClick={() => navigateToSection("features")}
                className={`font-medium hover:text-blue-600 transition ${activeSection === "features" ? "text-blue-600" : ""}`}
              >
                Features
              </button>
              <button
                onClick={() => navigateToSection("demo")}
                className={`font-medium hover:text-blue-600 transition ${activeSection === "demo" ? "text-blue-600" : ""}`}
              >
                Produkt
              </button>
              <button
                onClick={() => navigateToSection("cta")}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition"
              >
                Beta-Zugang
              </button>
            </div>

            {/* Mobile Navigation Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 dark:text-gray-200 focus:outline-none"
              >
                {isMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg mt-2">
            <div className="px-4 py-2 space-y-3">
              <button
                onClick={() => navigateToSection("home")}
                className="block w-full text-left py-2 font-medium hover:text-blue-600"
              >
                Home
              </button>
              <button
                onClick={() => navigateToSection("about")}
                className="block w-full text-left py-2 font-medium hover:text-blue-600"
              >
                Über LkSG
              </button>
              <button
                onClick={() => navigateToSection("features")}
                className="block w-full text-left py-2 font-medium hover:text-blue-600"
              >
                Features
              </button>
              <button
                onClick={() => navigateToSection("demo")}
                className="block w-full text-left py-2 font-medium hover:text-blue-600"
              >
                Produkt
              </button>
              <button
                onClick={() => navigateToSection("cta")}
                className="block w-full text-center py-2 mt-4 bg-blue-600 text-white rounded-lg font-medium"
              >
                Beta-Zugang
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Sichere Lieferketten.<br />
                Einfache Compliance.
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300 mb-12">
              ChainGuard ist die digitale Plattform für LkSG-Compliance –
              <span className="font-semibold"> speziell für Mittelstand und wachsende Unternehmen.</span>
            </p>
            <button
              onClick={() => navigateToSection("cta")}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105 shadow-lg"
            >
              Beta-Zugang sichern
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition hover:translate-y-1 hover:shadow-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">3000+</div>
              <div className="font-medium">Unternehmen betroffen</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition hover:translate-y-1 hover:shadow-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">2026</div>
              <div className="font-medium">Jahr der vollen Umsetzung</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition hover:translate-y-1 hover:shadow-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">90%</div>
              <div className="font-medium">Zeit- und Ressourceneinsparung</div>
            </div>
          </div>
        </div>
      </section>

      {/* About LkSG Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Was ist das Lieferkettengesetz?</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg leading-relaxed mb-6 text-gray-700 dark:text-gray-300">
                Das <strong>Lieferkettensorgfaltspflichtengesetz (LkSG)</strong> verpflichtet Unternehmen,
                menschenrechtliche und umweltbezogene Risiken in ihren globalen Lieferketten zu identifizieren,
                zu minimieren und transparent zu dokumentieren.
              </p>
              <p className="text-lg leading-relaxed mb-6 text-gray-700 dark:text-gray-300">
                Ab 2026 gilt das Gesetz verpflichtend für <strong>alle Unternehmen ab 1.000 Mitarbeitenden</strong>.
                Bei Verstößen drohen empfindliche Bußgelder von bis zu 2% des jährlichen Konzernumsatzes.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Risikomanagement in der gesamten Lieferkette</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Umfangreiche Dokumentationspflichten</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Regelmäßige Berichterstattung</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span>Einrichtung eines Beschwerdeverfahrens</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-blue-600">Compliance-Terminplan</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center mr-4 flex-shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2023</h4>
                    <p className="text-gray-600 dark:text-gray-400">Unternehmen ab 3.000 Mitarbeitenden</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-4 flex-shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2024</h4>
                    <p className="text-gray-600 dark:text-gray-400">Unternehmen ab 1.000 Mitarbeitenden</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-400 text-white rounded-full h-10 w-10 flex items-center justify-center mr-4 flex-shrink-0">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2026</h4>
                    <p className="text-gray-600 dark:text-gray-400">EU-Richtlinie: Ausweitung auf weitere Unternehmen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Warum ChainGuard?</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700 dark:text-gray-300">
              ChainGuard bietet alles, was du für eine reibungslose LkSG-Compliance brauchst –
              ganz ohne Vorwissen, hochskalierbar und mit minimalem Aufwand.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="bg-blue-50 dark:bg-gray-700 rounded-full p-3 inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Das sagen unsere Kunden</h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
                >
                  <div className="text-yellow-400 flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">So sieht ChainGuard aus</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700 dark:text-gray-300">
              Eine intuitive Oberfläche mit allen Tools, die du für die LkSG-Compliance benötigst.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl blur-lg opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
              <img
                src="/chainguard-mockup.png"
                alt="ChainGuard Dashboard"
                className="w-full h-auto"
              />
              {/* Image overlay for dark mode */}
              <div className="absolute inset-0 bg-black opacity-5 dark:opacity-30 pointer-events-none"></div>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">1</span>
                </div>
                <h3 className="font-bold mb-2">Übersichtliches Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400">Alle wichtigen Kennzahlen auf einen Blick</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">2</span>
                </div>
                <h3 className="font-bold mb-2">Lieferantenverwaltung</h3>
                <p className="text-gray-600 dark:text-gray-400">Einfache Kategorisierung und Bewertung</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">3</span>
                </div>
                <h3 className="font-bold mb-2">Risikomanagement</h3>
                <p className="text-gray-600 dark:text-gray-400">Automatische Alerts bei potentiellen Problemen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit für deine LkSG-Compliance?</h2>
          <p className="text-xl mb-12">
            Sichere dir jetzt deinen exklusiven Beta-Zugang und sei einer der Ersten,
            die ChainGuard nutzen können.
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  required
                  placeholder="Deine E-Mail-Adresse"
                  className="px-5 py-4 rounded-xl text-gray-900 w-full text-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold text-lg transition transform hover:scale-105 flex-shrink-0"
                >
                  Beta-Zugang sichern
                </button>
              </div>
              <p className="mt-4 text-sm text-blue-100">
                Kein Spam. Du kannst dich jederzeit wieder abmelden.
              </p>
            </form>
          ) : (
            <div className="bg-white text-blue-600 rounded-xl p-8 max-w-lg mx-auto shadow-lg">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-4">Danke für deine Anmeldung!</h3>
              <p>
                Wir melden uns in Kürze bei dir, sobald dein Beta-Zugang bereit ist.
                Schau derweil auch in deinem Posteingang nach.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Häufig gestellte Fragen</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-2">Für wen ist ChainGuard geeignet?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                ChainGuard ist ideal für mittelständische Unternehmen und wachsende Firmen,
                die vom Lieferkettengesetz betroffen sind oder sein werden. Besonders geeignet
                für Unternehmen ohne spezialisierte Compliance-Abteilung.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-2">Wie lange dauert die Implementierung?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Die Ersteinrichtung dauert nur wenige Stunden. Die vollständige Integration
                deiner Lieferanten ist abhängig von deren Anzahl, typischerweise aber innerhalb
                von 1-2 Wochen abgeschlossen.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-2">Wie hoch sind die Kosten?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                ChainGuard bietet flexible Preismodelle, die sich nach der Größe deines Unternehmens
                und der Anzahl deiner Lieferanten richten. Als Beta-Tester erhältst du besonders
                attraktive Konditionen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-4">ChainGuard</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Die Plattform für einfache und effiziente LkSG-Compliance.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Über uns</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Funktionen</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Preise</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Kontakt</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">info@chainguard.de</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">+49 123 456789</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">Mustergasse 123<br />10115 Berlin</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 ChainGuard. Alle Rechte vorbehalten. Made with ❤️ in Germany.
              </p>
              <div className="flex space-x-6">
                <a href="/impressum" className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600">Impressum</a>
                <a href="/datenschutz" className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600">Datenschutz</a>
                <a href="/agb" className="text-gray-600 dark:text-gray-400 text-sm hover:text-blue-600">AGB</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}