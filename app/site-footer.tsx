import Link from 'next/link';
import PwaControls from './pwa-controls';
import {Sparkles,ArrowUpRight} from 'lucide-react';
export default function SiteFooter(){return <footer className="site-footer"><div><span className="footer-name"><Sparkles size={15}/>FiverTask</span><span>A clearer space for your freelance work.</span></div><div className="footer-links"><PwaControls/><Link href="/">Rewriter</Link><Link href="/?view=projects">Projects<ArrowUpRight size={12}/></Link><span>Made by <strong>Junayed Hossain</strong></span></div></footer>}
