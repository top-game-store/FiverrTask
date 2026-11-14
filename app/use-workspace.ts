'use client';
import {useEffect,useState} from 'react';
import type {User} from 'firebase/auth';
import {Project,projectFinance} from '../lib/projects';
export type Member={id:string;name:string;image:string};
export function useWorkspace(identity:User|null){
 const [projects,setProjects]=useState<Project[]>([]),[members,setMembers]=useState<Member[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{setProjects([]);setMembers([]);setLoaded(false);setError('');if(!identity||!identity.emailVerified)return;let cancelled=false;const stops:(()=>void)[]=[];
 (async()=>{try{const [{services},sdk]=await Promise.all([import('../lib/firebase'),import('firebase/firestore')]);if(cancelled)return;await identity.getIdToken(true);if(cancelled)return;const db=services().db,ref=sdk.doc(db,'users',identity.uid),user=await sdk.getDoc(ref);if(cancelled)return;if(!user.exists())await sdk.setDoc(ref,{name:identity.displayName||identity.email?.split('@')[0]||'Member',image:identity.photoURL||'',joinedAt:sdk.serverTimestamp()});if(cancelled)return;
 stops.push(sdk.onSnapshot(sdk.query(sdk.collection(db,'projects'),sdk.where('ownerId','==',identity.uid)),snapshot=>{setProjects(snapshot.docs.map(d=>({...d.data(),id:Number(d.id)}) as Project).filter(p=>Number.isFinite(p.id)&&typeof p.client==='string'&&typeof p.profile==='string'&&Number.isFinite(p.price)));setLoaded(true);setError('')},()=>{setError('Unable to load projects. Check your connection and retry.');setLoaded(false)}));
 stops.push(sdk.onSnapshot(ref,snapshot=>setMembers(snapshot.exists()?[{id:snapshot.id,name:snapshot.data().name||'Member',image:snapshot.data().image||''}]:[]),()=>setError('Unable to load your profile.')))
 }catch{if(!cancelled)setError('Unable to connect. Please refresh to retry.')}})();return()=>{cancelled=true;stops.forEach(stop=>stop())}},[identity,identity?.emailVerified,attempt]);
 async function saveProject(p:Project){if(!identity||!loaded)throw Error('Sign in before saving.');const [{services},{persistProject}]=await Promise.all([import('../lib/firebase'),import('../lib/project-storage')]);await persistProject(services().db,identity.uid,p)}
 async function saveOrderId(p:Project,orderId:string){if(!identity||!loaded)throw Error('Sign in before saving.');const [{services},{persistProject}]=await Promise.all([import('../lib/firebase'),import('../lib/project-storage')]);await persistProject(services().db,identity.uid,{...p,orderId},true)}
 async function removeProject(p:Project){if(!identity||p.ownerId!==identity.uid)throw Error('Only the owner can remove this project.');const [{services},{deleteProject}]=await Promise.all([import('../lib/firebase'),import('../lib/project-storage')]);await deleteProject(services().db,identity.uid,p)}
 async function saveProfile(name:string,image:string){if(!identity)throw Error('Sign in first.');const [{services},sdk]=await Promise.all([import('../lib/firebase'),import('firebase/firestore')]);await sdk.setDoc(sdk.doc(services().db,'users',identity.uid),{name,image},{merge:true})}
 return {projects:projects.filter(p=>p.ownerId===identity?.uid),members:members.filter(m=>m.id===identity?.uid),loaded,error,saveProject,saveOrderId,removeProject,saveProfile,clearError:()=>setError(''),retry:()=>setAttempt(n=>n+1)};
}
