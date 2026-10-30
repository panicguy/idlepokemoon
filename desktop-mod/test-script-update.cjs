'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {create}=require('./automacoes');
const folder=fs.mkdtempSync(path.join(__dirname,'update-test-')),file=path.join(folder,'automacoes.json');
let body='// ==UserScript==\n// @name Fixture\n// @version 1.0.0\n// @grant none\n// @idlemoon-card autocatch-v1\n// ==/UserScript==\nwindow.fixture=1;',bad=false,reloads=0;
const manager=create({file,origin:'https://idlepokemoon.com.br',views:()=>[{webContents:{isDestroyed:()=>false,getURL:()=> 'https://idlepokemoon.com.br/play',reload:()=>{reloads++}}}],fetchScript:async()=>{if(bad)throw Error('Network fixture failed');return body}});
(async()=>{try{
  let r=await manager.request({type:'install',url:'https://github.com/test/repo/blob/main/test.user.js'});assert(r.ok);const id=r.scripts[0].id;
  await manager.request({type:'accounts',id,accounts:[0]});await manager.request({type:'toggle',id,enabled:true});const baseline=reloads;
  body=body.replace('1.0.0','1.1.0').replace('fixture=1','fixture=2');
  r=await manager.request({type:'update',id});assert(r.ok);assert.equal(r.scripts[0].id,id);assert.equal(r.scripts[0].enabled,true);assert.deepEqual(r.scripts[0].accounts,[0]);assert.equal(r.scripts[0].cardSupport,'autocatch-v1');assert.equal(r.scripts[0].version,'1.1.0');assert.equal(reloads,baseline+1);
  const saved=fs.readFileSync(file,'utf8');r=await manager.request({type:'update',id});assert(r.ok);assert.equal(reloads,baseline+1);
  bad=true;r=await manager.request({type:'update',id});assert(!r.ok);assert.equal(fs.readFileSync(file,'utf8'),saved);
  bad=false;body='this is not JavaScript @';r=await manager.request({type:'update',id});assert(!r.ok);assert.equal(fs.readFileSync(file,'utf8'),saved);
  body='// ==UserScript==\n// @grant GM_xmlhttpRequest\n// ==/UserScript==';r=await manager.request({type:'update',id});assert(!r.ok);assert.equal(fs.readFileSync(file,'utf8'),saved);
  console.log('PASS: update preserves ID, enabled/accounts and Card; reloads only changed enabled scripts; no-op/network/syntax/grant failures keep installed code intact.');
}finally{fs.rmSync(folder,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
