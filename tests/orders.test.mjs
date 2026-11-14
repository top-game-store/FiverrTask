import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOrderId,validateOrderId,missingOrderIds} from '../lib/order-ids.ts';
test('Order IDs normalize case and optional hash without changing distinct IDs',()=>{assert.equal(normalizeOrderId(' #fo-123_ABC '),'FO-123_ABC');assert.notEqual(normalizeOrderId('FO1'),normalizeOrderId('FO2'));for(const value of ['', '#', 'FO 123','FO/123','a'.repeat(81)])assert.throws(()=>normalizeOrderId(value))});
test('duplicates include completed projects but exclude the record being migrated',()=>{const records=[{id:1,orderId:'FO123'},{id:2,orderId:'FO456'}];assert.throws(()=>validateOrderId('#fo123',records,2),/already belongs/);assert.equal(validateOrderId('#fo123',records,1),'FO123');assert.equal(validateOrderId('new123',records),'NEW123')});
test('migration only includes records with missing or blank IDs and disappears after completion',()=>{const records=[{id:1},{id:2,orderId:''},{id:3,orderId:'FO123'}];assert.deepEqual(missingOrderIds(records).map(p=>p.id),[1,2]);assert.equal(missingOrderIds(records.map(p=>({...p,orderId:p.orderId||'FO'+p.id}))).length,0);assert.equal(missingOrderIds([]).length,0)});
