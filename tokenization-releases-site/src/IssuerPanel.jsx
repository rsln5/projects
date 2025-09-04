import React, { useMemo, useState } from "react";
import { saveRelease, kycStatus } from "./releasesDb.js";
import { X, Check, Calendar, Layers, Building2, Percent, Tag } from "lucide-react";

const TYPES = ["Недвижимость","Долговой инструмент","Роялти/Revenue Share"];
const INSTR = ["Долевое право (через SPV)","Денежные требования","Заем/денежные требования"];
const STATUS = ["В обращении","Скоро","Погашен"];

function L({children}){return <div className="text-sm text-white/70 mb-1">{children}</div>}
function Input(p){return <input {...p} className={`w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30 ${p.className||""}`}/>;}
function Select(p){return <select {...p} className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm"/>;}
function FileInput({onChange}){return <input type="file" onChange={e=>onChange(e.target.files?.[0]||null)} className="text-sm file:mr-3 file:rounded-lg file:border-none file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/15"/>}

export default function CreateCFAButton(){
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    title:"", issuer:"", type:TYPES[0], instrument:INSTR[0], status:STATUS[0],
    amount:"", price:"", yield:"", termMonths:"", risk:"BB", start:"", end:"",
    tags:"", docs:{offer:null,memo:null}
  });

  const kycOk = kycStatus()==="ok";
  const units = useMemo(()=> {
    const a = Number(form.amount||0), p = Number(form.price||0);
    return p>0 ? Math.round(a/p) : 0;
  }, [form.amount, form.price]);

  function set(k,v){ setForm(f=>({...f,[k]:v})); }
  function setDoc(k, f){ setForm(f=>({...f, docs:{...f.docs,[k]:f}})); }

  function canPublish(){
    return kycOk && form.title && form.issuer && Number(form.amount)>0 && Number(form.price)>0 && form.start && form.end;
  }

  function publish(){
    if(!canPublish()){ alert("Заполни обязательные поля и пройди идентификацию."); return; }
    const id = "DIY-" + String(Date.now()).slice(-6);
    const obj = {
      id,
      title: form.title,
      issuer: form.issuer,
      type: form.type,
      instrument: form.instrument,
      status: form.status,
      amount: Number(form.amount),
      raised: 0,
      price: Number(form.price),
      units,
      yield: Number(form.yield||0),
      termMonths: Number(form.termMonths||0),
      risk: form.risk || "—",
      start: form.start,
      end: form.end,
      tags: (form.tags||"").split(",").map(s=>s.trim()).filter(Boolean),
      docs: { offerName: form.docs.offer?.name || null, memoName: form.docs.memo?.name || null },
      createdAt: new Date().toISOString()
    };
    saveRelease(obj);
    setOpen(false);
    setStep(1);
    alert("Выпуск ЦФА опубликован в каталоге.");
  }

  return (
    <>
      <button onClick={()=>setOpen(true)}
        className="rounded-xl bg-white text-slate-900 px-3 py-2 text-sm font-semibold hover:bg-white/90">
        Создать ЦФА
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[760px] bg-[#0b1020] border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">Новый выпуск ЦФА</div>
              <button onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 p-2 hover:bg-white/5"><X size={16}/></button>
            </div>

            {!kycOk && (
              <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-200 p-3 text-sm">
                Для публикации требуется идентификация. Откройте виджет «Идентифицирован» в шапке и завершите KYC.
              </div>
            )}

            <div className="mt-4 grid gap-4">
              {step===1 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <L>Название выпуска</L>
                    <Input value={form.title} onChange={e=>set("title", e.target.value)} placeholder="Доходные доли: Апартаменты, Москва" />
                  </div>
                  <div>
                    <L>Эмитент</L>
                    <Input value={form.issuer} onChange={e=>set("issuer", e.target.value)} placeholder="ООО «…»" />
                  </div>
                  <div>
                    <L>Тип актива</L>
                    <Select value={form.type} onChange={e=>set("type", e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</Select>
                  </div>
                  <div>
                    <L>Инструмент</L>
                    <Select value={form.instrument} onChange={e=>set("instrument", e.target.value)}>{INSTR.map(t=><option key={t}>{t}</option>)}</Select>
                  </div>
                  <div>
                    <L>Статус выпуска</L>
                    <Select value={form.status} onChange={e=>set("status", e.target.value)}>{STATUS.map(t=><option key={t}>{t}</option>)}</Select>
                  </div>
                  <div>
                    <L><Tag size={14} className="inline mr-1"/>Теги (через запятую)</L>
                    <Input value={form.tags} onChange={e=>set("tags", e.target.value)} placeholder="Москва, аренда, апартаменты" />
                  </div>
                </div>
              )}

              {step===2 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <L><Layers size={14} className="inline mr-1"/>Объём выпуска (₽)</L>
                    <Input type="number" value={form.amount} onChange={e=>set("amount", e.target.value)} placeholder="35000000" />
                  </div>
                  <div>
                    <L>Номинал токена (₽)</L>
                    <Input type="number" value={form.price} onChange={e=>set("price", e.target.value)} placeholder="10000" />
                  </div>
                  <div>
                    <L><Percent size={14} className="inline mr-1"/>Доходность, % годовых</L>
                    <Input type="number" value={form.yield} onChange={e=>set("yield", e.target.value)} placeholder="12.5" />
                  </div>
                  <div>
                    <L>Срок обращения, мес.</L>
                    <Input type="number" value={form.termMonths} onChange={e=>set("termMonths", e.target.value)} placeholder="24" />
                  </div>
                  <div>
                    <L>Рейтинг/риск</L>
                    <Input value={form.risk} onChange={e=>set("risk", e.target.value)} placeholder="BB, B+, A- …" />
                  </div>
                  <div className="rounded-xl border border-white/10 p-3 text-sm text-white/70">
                    Расчитанное количество токенов: <b>{units.toLocaleString("ru-RU")}</b>
                  </div>
                </div>
              )}

              {step===3 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <L><Calendar size={14} className="inline mr-1"/>Начало размещения</L>
                    <Input type="date" value={form.start} onChange={e=>set("start", e.target.value)} />
                  </div>
                  <div>
                    <L>Окончание/погашение</L>
                    <Input type="date" value={form.end} onChange={e=>set("end", e.target.value)} />
                  </div>
                </div>
              )}

              {step===4 && (
                <div className="grid gap-4">
                  <div>
                    <L>Документы выпуска</L>
                    <div className="grid md:grid-cols-2 gap-3 rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                      <div><div className="text-sm text-white/60 mb-1">Оферта/условия</div><FileInput onChange={f=>setDoc("offer", f)} /></div>
                      <div><div className="text-sm text-white/60 mb-1">Меморандум/презентация</div><FileInput onChange={f=>setDoc("memo", f)} /></div>
                    </div>
                    <div className="text-xs text-white/50 mt-2">В демо файлы не отправляются на сервер, сохраняются только их названия.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3 text-sm text-white/70">
                    <Building2 size={14} className="inline mr-1"/> Для юридической публикации ЦФА подключите оператора ИС/ЦФА или смарт-контракт. В демо публикация появляется в каталоге сайта.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={()=>setStep(s=>Math.max(1,s-1))}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Назад</button>
              {step<4 ? (
                <button onClick={()=>setStep(s=>Math.min(4,s+1))}
                  className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90">Далее</button>
              ) : (
                <button onClick={publish} className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90">
                  <Check size={16}/> Опубликовать ЦФА
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
