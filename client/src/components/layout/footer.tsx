import { Link } from 'wouter';
import { 
  FaTwitter, 
  FaFacebook, 
  FaInstagram, 
  FaGithub 
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card mt-12 border-t border-border">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Twitter</span>
            <FaTwitter className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Facebook</span>
            <FaFacebook className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Instagram</span>
            <FaInstagram className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">GitHub</span>
            <FaGithub className="h-5 w-5" />
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-muted-foreground">
            &copy; {currentYear} GreenVoice. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
