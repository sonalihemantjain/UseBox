import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-learn/5 via-share/5 to-earn/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            Ready to{" "}
            <span className="text-gradient-gold">transform</span>{" "}
            how you learn?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of professionals who are learning smarter, sharing faster, and earning more with AI-powered coaching.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="glow-gold text-base px-10 h-13 gap-2" onClick={() => navigate("/auth")}>
              Get Started — It's Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free forever plan available</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
