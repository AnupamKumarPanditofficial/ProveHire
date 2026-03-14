import { Layers, Twitter, Linkedin, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer enterprise-footer">
            <div className="container footer-container">
                <div className="footer-top">
                    <div className="footer-brand">
                        <div className="logo footer-logo">
                            <Layers className="logo-icon" />
                            <span className="logo-text">ProvaHire</span>
                        </div>
                        <p className="footer-description">
                            Empowering modern teams to hire smarter, faster, and fairer with AI intelligence. Your next great hire is just a click away.
                        </p>
                        <div className="footer-social-icons">
                            <a href="#twitter" aria-label="Twitter"><Twitter size={18} /></a>
                            <a href="#linkedin" aria-label="LinkedIn"><Linkedin size={18} /></a>
                            <a href="#facebook" aria-label="Facebook"><Facebook size={18} /></a>
                            <a href="#instagram" aria-label="Instagram"><Instagram size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-grid">
                        <div className="footer-column">
                            <h4 className="footer-heading">Product</h4>
                            <ul className="footer-links-list">
                                <li><a href="#features">Features</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                                <li><a href="#showcase">Showcase</a></li>
                                <li><a href="#releases">Releases</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Company</h4>
                            <ul className="footer-links-list">
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#careers">Careers</a></li>
                                <li><a href="#blog">Blog</a></li>
                                <li><a href="#contact">Contact</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-heading">Resources</h4>
                            <ul className="footer-links-list">
                                <li><a href="#documentation">Documentation</a></li>
                                <li><a href="#help">Help Center</a></li>
                                <li><a href="#community">Community</a></li>
                                <li><a href="#guides">Guides</a></li>
                            </ul>
                        </div>

                        <div className="footer-column contact-column">
                            <h4 className="footer-heading">Contact Us</h4>
                            <ul className="footer-contact-info">
                                <li><Mail size={16} /> support@provahire.com</li>
                                <li><Phone size={16} /> +1 (555) 123-4567</li>
                                <li><MapPin size={16} /> San Francisco, CA</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <div className="footer-legal">
                        <a href="#privacy">Privacy Policy</a>
                        <span className="separator">·</span>
                        <a href="#terms">Terms of Service</a>
                        <span className="separator">·</span>
                        <a href="#cookies">Cookie Policy</a>
                    </div>

                    <div className="footer-copyright">
                        <p>&copy; {new Date().getFullYear()} ProvaHire Inc. All rights reserved.</p>
                        <p className="founder-text">
                            Proudly built in <strong>ARA, Bihar</strong> by <strong>Anupam Kumar Pandit</strong>
                        </p>
                    </div>
                </div>
            </div>
            {/* Magic Light Effect Elements */}
            <div className="magic-light light-1"></div>
            <div className="magic-light light-2"></div>
            <div className="magic-light light-3"></div>
        </footer>
    );
};

export default Footer;
