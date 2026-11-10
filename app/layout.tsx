import SiteFooter from './site-footer';
import {AuthProvider} from './auth-provider';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import './refined.css';
import './tactile.css';
import './responsive.css';
import './clean.css';
import './features.css';
import './polish.css';
export const metadata: Metadata = { title: 'FiverrTask - Your freelance workspace', description: 'FiverrTask keeps client projects, deadlines and message rewriting in one clear workspace.', applicationName: 'FiverrTask', manifest:'/manifest.webmanifest', appleWebApp:{capable:true,statusBarStyle:'default',title:'FiverrTask'}, icons:{icon:'/icon-192.png',apple:'/apple-touch-icon.png'} };
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#181a1e'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body><AuthProvider>{children}<SiteFooter/></AuthProvider></body></html>}



