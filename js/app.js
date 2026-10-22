/* Conjugueur picard — moteur de règles modulaire, sans dépendance.
 * Source principale : René Debrie, Èche pikar bèl é rade, pages de conjugaison du scan fourni.
 * Important : le livre distingue des groupes et des verbes à alternances ; les formes générées
 * hors des paradigmes explicitement transcrits sont des hypothèses techniques à faire vérifier.
 */
'use strict';
const PERSONNES = [
  'èje — 1re personne du singulier', 'tu — 2e personne du singulier',
  'i — 3e personne du singulier', 'o z — 1re personne du pluriel',
  'o z — 2e personne du pluriel', 'i — 3e personne du pluriel'
];
let VERBES = [], REGLES = {};
const $ = s => document.querySelector(s);
const normaliser = s => String(s || '').toLocaleLowerCase('fr-FR').trim()
  .replace(/[’`]/g,"'").replace(/\s+/g,' ');
const sansAccents = s => normaliser(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const el = (tag, cls, txt) => { const n=document.createElement(tag); if(cls)n.className=cls; if(txt!==undefined)n.textContent=txt; return n; };

async function chargerDonnees(){
  const erreurs=[];
  try { const r=await fetch('./data/verbs.json'); if(!r.ok)throw Error('verbs.json : HTTP '+r.status); const d=await r.json(); VERBES=Array.isArray(d.verbs)?d.verbs:[]; }
  catch(e){ erreurs.push(e.message); }
  try { const r=await fetch('./data/rules.json'); if(!r.ok)throw Error('rules.json : HTTP '+r.status); REGLES=await r.json(); }
  catch(e){ erreurs.push(e.message); }
  if(erreurs.length) $('#status').textContent='Erreur de chargement : '+erreurs.join(' · ')+'. Vérifie que les dossiers data/ et leurs fichiers sont bien publiés.';
}
function trouverVerbe(q){
  const n=normaliser(q), na=sansAccents(q);
  return VERBES.find(v=>[v.infinitive,...(v.variants||[])].some(x=>normaliser(x)===n || sansAccents(x)===na));
}
function trouverModele(infinitif){ return VERBES.find(v=>v.model && normaliser(v.infinitive)===normaliser(infinitif)); }
function remplacerToutes(texte, ancien, nouveau){ return texte.split(ancien).join(nouveau); }
function copierParadigme(modele, ancienRadical, nouveauRadical){
  const out={};
  for(const [mode,temps] of Object.entries(modele.conjugations||{})){
    out[mode]={};
    for(const [tempsNom,formes] of Object.entries(temps)){
      if(Array.isArray(formes)) out[mode][tempsNom]=formes.map(f=>Array.isArray(f)?f.map(x=>remplacerToutes(String(x),ancienRadical,nouveauRadical)):remplacerToutes(String(f),ancienRadical,nouveauRadical));
      else out[mode][tempsNom]=formes;
    }
  }
  return out;
}
function choisirGroupe(q){
  const n=normaliser(q), a=sansAccents(q);
  const suffixes4=['wète','ète','wèr','re','ve','de','ne'];
  if(a.endsWith('é')) return {id:'g1',nom:'1er groupe — infinitif en -é',suffixe:'é'};
  if(a.endsWith('ir')) return {id:'g2',nom:'2e groupe supposé — infinitif en -ir',suffixe:'ir',ambigu:true};
  const suffixe=suffixes4.find(s=>a.endsWith(s));
  if(suffixe) return {id:'g4',nom:'4e groupe — terminaison en -'+suffixe,suffixe};
  return null;
}
function detecterParticularites(q){
  const a=sansAccents(q), trouv=[];
  if(/(fle|kle|ple)$/.test(a)) trouv.push({id:'perte-l',titre:'Famille -flé / -klé / -plé',detail:'Le livre signale une perte du « l » dans certaines personnes des présents de l’indicatif et du subjonctif. Les personnes exactes et les formes doivent être confirmées sur le tableau.'});
  if(/(tche|dje)$/.test(a)) trouv.push({id:'alternance-affriquee',titre:'Famille -tché / -djé',detail:'Le livre signale une alternance de consonne (tch/k/dj/g) dans les présents de l’indicatif, du subjonctif et à l’impératif. La règle exacte dépend du verbe.'});
  if(a.endsWith('ete')) trouv.push({id:'aux-ete',titre:'Famille en -ète',detail:'Le livre indique que les verbes de type « nète » utilisent l’auxiliaire ÈTE. Cette règle concerne notamment les temps composés, pas uniquement le radical.'});
  return trouv;
}
function genererDepuisModele(q, groupe){
  if(!groupe)return null;
  let modele, ancien, nouveau, avertissement, type='regular';
  if(groupe.id==='g1'){
    modele=trouverModele('kaché'); ancien='kach'; nouveau=q.slice(0,-1);
    avertissement='Génération par le modèle KACHÉ : le livre donne ce paradigme, mais la régularité de ce verbe précis n’a pas été vérifiée dans le dictionnaire. Les formes calculées peuvent manquer d’alternances locales.';
  } else if(groupe.id==='g2'){
    modele=trouverModele('frétchir'); ancien='frétch'; nouveau=q.slice(0,-2);
    avertissement='Génération provisoire par FRÉTCHIR. Attention : le livre distingue aussi un 3e groupe en -ir ; l’infinitif seul ne permet donc pas de prouver l’appartenance au 2e groupe. Choisis le groupe correct après vérification.';
  } else {
    modele=trouverModele('brère');
    const suffixe=groupe.suffixe;
    // On garde le radical du verbe demandé et on remplace le radical BR du modèle.
    // Pour -re/-ère, on retire seulement la terminaison de l’infinitif pour éviter de la doubler.
    if(suffixe==='re') { ancien='br'; nouveau=q.slice(0,-2); }
    else if(suffixe==='wèr') { ancien='br'; nouveau=q.slice(0,-3); }
    else if(suffixe==='ve'||suffixe==='de'||suffixe==='ne') { ancien='br'; nouveau=q.slice(0,-2); }
    else if(suffixe==='wète') { ancien='br'; nouveau=q.slice(0,-4); }
    else { ancien='br'; nouveau=q.slice(0,-3); }
    avertissement='Génération approximative par le modèle BRÈRE. Le livre regroupe ici plusieurs terminaisons (-wèr, -re, -ve, -de, -ne, -wète, -ète), mais elles ne garantissent pas à elles seules un paradigme identique. Vérifie les formes avec la source ou un locuteur.';
  }
  if(!modele || !ancien || !nouveau)return null;
  return {infinitive:q,group:groupe.nom,type,generated:true,conjugations:copierParadigme(modele,ancien,nouveau),notes:avertissement,source:modele.source,particularites:detecterParticularites(q)};
}
function conjuguer(){
  const q=$('#verbInput').value.trim(), result=$('#result'); result.innerHTML=''; result.classList.remove('hidden'); $('#welcome').classList.add('hidden');
  if(!q){result.append(el('p','empty','Saisis un infinitif picard.'));return;}
  // 1. Les verbes enregistrés explicitement passent toujours avant les règles générales.
  let verbe=trouverVerbe(q);
  if(verbe){ afficherVerbe(verbe); return; }
  // 2. Les particularités de famille sont détectées et annoncées ; sans tableau complet,
  // on ne prétend pas reconstruire de façon certaine leurs alternances.
  const particularites=detecterParticularites(q);
  const groupe=choisirGroupe(q);
  verbe=genererDepuisModele(q,groupe);
  if(verbe){ verbe.particularites=particularites; afficherVerbe(verbe); return; }
  afficherInconnu(q,particularites);
}
function afficherInconnu(q, particularites){
  const result=$('#result'); result.append(el('h2','','Aucun modèle automatique applicable'));
  result.append(el('p','',`Le verbe « ${q} » ne correspond pas aux critères actuellement codés.`));
  if(particularites.length){ const ul=el('ul',''); particularites.forEach(p=>ul.append(el('li','',p.titre+' : '+p.detail))); result.append(ul); }
  result.append(el('p','source','Ajoute le verbe dans data/verbs.json s’il est irrégulier, ou complète data/rules.json et le moteur js/app.js si le livre donne une règle générale. Il vaut mieux signaler une incertitude que fabriquer une conjugaison présentée comme certaine.'));
}
function afficherVerbe(v){
  const result=$('#result'); result.innerHTML='';
  const head=el('div','verb-head'); head.append(el('h2','',v.infinitive||'Verbe')); if(v.group)head.append(el('span','tag',v.group)); result.append(head);
  if(v.generated)result.append(el('p','generated-warning',v.notes||'Formes générées à partir d’un modèle : à vérifier.'));
  else if(v.notes)result.append(el('p','source','Remarques : '+v.notes));
  if(v.particularites && v.particularites.length){
    const box=el('section','rule-alert'); box.append(el('h3','','Règles particulières détectées'));
    v.particularites.forEach(p=>{const item=el('div','rule-item');item.append(el('strong','',p.titre),el('p','',p.detail));box.append(item);}); result.append(box);
  }
  const conj=v.conjugations||{};
  for(const [mode,temps] of Object.entries(conj)){
    const block=el('section','time-block'); block.append(el('h3','',mode));
    for(const [tempsNom,formes] of Object.entries(temps)){
      const tb=el('div','tense-block'); tb.append(el('h4','',tempsNom)); const grid=el('div','forms');
      (Array.isArray(formes)?formes:[formes]).forEach((forme,i)=>{const row=el('div','form-row');row.append(el('span','person',PERSONNES[i]||`Forme ${i+1}`));row.append(el('span','form',Array.isArray(forme)?forme.join(' / '):String(forme??'—')));grid.append(row);}); tb.append(grid); block.append(tb);
    }
    result.append(block);
  }
  if(v.source)result.append(el('p','source','Source : '+v.source));
}
function afficherSuggestions(){
  const q=$('#verbInput').value.trim(), box=$('#suggestions'); box.innerHTML=''; if(!q)return;
  const n=normaliser(q), na=sansAccents(q);
  VERBES.filter(v=>[v.infinitive,...(v.variants||[])].some(x=>normaliser(x).includes(n)||sansAccents(x).includes(na))).slice(0,8).forEach(v=>{
    const b=el('button','suggestion',v.infinitive); b.type='button'; b.addEventListener('click',()=>{$('#verbInput').value=v.infinitive;box.innerHTML='';conjuguer();}); box.append(b);
  });
}
$('#searchBtn').addEventListener('click',conjuguer);
$('#verbInput').addEventListener('keydown',e=>{if(e.key==='Enter')conjuguer();});
$('#verbInput').addEventListener('input',afficherSuggestions);
chargerDonnees();
