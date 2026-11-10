'use client';
import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import BootLoader from './brand-loader';
import type {User} from 'firebase/auth';
type Session={identity:User|null;verified:boolean;loading:boolean;error:string;refresh:()=>Promise<boolean>};
const Context=createContext<Session>({identity:null,verified:false,loading:true,error:'',refresh:async()=>false});
export function AuthProvider({children}:{children:React.ReactNode}){const [session,setSession]=useState({identity:null as User|null,verified:false,loading:true,error:''});
 const refresh=useCallback(async()=>{const [{services},{reload,getIdToken}]=await Promise.all([import('../lib/firebase'),import('firebase/auth')]);const user=services().auth.currentUser;if(!user)return false;await reload(user);await getIdToken(user,true);setSession({identity:user,verified:user.emailVerified,loading:false,error:''});return user.emailVerified},[]);
 useEffect(()=>{let unsubscribe:(()=>void)|undefined,cancelled=false;(async()=>{try{const [{services},{onIdTokenChanged}]=await Promise.all([import('../lib/firebase'),import('firebase/auth')]);if(cancelled)return;unsubscribe=onIdTokenChanged(services().auth,identity=>setSession({identity,verified:identity?.emailVerified||false,loading:false,error:''}),()=>setSession({identity:null,verified:false,loading:false,error:'Unable to check your session. Refresh to try again.'}))}catch(e){if(!cancelled)setSession({identity:null,verified:false,loading:false,error:e instanceof Error?e.message:'Sign-in is unavailable.'})}})();return()=>{cancelled=true;unsubscribe?.()}},[]);return <Context.Provider value={{...session,refresh}}><BootLoader show={session.loading}/>{children}</Context.Provider>}
export const useSession=()=>useContext(Context);
