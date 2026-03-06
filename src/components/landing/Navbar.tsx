import { motion } from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-glass"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <Brain className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Knowl<span className="text-gradient-gold">Edge</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#learn" className="hover:text-foreground transition-colors">Learn</a>
          <a href="#share" className="hover:text-foreground transition-colors">Share</a>
          <a href="#earn" className="hover:text-foreground transition-colors">Earn</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it Works</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button size="sm" className="glow-gold" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-card border-t border-border px-6 pb-6 space-y-4"
        >
          <a href="#learn" className="block py-2 text-muted-foreground">Learn</a>
          <a href="#share" className="block py-2 text-muted-foreground">Share</a>
          <a href="#earn" className="block py-2 text-muted-foreground">Earn</a>
          <Button className="w-full glow-gold" onClick={() => { setOpen(false); navigate("/auth"); }}>Get Started</Button>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
