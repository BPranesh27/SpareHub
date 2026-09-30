import React from 'react';
import { Link } from 'react-router-dom';
import { Repeat, ShieldCheck, Mail, Globe, MessageSquare } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800/80 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow">
                <Repeat className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Share<span className="text-brand-500">Spare</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rent what you need. Earn from what you own. ShareSpare connects item owners with trusted neighbors for safe peer-to-peer rentals.
            </p>
            <div className="flex space-x-4 text-slate-400">
              <a href="#" className="hover:text-brand-400 transition-colors"><Globe className="w-4 h-4" /></a>
              <a href="#" className="hover:text-brand-400 transition-colors"><MessageSquare className="w-4 h-4" /></a>
              <a href="#" className="hover:text-brand-400 transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/items" className="hover:text-brand-400 transition-colors">Browse Marketplace</Link></li>
              <li><Link to="/items/add" className="hover:text-brand-400 transition-colors">List Your Item</Link></li>
              <li><Link to="/how-it-works" className="hover:text-brand-400 transition-colors">How It Works</Link></li>
              <li><Link to="/analytics" className="hover:text-brand-400 transition-colors">Lender Earnings</Link></li>
            </ul>
          </div>

          {/* Security & Guarantees */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Trust & Security</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Security Deposit Protection</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>QR Handover Verification</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Verified User Ratings</span>
              </li>
            </ul>
          </div>

          {/* Contact / Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
            <p className="text-xs text-slate-400 mb-3">
              Need assistance with a rental or booking dispute?
            </p>
            <a
              href="mailto:support@sharespare.com"
              className="inline-block text-xs font-semibold text-brand-400 hover:text-brand-300 underline"
            >
              support@sharespare.com
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShareSpare Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
