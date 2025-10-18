import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full gradient-pastel flex items-center justify-center p-6">
      <main className="w-full max-w-md mx-auto text-center">
        {/* Logo */}
        <div
          className={`mb-8 flex justify-center transition-smooth ${
            isLoaded ? "animate-scale-in opacity-100" : "opacity-0"
          }`}
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl shadow-gentle p-6 flex items-center justify-center">
            <img
              src={logo}
              alt="LingoBuddy Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* App Title */}
        <h1
          className={`text-4xl md:text-5xl font-bold text-foreground mb-3 transition-smooth ${
            isLoaded ? "animate-fade-in-up opacity-100" : "opacity-0"
          }`}
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          LingoBuddy
        </h1>

        {/* Tagline */}
        <p
          className={`text-lg md:text-xl text-muted-foreground mb-12 font-medium transition-smooth ${
            isLoaded ? "animate-fade-in-up opacity-100" : "opacity-0"
          }`}
          style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
        >
          Learn English with Confidence
        </p>

        {/* Loading Indicator */}
        <div
          className={`flex gap-2 justify-center mb-16 transition-smooth ${
            isLoaded ? "animate-fade-in-up opacity-100" : "opacity-0"
          }`}
          style={{ animationDelay: "0.7s", animationFillMode: "backwards" }}
        >
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce-soft"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce-soft"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-3 h-3 bg-primary rounded-full animate-bounce-soft"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* Footer */}
        <footer
          className={`text-sm text-muted-foreground transition-smooth ${
            isLoaded ? "animate-fade-in-up opacity-100" : "opacity-0"
          }`}
          style={{ animationDelay: "0.9s", animationFillMode: "backwards" }}
        >
          Powered by AI to make learning lovable ❤️
        </footer>
      </main>
    </div>
  );
};

export default Index;
