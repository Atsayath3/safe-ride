import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="safe-ride-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Safe School 
              <span className="text-primary"> Transportation</span>
              <br />
              Made Simple
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Connect with trusted drivers for reliable, long-term school transportation. 
              Book weekly or monthly rides for your children with verified drivers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" className="w-full sm:w-auto">
                Get Started as Parent
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                Join as Driver
              </Button>
            </div>
          </div>
          
          <div className="safe-ride-slide-up">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Safe school transportation" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;