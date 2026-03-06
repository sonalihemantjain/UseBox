import useBoxLogo from "@/assets/usebox-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={useBoxLogo} alt="UseBox" className="h-5 w-5" />
          <span className="font-display text-sm font-semibold">UseBox</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 UseBox. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
