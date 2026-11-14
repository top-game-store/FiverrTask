import {doc,runTransaction,type Firestore} from 'firebase/firestore';
import {projectFinance,type Project} from './projects';
import {normalizeOrderId} from './order-ids';

export async function persistProject(db:Firestore,uid:string,project:Project,orderOnly=false) {
  if(project.ownerId&&project.ownerId!==uid)throw Error('Only the owner can update this project.');
  const ref=doc(db,'projects',String(project.id));
  await runTransaction(db,async transaction=>{
    const current=await transaction.get(ref);
    if(current.exists()&&current.data().ownerId!==uid)throw Error('Only the owner can update this project.');
    if(orderOnly&&!current.exists())throw Error('This project no longer exists.');
    const existing=current.exists()?current.data() as Project:undefined;
    const orderId=normalizeOrderId(project.orderId||existing?.orderId||'');
    if(existing?.orderId&&normalizeOrderId(existing.orderId)!==orderId)throw Error('An assigned Order ID cannot be changed.');
    const claimRef=doc(db,'users',uid,'orderIds',orderId);
    const claim=await transaction.get(claimRef);
    if(claim.exists()&&claim.data().projectId!==String(project.id))throw Error('This Order ID already belongs to another project.');
    if(!claim.exists())transaction.set(claimRef,{projectId:String(project.id)});
    if(orderOnly){
      transaction.update(ref,{orderId,orderKey:orderId});
    }else{
      const finance=projectFinance(project);
      const data={...project,ownerId:uid,orderId,orderKey:orderId,totalAmount:finance.total,price:finance.share,combined:finance.members.length>0,collaborators:finance.members};
      transaction.set(ref,Object.fromEntries(Object.entries(data).filter(([,value])=>value!==undefined)));
    }
  });
}

export async function deleteProject(db:Firestore,uid:string,project:Project) {
  const ref=doc(db,'projects',String(project.id));
  await runTransaction(db,async transaction=>{
    const current=await transaction.get(ref);
    if(!current.exists())return;
    if(current.data().ownerId!==uid)throw Error('Only the owner can remove this project.');
    const key=current.data().orderKey as string|undefined;
    const claimRef=key?doc(db,'users',uid,'orderIds',key):undefined;
    const claim=claimRef?await transaction.get(claimRef):undefined;
    if(claimRef&&claim?.exists()&&claim.data().projectId===String(project.id))transaction.delete(claimRef);
    transaction.delete(ref);
  });
}
