'use client';
import {useEffect,useState} from 'react';
import {Check,Hash,X} from 'lucide-react';
import type {Project} from '../lib/projects';
import {missingOrderIds,validateOrderId} from '../lib/order-ids';
import {Presence} from './motion';

export default function OrderIdMigration({projects,show,onSave,onLater}:{projects:Project[];show:boolean;onSave:(project:Project,orderId:string)=>Promise<void>;onLater:()=>void}) {
  const missing=missingOrderIds(projects);
  const [values,setValues]=useState<Record<number,string>>({}),[errors,setErrors]=useState<Record<number,string>>({}),[saving,setSaving]=useState<number|null>(null);
  useEffect(()=>{
    if(!show)return;
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const timer=setTimeout(()=>document.querySelector<HTMLInputElement>('.order-migration input')?.focus(),60);
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&saving===null)onLater();
      if(event.key==='Tab'){
        const nodes=Array.from(document.querySelectorAll<HTMLElement>('.order-migration button:not(:disabled),.order-migration input:not(:disabled)'));
        const first=nodes[0],last=nodes.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{clearTimeout(timer);document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus()};
  },[show,saving,onLater]);
  async function save(event:React.FormEvent,project:Project){
    event.preventDefault();setErrors(previous=>({...previous,[project.id]:''}));
    try{
      const orderId=validateOrderId(values[project.id]||'',projects,project.id);
      setSaving(project.id);await onSave(project,orderId);
      setValues(previous=>{const next={...previous};delete next[project.id];return next});
    }catch(error){setErrors(previous=>({...previous,[project.id]:error instanceof Error?error.message:'Unable to save the Order ID.'}))}
    finally{setSaving(null)}
  }
  return <Presence show={show} className="modal-overlay order-migration-overlay"><section className="modal order-migration" role="dialog" aria-modal="true" aria-labelledby="order-migration-title">
    <button className="close-modal icon-button" aria-label="Add Order IDs later" disabled={saving!==null} onClick={onLater}><X size={20}/></button>
    <span className="order-migration-icon"><Hash size={22}/></span><h2 id="order-migration-title">Add your Order IDs</h2>
    <p>These existing projects need an Order ID. Saved projects leave this list automatically.</p>
    <div className="order-migration-list">{missing.map(project=><form key={project.id} onSubmit={event=>save(event,project)} className="order-migration-row">
      <div><strong>{project.client}</strong><span>{project.profile} <i/> {project.status==='completed'?'Completed':'In progress'}</span></div>
      <label htmlFor={'order-id-'+project.id}>Order ID</label><div className="order-migration-input"><input id={'order-id-'+project.id} aria-label={`Order ID for ${project.client}`} value={values[project.id]||''} onChange={event=>setValues(previous=>({...previous,[project.id]:event.target.value}))} required maxLength={81} placeholder="e.g. FO123456789" autoComplete="off" disabled={saving!==null}/><button className="primary" type="submit" disabled={saving!==null}><Check size={16}/>{saving===project.id?'Saving...':'Save'}</button></div>
      {errors[project.id]&&<p className="form-error" role="alert">{errors[project.id]}</p>}
    </form>)}</div><small>This reminder disappears once every project has an Order ID.</small>
  </section></Presence>
}
