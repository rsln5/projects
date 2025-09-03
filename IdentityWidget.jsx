import React, { useEffect, useMemo, useState } from "react";
import {
  UserRound, ShieldCheck, ShieldAlert, Clock, Loader2, X,
  IdCard, FileUp, Camera, Check, ChevronDown
} from "lucide-react";

const STATUS = {
  guest:   { label: "Гость",           color: "bg-amber-500/10 text-amber-300 border-amber-400/30",   icon: ShieldAlert },
  pending: { label: "На проверке",     color: "bg-sky-500/10 text-sky-300 border-sky-400/30",         icon: Clock },
  ok:      { label: "Идентифицирован", color: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30", icon: ShieldCheck },
  reject:  { label: "Отказано",        color: "bg-rose-500/10 text-rose-300 border-rose-400/30",      icon: ShieldAlert },
};

const empty = {
  status: "guest",
  profile: { fullName: "", dob: "", citizenship: "RU", docNumber: "", address: "" },
  files:   { idFront: null, idBack: null, selfie: null },
  consents:{ terms: false, personal: false },
};

const LS_KEY = "kyc_demo_state_v1";

function useKycState() {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || empty; } catch { return empty; }
  });
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(state)); }, [state]);
  const reset = () => setState(empty);
  return [state, setState, reset];
}

function StepHeader({ step }) {
  const items = [
    { n: 1, t: "Профиль" },
    { n: 2, t: "Документы" },
    { n: 3, t: "Селфи" },
    { n: 4, t: "Согласия" },
  ];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        {items.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border
              ${step >= s.n ? "bg-white text-slate-900 border-white" : "border-white/20 text-white/60"}`}>
              {s.n}
            </div>
            <div className={`text-sm ${step === s.n ? "text-white" : "text-white/60"}`}>{s.t}</div>
            {i < items.length - 1 && <div className="flex-1 h-px bg-white/10 mx-2" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FileInput({ label, value, onChange, accept }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else setPreview(null);
  }, [value]);
  return (
    <label className="block">
      <div className="text-sm text-white/70 mb-1">{label}</div>
      <div className="rounded-xl border border-white/15 bg-white/[0.02] p-3 flex items-center gap-3">
        <FileUp size={18} className="text-white/60" />
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)}
               className="text-sm file:mr-3 file:rounded-lg file:border-none file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/15" />
      </div>
      {preview && <img src={preview} alt="preview" className="mt-2 rounded-lg border border-white/10 max-h-40" />}
    </label>
  );
}

export default function IdentityWidget() {
  const [state, setState, reset] = useKycState();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const s = useMemo(() => STATUS[state.status], [state.status]);
  const Icon = s.icon || UserRound;

  function setProfile(k, v) { setState((p) => ({ ...p, profile: { ...p.profile, [k]: v } })); }
  function setFile(k, f)    { setState((p) => ({ ...p, files:   { ...p.files,   [k]: f } })); }
  function setConsent(k, v) { setState((p) => ({ ...p, consents:{ ...p.consents,[k]: v } })); }

  function canSubmit() {
    const { profile, files, consents } = state;
    return profile.fullName && profile.dob && profile.docNumber &&
           files.idFront && files.idBack && files.selfie &&
           consents.terms && consents.personal;
  }

  async function submit() {
    if (!canSubmit()) return alert("Заполни все шаги и отметь согласия.");
    // Здесь можно дернуть ваше API. Пока — имитация:
    setState((p) => ({ ...p, status: "pending" }));
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-white/5 transition
                    border-white/15 ${s.color}`}>
        <Icon size={16} />
        <span>{s.label}</span>
        <ChevronDown size={14} className="opacity-70" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-[#0b1020] border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">Идентификация пользователя</div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-white/10 p-2 hover:bg-white/5"><X size={16}/></button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.color}`}>{s.label}</span>
              {state.status === "pending" && <Loader2 size={16} className="animate-spin text-sky-300" />}
            </div>

            <div className="mt-4">
              <StepHeader step={step} />

              {step === 1 && (
                <div className="space-y-3">
                  <label className="block">
                    <div className="text-sm text-white/70 mb-1">ФИО</div>
                    <input value={state.profile.fullName} onChange={(e)=>setProfile("fullName", e.target.value)}
                      placeholder="Иванов Иван Иванович"
                      className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <div className="text-sm text-white/70 mb-1">Дата рождения</div>
                      <input type="date" value={state.profile.dob} onChange={(e)=>setProfile("dob", e.target.value)}
                        className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30" />
                    </label>
                    <label className="block">
                      <div className="text-sm text-white/70 mb-1">Гражданство</div>
                      <select value={state.profile.citizenship} onChange={(e)=>setProfile("citizenship", e.target.value)}
                        className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm">
                        <option value="RU">Россия</option>
                        <option value="KZ">Казахстан</option>
                        <option value="BY">Беларусь</option>
                        <option value="AM">Армения</option>
                        <option value="KG">Киргизия</option>
                        <option value="OTHER">Другое</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <div className="text-sm text-white/70 mb-1">Номер документа</div>
                    <input value={state.profile.docNumber} onChange={(e)=>setProfile("docNumber", e.target.value)}
                      placeholder="серия и номер"
                      className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30" />
                  </label>
                  <label className="block">
                    <div className="text-sm text-white/70 mb-1">Адрес регистрации</div>
                    <input value={state.profile.address} onChange={(e)=>setProfile("address", e.target.value)}
                      placeholder="город, улица, дом, кв."
                      className="w-full rounded-xl bg-[#0f162c] border border-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30" />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-sm text-white/70 flex items-center gap-2"><IdCard size={16}/> Загрузите разворот документа</div>
                  <FileInput label="Лицевая сторона" value={state.files.idFront} onChange={(f)=>setFile("idFront", f)} accept="image/*,.pdf" />
                  <FileInput label="Обратная сторона" value={state.files.idBack}  onChange={(f)=>setFile("idBack", f)}  accept="image/*,.pdf" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="text-sm text-white/70 flex items-center gap-2"><Camera size={16}/> Селфи с документом</div>
                  <FileInput label="Загрузить фото" value={state.files.selfie} onChange={(f)=>setFile("selfie", f)} accept="image/*" />
                  <p className="text-xs text-white/50">Подсказка: хорошее освещение, лицо и документ полностью в кадре.</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={state.consents.terms} onChange={(e)=>setConsent("terms", e.target.checked)} />
                    <span className="text-sm text-white/80">Согласен(а) с условиями сервиса</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={state.consents.personal} onChange={(e)=>setConsent("personal", e.target.checked)} />
                    <span className="text-sm text-white/80">Даю согласие на обработку персональных данных</span>
                  </label>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button onClick={()=>setStep((s)=>Math.max(1, s-1))}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">Назад</button>
                {step < 4 ? (
                  <button onClick={()=>setStep((s)=>Math.min(4, s+1))}
                    className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90">Далее</button>
                ) : (
                  <button onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90">
                    Отправить на проверку
                  </button>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="text-xs text-white/50 mb-2">Демо-режим (имитация ответа KYC-провайдера)</div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setState((p)=>({ ...p, status:"ok" }))}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 px-3 py-1.5 text-sm hover:bg-emerald-500/15">
                    <Check size={14}/> Одобрить
                  </button>
                  <button onClick={()=>setState((p)=>({ ...p, status:"reject" }))}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 px-3 py-1.5 text-sm hover:bg-rose-500/15">
                    Отказать
                  </button>
                  <button onClick={()=>setState((p)=>({ ...p, status:"pending" }))}
                          className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 text-sky-300 px-3 py-1.5 text-sm hover:bg-sky-500/15">
                    На проверке
                  </button>
                  <button onClick={reset}
                          className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Сбросить</button>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/50">
                Интеграция: вызовите ваше API здесь (POST /api/kyc/submit) и обновляйте статус по вебхуку.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
