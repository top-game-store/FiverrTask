import type {Project} from './projects';

export function normalizeOrderId(value:string) {
  const id=value.trim().replace(/^#/, '').toUpperCase();
  if(!id)throw Error('Enter the Order ID.');
  if(!/^[A-Z0-9][A-Z0-9_-]{0,79}$/.test(id))throw Error('Use up to 80 letters, numbers, hyphens or underscores for the Order ID.');
  return id;
}

export function validateOrderId(value:string,projects:Pick<Project,'id'|'orderId'>[],projectId?:number) {
  const id=normalizeOrderId(value);
  if(projects.some(p=>p.id!==projectId&&p.orderId&&normalizeOrderId(p.orderId)===id))throw Error('This Order ID already belongs to another project.');
  return id;
}

export function missingOrderIds(projects:Project[]) {
  return projects.filter(p=>!p.orderId?.trim());
}
