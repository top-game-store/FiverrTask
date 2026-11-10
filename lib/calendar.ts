export function calendarMonth(year:number,month:number){
 const offset=(new Date(year,month,1).getDay()+6)%7;
 return Array.from({length:42},(_,i)=>new Date(year,month,i-offset+1,12));
}
