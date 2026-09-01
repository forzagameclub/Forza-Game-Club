const SUPABASE_URL = "https://oipmogsgtclrpwgdlutc.supabase.co";
const SUPABASE_KEY = "sb_publishable__HvYvzZa_2DaEQAoLu1jhA_xqYFYve9";
const pcGrid = document.getElementById('pcGrid');
const bookingDate = document.getElementById('bookingDate');
const bookingModal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
const selectedPc = document.getElementById('selectedPc');
const bookingTitle = document.getElementById('bookingTitle');

const defaultPcStatuses = Array.from({length:16},(_,i)=>{
  const id=i+1;
  let tier, price, specs, games;
  const allGames=['Assetto Corsa','City Car Driving','Forza Horizon 5','Forza Horizon 6','Euro Truck Simulator 2','FiveM'];
  if(id<=8){
    tier='Standart';
    price=4;
    specs='Adi zal';
    games=allGames;
  }else if(id<=12){
    tier='VIP 4K';
    price=5;
    specs='VIP 4K zona';
    games=allGames;
  }else{
    tier='VIP Sadə';
    price=5;
    specs='VIP zona';
    games=allGames.filter(g=>!g.startsWith('Forza Horizon'));
  }
  return {
    id,
    name:`PC-${String(id).padStart(2,'0')}`,
    status:'available',
    tier,
    price,
    specs,
    games
  };
});

const statusLabels = {
  available:'Boş',
  reserved:'Rezerv',
  inuse:'İstifadədə',
  maintenance:'Texniki'
};

const defaultPricing = { standard: 4, vip4k: 5, vipSimple: 5 };
function getPricing(){
  return JSON.parse(localStorage.getItem('fgc_pricing') || 'null') || defaultPricing;
}
function savePricing(p){ localStorage.setItem('fgc_pricing', JSON.stringify(p)); }

function getCustomers(){
  return JSON.parse(localStorage.getItem('fgc_customers') || '[]');
}
function saveCustomers(c){ localStorage.setItem('fgc_customers', JSON.stringify(c)); }

function currentCustomer(){
  return JSON.parse(localStorage.getItem('fgc_current_customer') || 'null');
}
function setCurrentCustomer(c){
  if(c) localStorage.setItem('fgc_current_customer', JSON.stringify(c));
  else localStorage.removeItem('fgc_current_customer');
}

function todayISO(){
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime()-offset*60000).toISOString().slice(0,10);
}
bookingDate.min = todayISO();
bookingDate.value = todayISO();

function getPcPrice(pc){
  const p = getPricing();
  if(pc.tier==='Standart') return p.standard;
  if(pc.tier==='VIP 4K') return p.vip4k;
  return p.vipSimple;
}

function getReservations(){
  return JSON.parse(localStorage.getItem('fgc_reservations') || '[]');
}
function saveReservations(data){
  localStorage.setItem('fgc_reservations', JSON.stringify(data));
}
function getPcStatuses(){
  const saved = JSON.parse(localStorage.getItem('fgc_pc_statuses') || 'null');
  return saved || defaultPcStatuses;
}
function savePcStatuses(data){
  localStorage.setItem('fgc_pc_statuses', JSON.stringify(data));
}

function overlaps(aStart,aEnd,bStart,bEnd){
  return aStart < bEnd && bStart < aEnd;
}


function timeToMinutes(t){
  if(!t || t==='Limitsiz') return null;
  const [h,m]=t.split(':').map(Number);
  return h*60+m;
}
function minutesToTime(mins){
  mins = ((mins % 1440) + 1440) % 1440;
  const h=Math.floor(mins/60), m=mins%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function reservationBlockedWindow(r){
  const start=timeToMinutes(r.start);
  const end=r.end==='Limitsiz' ? 1440 : timeToMinutes(r.end);
  return { start: Math.max(0,start-5), end };
}
function isNowWithin(date,start,end){
  const now=new Date();
  if(date!==todayISO()) return false;
  const cur=now.getHours()*60+now.getMinutes();
  const s=timeToMinutes(start);
  const e=end==='Limitsiz'?1440:timeToMinutes(end);
  return cur>=s && cur<e;
}
function derivedPcStatus(pc, reservationsForDate){
  if(pc.manualStatus && pc.manualStatus!=='auto') return pc.manualStatus;
  const activeNow = reservationsForDate.some(r=>r.status!=='cancelled' && isNowWithin(r.date,r.start,r.end));
  if(activeNow) return 'inuse';
  const now=new Date();
  if(bookingDate.value===todayISO()){
    const cur=now.getHours()*60+now.getMinutes();
    const upcoming=reservationsForDate.some(r=>{
      if(r.status==='cancelled')return false;
      const b=reservationBlockedWindow(r);
      return cur>=b.start && cur<b.end;
    });
    if(upcoming) return 'reserved';
  }
  return reservationsForDate.length ? 'reserved' : 'available';
}

function renderPCs(){
  const reservations = getReservations();
  const statuses = getPcStatuses();
  const date = bookingDate.value;
  pcGrid.innerHTML='';
  statuses.forEach(pc=>{
    const todays = reservations.filter(r=>r.pcId===pc.id && r.date===date && r.status!=='cancelled');
    let derivedStatus = pc.status==='maintenance' ? 'maintenance' : derivedPcStatus(pc, todays);

    const card=document.createElement('article');
    card.className=`pc-card ${derivedStatus}`;
    card.innerHTML=`
      <div class="pc-head">
        <div class="pc-name">${pc.name}</div>
        <span class="status">${statusLabels[derivedStatus]}</span>
      </div>
      <div class="pc-meta">
        <span>🎮 ${pc.tier}</span>
        <span>💳 ${getPcPrice(pc)} AZN/saat</span>
        <span>🕒 ${todays.length ? todays.map(r=>`${r.start}-${r.end}`).join(', ') : 'Boş'}</span>
        <button class="btn btn-ghost dark" type="button" data-games-pc="${pc.id}">Oyunlara bax</button>
      </div>
      ${todays.length ? `<div class="pc-schedule">${todays.map(r=>{
        const b=reservationBlockedWindow(r);
        const prep=minutesToTime(b.start);
        return `<span class="slot-chip buffer">${prep}-${r.start} hazırlıq</span><span class="slot-chip booked">${r.start}-${r.end} rezerv</span>`;
      }).join('')}</div>` : ''}
      <div class="pc-actions">
        <button class="btn ${derivedStatus==='maintenance'?'btn-ghost dark':'btn-primary'}"
          ${derivedStatus==='maintenance'?'disabled':''}
          data-pc="${pc.id}">
          ${derivedStatus==='maintenance'?'Mövcud deyil':'Rezerv et'}
        </button>
      </div>`;
    pcGrid.appendChild(card);
  });
  document.querySelectorAll('[data-pc]').forEach(btn=>{
    btn.addEventListener('click',()=>openBooking(Number(btn.dataset.pc)));
  });
  document.querySelectorAll('[data-games-pc]').forEach(btn=>{
    btn.addEventListener('click',()=>openPcGames(Number(btn.dataset.gamesPc)));
  });
}

function openPcGames(id){
  const pc=getPcStatuses().find(p=>p.id===id);
  document.getElementById('gamesModalTitle').textContent=`${pc.name} • ${pc.tier}`;
  document.getElementById('pcGamesList').innerHTML=pc.games.map(g=>`<div class="admin-item"><div><b>${g}</b></div></div>`).join('');
  document.getElementById('gamesModal').classList.add('open');
}

function openBooking(id){
  const pc=getPcStatuses().find(p=>p.id===id);
  selectedPc.value=id;
  bookingTitle.textContent=pc.name;
  bookingModal.classList.add('open');
}

document.querySelectorAll('[data-close]').forEach(btn=>{
  btn.addEventListener('click',()=>document.getElementById(btn.dataset.close).classList.remove('open'));
});
document.querySelectorAll('.modal').forEach(m=>{
  m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});
});

bookingForm.addEventListener('submit',e=>{
  e.preventDefault();
  const pcId=Number(selectedPc.value);
  const start=document.getElementById('startTime').value;
  const durationRaw=document.getElementById('duration').value;
  const duration=durationRaw==='unlimited' ? 'unlimited' : Number(durationRaw);
  const [h,m]=start.split(':').map(Number);
  let end;
  if(duration==='unlimited'){
    end='Limitsiz';
  }else{
    const totalMinutes = h*60 + m + Math.round(duration*60);
    const endH = Math.floor(totalMinutes/60)%24;
    const endM = totalMinutes%60;
    end=`${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
  }
  const reservations=getReservations();
  const newStart=timeToMinutes(start);
  const newEnd=end==='Limitsiz'?1440:timeToMinutes(end);
  const conflict=reservations.some(r=>{
    if(r.pcId!==pcId || r.date!==bookingDate.value || r.status==='cancelled') return false;
    const blocked=reservationBlockedWindow(r);
    return newStart < blocked.end && blocked.start < newEnd;
  });
  if(conflict){
    alert('Bu saat aralığı boş deyil. Mövcud rezervasiyadan əvvəlki 5 dəqiqəlik hazırlıq müddəti də bloklanır.');
    return;
  }
  const pc = getPcStatuses().find(p=>p.id===pcId);
  const hourlyPrice = getPcPrice(pc);
  const totalPrice = duration==='unlimited' ? null : hourlyPrice * duration;
  const loggedCustomer = currentCustomer();
  reservations.push({
    id:Date.now(),
    pcId,
    customerId: loggedCustomer?.id || null,
    tier: pc.tier,
    hourlyPrice,
    totalPrice,
    date:bookingDate.value,
    start,
    end,
    duration,
    name:document.getElementById('customerName').value.trim(),
    phone:document.getElementById('customerPhone').value.trim(),
    status:'active',
    createdAt:new Date().toISOString()
  });
  saveReservations(reservations);
  bookingForm.reset();
  document.getElementById('startTime').value='18:00';
  bookingModal.classList.remove('open');
  renderPCs();
setInterval(renderPCs, 60000);
  alert(duration==='unlimited' ? 'Rezervasiya yaradıldı! Müddət: Limitsiz' : `Rezervasiya yaradıldı! Məbləğ: ${totalPrice} AZN`);
});

bookingDate.addEventListener('change',renderPCs);

const games=[
  ['🏁','Assetto Corsa','Racing Simulator'],
  ['🚘','City Car Driving','Driving Simulator'],
  ['🌄','Forza Horizon 5','Racing • VIP Sadə PC-lərdə yoxdur'],
  ['🏎️','Forza Horizon 6','Racing • VIP Sadə PC-lərdə yoxdur'],
  ['🚛','Euro Truck Simulator 2','Truck Simulator'],
  ['🌆','FiveM','GTA V Multiplayer']
];
document.getElementById('gameGrid').innerHTML=games.map(g=>`
  <article class="game-card"><div class="game-icon">${g[0]}</div><h3>${g[1]}</h3><p>${g[2]}</p></article>
`).join('');

document.getElementById('menuBtn').addEventListener('click',()=>{
  document.getElementById('mainNav').classList.toggle('open');
});
document.querySelectorAll('#mainNav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('mainNav').classList.remove('open')));

// Admin
const adminModal=document.getElementById('adminModal');
const adminLogin=document.getElementById('adminLogin');
const adminPanel=document.getElementById('adminPanel');
const adminContent=document.getElementById('adminContent');

document.getElementById('openAdmin').addEventListener('click',()=>{
  adminModal.classList.add('open');
});
document.getElementById('adminLoginBtn').addEventListener('click',()=>{
  if(document.getElementById('adminPassword').value==='1234'){
    adminLogin.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    renderAdmin('reservations');
  }else alert('Demo şifrə yanlışdır. Şifrə: 1234');
});
document.getElementById('adminLogoutBtn').addEventListener('click',()=>{
  adminPanel.classList.add('hidden');
  adminLogin.classList.remove('hidden');
  document.getElementById('adminPassword').value='';
});
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    renderAdmin(tab.dataset.tab);
  });
});

function renderAdmin(tab){
  if(tab==='reservations'){
    const rs=getReservations().sort((a,b)=>`${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
    adminContent.innerHTML=`<div class="admin-list">${
      rs.length ? rs.map(r=>`
        <div class="admin-item">
          <div>
            <b>${getPcStatuses().find(p=>p.id===r.pcId)?.name || 'PC'} • ${r.date} ${r.start}-${r.end}</b>
            <small>${r.name} • ${r.phone} • ${r.tier || ''} • ${r.totalPrice===null?'Limitsiz':(r.totalPrice ?? '')+' AZN'} • ${r.status==='cancelled'?'Ləğv olunub':'Aktiv'}</small>
          </div>
          ${r.status!=='cancelled'?`<button data-cancel="${r.id}">Ləğv et</button>`:''}
        </div>`).join('') : '<p style="color:#9aa3b2">Rezervasiya yoxdur.</p>'
    }</div>`;
    document.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',()=>{
      const data=getReservations();
      const item=data.find(x=>x.id===Number(b.dataset.cancel));
      if(item)item.status='cancelled';
      saveReservations(data);renderAdmin('reservations');renderPCs();
    }));
  }else if(tab==='pcs'){
    const pcs=getPcStatuses();
    adminContent.innerHTML=`<div class="admin-list">${pcs.map(p=>`
      <div class="admin-item">
        <div><b>${p.name}</b><small>${p.tier} • <span class="admin-badge">${(p.manualStatus||'auto')==='auto'?'Avtomatik':'Manual: '+statusLabels[p.manualStatus]}</span></small></div>
        <select class="status-select" data-status-pc="${p.id}">
          <option value="auto" ${(p.manualStatus||'auto')==='auto'?'selected':''}>Avtomatik</option>
          <option value="reserved" ${p.manualStatus==='reserved'?'selected':''}>Rezerv</option>
          <option value="inuse" ${p.manualStatus==='inuse'?'selected':''}>İstifadədə</option>
          <option value="maintenance" ${p.manualStatus==='maintenance'?'selected':''}>Texniki</option>
          <option value="available" ${p.manualStatus==='available'?'selected':''}>Boş</option>
        </select>
      </div>`).join('')}</div>`;
    document.querySelectorAll('[data-status-pc]').forEach(s=>s.addEventListener('change',()=>{
      const pcs=getPcStatuses();
      const pc=pcs.find(p=>p.id===Number(s.dataset.statusPc));
      pc.manualStatus=s.value;
      pc.status=s.value==='maintenance'?'maintenance':'available';
      savePcStatuses(pcs);renderAdmin('pcs');renderPCs();
    }));
  }else if(tab==='customers'){
    const cs=getCustomers();
    adminContent.innerHTML=`
      <div class="admin-grid-form">
        <label>Ad<input id="newCustName" placeholder="Müştəri adı"></label>
        <label>Telefon<input id="newCustPhone" placeholder="+994..."></label>
      </div>
      <button class="btn btn-primary full" id="addCustomerBtn">Müştəri əlavə et</button>
      <div class="admin-list" style="margin-top:14px">
        ${cs.length?cs.map(c=>`
          <div class="admin-item">
            <div>
              <b>${c.name}</b>
              <small>${c.phone} • Bonus: <span class="bonus">${c.bonus||0} AZN</span> • <span class="${c.blacklisted?'blacklisted':''}">${c.blacklisted?'Qara siyahı':'Aktiv'}</span></small>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <button data-bonus="${c.id}">+ Bonus</button>
              <button data-blacklist="${c.id}">${c.blacklisted?'Aktiv et':'Qara siyahı'}</button>
            </div>
          </div>`).join(''):'<p style="color:#9aa3b2">Müştəri yoxdur.</p>'}
      </div>`;
    document.getElementById('addCustomerBtn').addEventListener('click',()=>{
      const name=document.getElementById('newCustName').value.trim();
      const phone=document.getElementById('newCustPhone').value.trim();
      if(!name||!phone)return alert('Ad və telefon daxil edin.');
      const cs=getCustomers();
      cs.push({id:Date.now(),name,phone,bonus:0,blacklisted:false});
      saveCustomers(cs);renderAdmin('customers');
    });
    document.querySelectorAll('[data-bonus]').forEach(b=>b.addEventListener('click',()=>{
      const amount=Number(prompt('Neçə AZN bonus yüklənsin?','5'));
      if(!amount||amount<0)return;
      const cs=getCustomers();const c=cs.find(x=>x.id===Number(b.dataset.bonus));
      c.bonus=(c.bonus||0)+amount;saveCustomers(cs);renderAdmin('customers');
    }));
    document.querySelectorAll('[data-blacklist]').forEach(b=>b.addEventListener('click',()=>{
      const cs=getCustomers();const c=cs.find(x=>x.id===Number(b.dataset.blacklist));
      c.blacklisted=!c.blacklisted;saveCustomers(cs);renderAdmin('customers');
    }));
  }else if(tab==='pricing'){
    const p=getPricing();
    adminContent.innerHTML=`
      <div class="admin-grid-form">
        <label>Adi zal (AZN/saat)<input type="number" step="0.5" id="priceStandard" value="${p.standard}"></label>
        <label>VIP 4K (AZN/saat)<input type="number" step="0.5" id="priceVip4k" value="${p.vip4k}"></label>
        <label>VIP Sadə (AZN/saat)<input type="number" step="0.5" id="priceVipSimple" value="${p.vipSimple}"></label>
      </div>
      <button class="btn btn-primary full" id="savePricingBtn">Qiymətləri yadda saxla</button>`;
    document.getElementById('savePricingBtn').addEventListener('click',()=>{
      savePricing({
        standard:Number(document.getElementById('priceStandard').value),
        vip4k:Number(document.getElementById('priceVip4k').value),
        vipSimple:Number(document.getElementById('priceVipSimple').value)
      });
      renderPCs();alert('Qiymətlər yeniləndi.');
    });
  }else if(tab==='games'){
    adminContent.innerHTML=`<p style="color:#9aa3b2">Demo versiyada oyun siyahısı koddan gəlir. Real database mərhələsində admin buradan oyun əlavə/silə və hansı PC qrupunda olduğunu dəyişə biləcək.</p>`;
  }else if(tab==='settings'){
    adminContent.innerHTML=`
      <div class="admin-grid-form">
        <label>İş saatı<input value="10:00 – 02:00"></label>
        <label>Əlaqə nömrəsi<input value="+994 XX XXX XX XX"></label>
        <label>Ünvan<input value="Sumqayıt, Azərbaycan"></label>
        <label>WhatsApp<input value="+994 XX XXX XX XX"></label>
      </div>
      <button class="btn btn-primary full" onclick="alert('Demo ayarları saxlanıldı')">Ayarları yadda saxla</button>`;
  }
}


// Customer account demo
const accountModal=document.getElementById('accountModal');
document.getElementById('openAccount').addEventListener('click',()=>{
  accountModal.classList.add('open');
  refreshCustomerDashboard();
});
document.querySelectorAll('[data-auth]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[data-auth]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('googleAuth').classList.toggle('hidden',t.dataset.auth!=='google');
  document.getElementById('phoneAuth').classList.toggle('hidden',t.dataset.auth!=='phone');
}));
document.getElementById('googleDemoBtn').addEventListener('click',()=>{
  const c={id:101,name:'Demo Google User',phone:'',email:'demo@gmail.com',bonus:0,blacklisted:false};
  let cs=getCustomers(); if(!cs.some(x=>x.id===c.id)){cs.push(c);saveCustomers(cs);}
  setCurrentCustomer(c); refreshCustomerDashboard();
});
document.getElementById('sendWaCodeBtn').addEventListener('click',()=>{
  const phone=document.getElementById('waPhone').value.trim();
  if(!phone)return alert('Telefon nömrəsi daxil edin.');
  document.getElementById('waVerify').classList.remove('hidden');
  alert('Demo kod: 123456');
});
document.getElementById('verifyWaCodeBtn').addEventListener('click',()=>{
  if(document.getElementById('waCode').value!=='123456')return alert('Kod yanlışdır.');
  const phone=document.getElementById('waPhone').value.trim();
  let cs=getCustomers();
  let c=cs.find(x=>x.phone===phone);
  if(!c){c={id:Date.now(),name:'WhatsApp istifadəçisi',phone,bonus:0,blacklisted:false};cs.push(c);saveCustomers(cs);}
  setCurrentCustomer(c); refreshCustomerDashboard();
});
function refreshCustomerDashboard(){
  const c=currentCustomer();
  const dash=document.getElementById('customerDashboard');
  if(!c){dash.classList.add('hidden');return;}
  dash.classList.remove('hidden');
  const latest=getCustomers().find(x=>x.id===c.id)||c;
  document.getElementById('customerBonus').textContent=(latest.bonus||0)+' AZN';
  document.getElementById('customerStatus').textContent=latest.blacklisted?'Qara siyahı':'Aktiv';
  const mine=getReservations().filter(r=>r.customerId===c.id);
  document.getElementById('myReservations').innerHTML=mine.length?mine.map(r=>`
    <div class="admin-item"><div><b>${getPcStatuses().find(p=>p.id===r.pcId)?.name} • ${r.date}</b>
    <small>${r.start}-${r.end} • ${r.status==='cancelled'?'Ləğv olunub':'Aktiv'}</small></div></div>`).join('')
    :'<p style="color:#9aa3b2">Rezervasiya yoxdur.</p>';
}


// Chat
const chatModal=document.getElementById('chatModal');
const chatBox=document.getElementById('chatBox');
const chatTitle=document.getElementById('chatTitle');
const chatEyebrow=document.getElementById('chatEyebrow');
let chatMode='ai';

function addMsg(text,who='bot'){
  const div=document.createElement('div');
  div.className=`msg ${who}`;
  div.textContent=text;
  chatBox.appendChild(div);
  chatBox.scrollTop=chatBox.scrollHeight;
}
function openChat(mode){
  chatMode=mode;chatBox.innerHTML='';
  if(mode==='ai'){
    chatTitle.textContent='Forza AI';
    chatEyebrow.textContent='AI DƏSTƏK';
    addMsg('Salam! Forza Game Club üzrə sizə necə kömək edə bilərəm?');
  }else{
    chatTitle.textContent='Canlı operator';
    chatEyebrow.textContent='CANLI DƏSTƏK';
    addMsg('Salam! Mesajınızı yazın. Demo versiyada operator cavabı simulyasiya edilir.');
  }
  chatModal.classList.add('open');
}
document.getElementById('aiSupportBtn').addEventListener('click',()=>openChat('ai'));
document.getElementById('liveSupportBtn').addEventListener('click',()=>openChat('live'));

document.getElementById('chatForm').addEventListener('submit',e=>{
  e.preventDefault();
  const input=document.getElementById('chatInput');
  const text=input.value.trim();
  if(!text)return;
  addMsg(text,'user');input.value='';
  setTimeout(()=>{
    if(chatMode==='live'){
      addMsg('Mesajınız qəbul edildi. Operator qısa zamanda cavab verəcək.');
    }else{
      const t=text.toLowerCase();
      if(t.includes('saat')||t.includes('açıq')) addMsg('Demo məlumatına görə klub hər gün 10:00–02:00 arası açıqdır.');
      else if(t.includes('oyun')) addMsg('Mövcud oyunlar: Assetto Corsa, City Car Driving, Forza Horizon 5/6, Euro Truck Simulator 2 və FiveM. VIP Sadə kompüterlərdə Forza Horizon 5/6 yoxdur.');
      else if(t.includes('qiym')||t.includes('neçə')||t.includes('azn')) addMsg('Adi zal 4 AZN/saat, VIP Sadə və VIP 4K isə 5 AZN/saatdır.');
      else if(t.includes('rezerv')) addMsg('Rezervasiya bölməsində PC-ni, tarixi, saatı və müddəti seçərək yer ayıra bilərsiniz.');
      else if(t.includes('ünvan')||t.includes('yer')) addMsg('Dəqiq ünvan növbəti mərhələdə xəritə ilə əlavə olunacaq.');
      else addMsg('Bu sual üçün canlı operatora yönləndirmə funksiyasını növbəti mərhələdə real backend-ə qoşacağıq.');
    }
  },500);
});

renderPCs();
