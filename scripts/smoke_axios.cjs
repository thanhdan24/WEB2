const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const root = require('node:path').resolve(__dirname, '..');
const localRequire = createRequire(root + '/frontend/package.json');
const axios = localRequire('axios');
const source = fs.readFileSync(root + '/frontend/app.js','utf8').split('const $ =')[0];
const context = {axios}; vm.createContext(context);
vm.runInContext(source + '\nthis.productApi = productApi;',context);
(async()=>{
 const api=context.productApi;
 let id;
 try {
  const created=await api.create({name:'Axios integration',description:null,price:99.5,quantity:4});
  assert.equal(created.status,201);id=created.data.id;
  assert.equal((await api.getAll()).status,200);
  assert.equal((await api.getById(id)).data.name,'Axios integration');
  assert.equal((await api.update(id,{name:'Axios updated',description:'test',price:150,quantity:6})).status,204);
  assert.equal((await api.getById(id)).data.quantity,6);
  assert.equal((await api.remove(id)).status,204);id=null;
  console.log('PASS real Axios wrappers from frontend/app.js: POST GET list GET detail PUT DELETE');
 } finally {if(id) await api.remove(id);}
})().catch(e=>{console.error(e.message);process.exit(1)});
