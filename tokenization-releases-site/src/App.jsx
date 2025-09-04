import React, { useMemo, useState } from "react";
import { Search, ChevronDown, X, CheckCircle2, Clock, Building2, RefreshCw, Shield, ArrowUpRight, ExternalLink, Layers, Sparkles } from "lucide-react";
import IdentityWidget from "./IdentityWidget.jsx";
import CreateCFAButton from "./IssuerPanel.jsx";
import { useMergedReleases } from "./releasesDb.js";

const SAMPLE_ISSUES = [
  { id: "TKN-001", title: "Доходные доли: Квартира, Москва, Таганка", issuer: "ООО «Городские Активы»", type: "Недвижимость", instrument: "Долевое право (через SPV)", status: "В обращении", amount: 35000000, raised: 21300000, price: 10000, units: 3500, yield: 12.8, termMonths: 24, risk: "B+", start: "2025-05-15", end: "2027-05-14", tags: ["аренда", "жилая", "Москва"] },
  { id: "TKN-002", title: "Выручка: Кофейни «Север», сеть из 12 точек", issuer: "ООО «Север Ритейл»", type: "Роялти/Revenue Share", instrument: "Денежные требования", status: "В обращении", amount: 18000000, raised: 8400000, price: 1000, units: 18000, yield: 17.5, termMonths: 12, risk: "BB", start: "2025-07-01", end: "2026-06-30", tags: ["ритейл", "кафе", "Санкт-Петербург"] },
  { id: "TKN-003", title: "Займ: Агро-кластер Томская область", issuer: "ООО «СибирьАгро»", type: "Долговой инструмент", instrument: "Заем/денежные требования", status: "Скоро", amount: 50000000, raised: 0, price: 5000, units: 10000, yield: 15.0, termMonths: 18, risk: "B", start: "2025-10-10", end: "2027-04-09", tags: ["агро", "инфраструктура"] },
  { id: "TKN-004", title: "Коворкинг «Призма», г. Казань", issuer: "АО «ТехПарк-Инвест»", type: "Недвижимость", instrument: "Долевое право (через SPV)", status: "Погашен", amount: 22000000, raised: 22000000, price: 2000, units: 11000, yield: 11.2, termMonths: 14, risk: "A-", start: "2024-01-15", end: "2025-03-15", tags: ["офисы", "Казань"] },
  { id: "TKN-005", title: "Доходные гаражи: Новосибирск", issuer: "ИП Кузнецов", type: "Недвижимость", instrument: "Денежные требования", status: "В обращении", amount: 12500000, raised: 7900000, price: 500, units: 25000, yield: 13.4, termMonths: 20, risk: "B", start: "2025-04-03", end: "2027-12-03", tags: ["паркинг", "Новосибирск"] },
  { id: "TKN-006", title: "МФО-портфель «Вектор»", issuer: "ООО МФК «Вектор»", type: "Долговой инструмент", instrument: "Денежные требования", status: "В обращении", amount: 40000000, raised: 31400000, price: 1000, units: 40000, yield: 22.0, termMonths: 9, risk: "CCC", start: "2025-06-10", end: "2026-03-10", tags: ["МФО", "портфель"] },
  { id: "TKN-007", title: "Склад-холодильник, Екатеринбург", issuer: "ООО «ЛогистПро»", type: "Недвижимость", instrument: "Долевое право (через SPV)", status: "Скоро", amount: 65000000, raised: 0, price: 10000, units: 6500, yield: 12.0, termMonths: 36, risk: "BBB", start: "2025-11-01", end: "2028-11-01", tags: ["склады", "Екатеринбург"] },
  { id: "TKN-008", title: "Доли в выручке: Онлайн-курсы по IT", issuer: "ООО «ЭдТех+»", type: "Роялти/Revenue Share", instrument: "Денежные требования", status: "В обращении", amount: 9000000, raised: 4100000, price: 1000, units: 9000, yield: 18.0, termMonths: 8, risk: "BB-", start: "2025-08-05", end: "2026-04-05", tags: ["онлайн-образование", "маркетинг"] },
];

const STATUS_COLORS = {
  "В обращении": "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30",
  "Погашен": "bg-zinc-500/10 text-zinc-300 ring-1 ring-zinc-400/30",
  "Скоро": "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/30",
};

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
      <div className="rounded-xl bg-white/5 p-2"><Icon size={18} className="text-white/80"/></div>
      <div>
        <div className="text-xs text-white/60">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Progress({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Currency({ value }) { return <span>{value.toLocaleString("ru-RU")} ₽</span>; }

function Card({ item, onOpen }) {
  const progress = Math.round((item.raised / item.amount) * 100);
  const color = STATUS_COLORS[item.status] || "bg-white/10 text-white/80";
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>{item.status}</span>
        <div className="text-xs text-white/50">№ {item.id}</div>
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="text-base font-semibold leading-tight flex items-start gap-2">
          <Layers size={18} className="text-white/60 mt-0.5"/>
          {item.title}
        </h3>
        <div className="text-sm text-white/60 flex items-center gap-2"><Building2 size={16}/> {item.issuer}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-white/50">Тип</div>
          <div className="font-medium">{item.type}</div>
        </div>
        <div className="space-y-1">
          <div className="text-white/50">Инструмент</div>
          <div className="font-medium">{item.instrument}</div>
        </div>
        <div className="space-y-1">
          <div className="text-white/50">Доходность</div>
          <div className="font-medium">{item.yield}% годовых</div>
        </div>
        <div className="space-y-1">
          <div className="text-white/50">Срок</div>
          <div className="font-medium">{item.termMonths} мес.</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="text-white/60">Собрано / Объём</div>
          <div className="font-semibold"><Currency value={item.raised}/> / <Currency value={item.amount}/></div>
        </div>
        <Progress value={progress}/>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => onOpen(item)} className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition">
          Смотреть выпуск <ArrowUpRight size={16}/>
        </button>
        <button disabled={item.status!=="В обращении"} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5 transition disabled:opacity-50">
          Инвестировать
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Все");
  const [type, setType] = useState("Все типы");
  const [sort, setSort] = useState("По умолчанию");
  const [active, setActive] = useState(null);

  // данные = (новые из локальной "БД") + (образцы)
  const dataset = useMergedReleases(SAMPLE_ISSUES);

  const issues = useMemo(() => {
    let arr = [...dataset];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((i) => [i.title, i.issuer, i.id, i.type, i.instrument, ...(i.tags||[])].join(" ").toLowerCase().includes(s));
    }
    if (status !== "Все") arr = arr.filter((i) => i.status === status);
    if (type !== "Все типы") arr = arr.filter((i) => i.type === type);
    switch (sort) {
      case "Доходность": arr.sort((a,b)=> b.yield - a.yield); break;
      case "Объём выпуска": arr.sort((a,b)=> b.amount - a.amount); break;
      case "Прогресс": arr.sort((a,b)=> (b.raised/b.amount) - (a.raised/a.amount)); break;
      default: break;
    }
    return arr;
  }, [dataset, q, status, type, sort]);

  const total = dataset.length;
  const activeCount = dataset.filter(i=>i.status === "В обращении").length;
  const soonCount = dataset.filter(i=>i.status === "Скоро").length;
  const closedCount = dataset.filter(i=>i.status === "Погашен").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(70%_50%_at_50%_-20%,rgba(83,143,255,0.25),transparent),linear-gradient(180deg,#0b1020, #0b1020)] text-white">
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[#0b1020]/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400"/>
            <div className="font-semibold">Кейс.Токены</div>
            <span className="ml-3 text-white/50 hidden md:inline">Платформа токенизации активов</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#" className="hover:text-white">Выпуски</a>
            <a href="#how" className="hover:text-white">Как это работает</a>
            <a href="#about" className="hover:text-white">О платформе</a>
          </nav>
          <div className="flex items-center gap-3">
            <IdentityWidget />
            <CreateCFAButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles size={14}/> Каталог выпусков
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Выпуски токенизированных активов</h1>
            <p className="mt-2 text-white/60 max-w-2xl">Прозрачные условия, метрики прогресса и статусы. Фильтруйте по типу актива, доходности и стадиям.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
            <Stat icon={RefreshCw} label="Всего выпусков" value={total} />
            <Stat icon={CheckCircle2} label="В обращении" value={activeCount} />
            <Stat icon={Clock} label="Скоро" value={soonCount} />
            <Stat icon={Shield} label="Погашено" value={closedCount} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"/>
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск по названию, эмитенту, тегам…"
                     className="w-full rounded-2xl bg-[#0f162c] border border-white/10 px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/30" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select value={status} onChange={(e)=>setStatus(e.target.value)} className="appearance-none rounded-2xl bg-[#0f162c] border border-white/10 px-3 py-2 pr-8 text-sm">
                  <option>Все</option>
                  <option>В обращении</option>
                  <option>Скоро</option>
                  <option>Погашен</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50"/>
              </div>
              <div className="relative">
                <select value={type} onChange={(e)=>setType(e.target.value)} className="appearance-none rounded-2xl bg-[#0f162c] border border-white/10 px-3 py-2 pr-8 text-sm">
                  <option>Все типы</option>
                  <option>Недвижимость</option>
                  <option>Долговой инструмент</option>
                  <option>Роялти/Revenue Share</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50"/>
              </div>
              <div className="relative">
                <select value={sort} onChange={(e)=>setSort(e.target.value)} className="appearance-none rounded-2xl bg-[#0f162c] border border-white/10 px-3 py-2 pr-8 text-sm">
                  <option>По умолчанию</option>
                  <option>Доходность</option>
                  <option>Объём выпуска</option>
                  <option>Прогресс</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50"/>
              </div>
              {(q || status!=="Все" || type!=="Все типы" || sort!=="По умолчанию") && (
                <button onClick={()=>{ setQ(""); setStatus("Все"); setType("Все типы"); setSort("По умолчанию"); }}
                        className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                  <X size={14}/> Сбросить
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        {issues.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/70">
            Ничего не найдено по вашему запросу.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((it)=> (<Card key={it.id} item={it} onOpen={setActive} />))}
          </div>
        )}
      </section>

      {active && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setActive(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[540px] bg-[#0b1020] border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">Выпуск</div>
              <button onClick={()=>setActive(null)} className="rounded-xl border border-white/10 p-2 hover:bg-white/5"><X size={16}/></button>
            </div>
            <h3 className="mt-1 text-xl font-semibold">{active.title}</h3>
            <div className="mt-1 text-white/60 text-sm flex items-center gap-2"><Building2 size={16}/> {active.issuer}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[active.status] || ''}`}>{active.status}</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 ring-1 ring-white/10">{active.type}</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 ring-1 ring-white/10">{active.instrument}</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-white/70 ring-1 ring-white/10">Риск: {active.risk}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02]">
                <div className="text-white/50">Доходность</div>
                <div className="text-lg font-semibold">{active.yield}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02]">
                <div className="text-white/50">Срок</div>
                <div className="text-lg font-semibold">{active.termMonths} мес.</div>
              </div>
              <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02] col-span-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/60">Собрано / Объём</div>
                  <div className="font-semibold"><Currency value={active.raised}/> / <Currency value={active.amount}/></div>
                </div>
                <div className="mt-2"><Progress value={Math.round((active.raised/active.amount)*100)} /></div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-sm text-white/70">Срок обращения</div>
              <div className="text-sm font-medium">{new Date(active.start).toLocaleDateString("ru-RU")} → {new Date(active.end).toLocaleDateString("ru-RU")}</div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p>Описание выпуска — краткое оффчейн-резюме: актив, модель дохода, риски, отчётность.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Правовая модель: цифровые права/требования, учёт в ИС оператора.</li>
                <li>Права инвестора: доля денежного потока или часть выручки/дохода.</li>
                <li>Ограничения: KYC, лимиты, правила вторичных сделок.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button disabled={active.status!=="В обращении"} className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50">
                Инвестировать
              </button>
              <a href="#" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
                Документы выпуска <ExternalLink size={16}/>
              </a>
            </div>
          </div>
        </div>
      )}

      <section id="how" className="mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-semibold">Как это работает</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="font-medium">1. Верификация</div>
              <div className="mt-1 text-white/70">KYC и проверка эмитента/проекта. Доступ к инвестициям после одобрения.</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="font-medium">2. Выпуск</div>
              <div className="mt-1 text-white/70">Регистрация цифрового права, параметры доходности, объём, сроки, ограничения.</div>
            </div>
            <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="font-medium">3. Оборот</div>
              <div className="mt-1 text-white/70">Размещение, вторичка, отчётность и погашение. Все операции протоколируются.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-5 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold">О платформе</h2>
            <p className="mt-2 text-white/70 text-sm">Демо-витрина портфеля токенизированных активов. Данные фиктивные — для визуализации интерфейса и сценариев.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold">Интеграции</h2>
            <ul className="mt-2 text-white/70 text-sm list-disc pl-5 space-y-1">
              <li>KYC/AML провайдеры и электронная подпись</li>
              <li>Операторы ИС/ЦФА для юридической значимости</li>
              <li>Платёжные шлюзы/банки (ввод/вывод)</li>
              <li>Смарт-контракты: выпуск, оборот, залог, наследование</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between text-sm text-white/60">
          <div>© 2025 Кейс.Токены — демо</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Политика</a>
            <a href="#" className="hover:text-white">Условия</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
