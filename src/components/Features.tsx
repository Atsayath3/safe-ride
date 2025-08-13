import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      title: "For Parents",
      description: "Create profiles for your children, set school details, and book long-term transportation with trusted drivers.",
      icon: "👨‍👩‍👧‍👦",
      benefits: ["Weekly/Monthly bookings", "Multiple children profiles", "Route matching"]
    },
    {
      title: "For Drivers", 
      description: "Register your vehicle, upload documents, get verified by admin, and start hosting rides on your preferred routes.",
      icon: "🚐",
      benefits: ["Document verification", "Route selection", "Admin approval"]
    },
    {
      title: "Safe & Verified",
      description: "All drivers undergo document verification and admin approval before they can accept rides.",
      icon: "🛡️",
      benefits: ["ID verification", "Vehicle documents", "Insurance validation"]
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Safe Ride Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A simple, secure platform connecting parents with verified drivers for reliable school transportation.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="gradient-card border-border hover:border-primary/50 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 text-center">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;